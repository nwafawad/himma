import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';

const MAX_REDIRECTS = 3;
const MAX_BODY_BYTES = 1024 * 1024;

export class UnsafeUrlError extends Error {
  readonly code = 'UNSAFE_URL';
  readonly statusCode = 400;

  constructor(message = 'URL resolves to a prohibited network destination.') {
    super(message);
    this.name = 'UnsafeUrlError';
  }
}

const isPrivateIpv4 = (address: string): boolean => {
  const octets = address.split('.').map(Number);
  if (octets.length !== 4 || octets.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return true;
  const [a, b] = octets;
  return a === 0 || a === 10 || a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 0) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 224;
};

const isPrivateIpv6 = (address: string): boolean => {
  const normalized = address.toLowerCase().split('%')[0];
  if (normalized === '::' || normalized === '::1') return true;
  if (normalized.startsWith('fc') || normalized.startsWith('fd') || /^fe[89ab]/.test(normalized)) return true;
  if (normalized.startsWith('ff')) return true;
  if (normalized.startsWith('2001:db8:')) return true;
  const mapped = normalized.match(/::ffff:(\d+\.\d+\.\d+\.\d+)$/)?.[1];
  return mapped ? isPrivateIpv4(mapped) : false;
};

const assertPublicDestination = async (url: URL): Promise<void> => {
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new UnsafeUrlError('Only HTTP and HTTPS URLs are supported.');
  }
  if (url.username || url.password) throw new UnsafeUrlError('URLs containing credentials are not supported.');

  const hostname = url.hostname.startsWith('[') && url.hostname.endsWith(']')
    ? url.hostname.slice(1, -1)
    : url.hostname;
  const literalVersion = isIP(hostname);
  const addresses = literalVersion
    ? [{ address: hostname, family: literalVersion }]
    : await lookup(hostname, { all: true, verbatim: true });
  if (addresses.length === 0) throw new UnsafeUrlError('URL hostname did not resolve.');
  if (addresses.some(({ address, family }) => family === 4 ? isPrivateIpv4(address) : isPrivateIpv6(address))) {
    throw new UnsafeUrlError();
  }
};

const readLimitedText = async (response: Response): Promise<string> => {
  const declaredLength = Number(response.headers.get('content-length') || 0);
  if (declaredLength > MAX_BODY_BYTES) throw new UnsafeUrlError('Metadata response exceeds the 1 MB limit.');
  if (!response.body) return '';

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_BODY_BYTES) {
      await reader.cancel();
      throw new UnsafeUrlError('Metadata response exceeds the 1 MB limit.');
    }
    chunks.push(value);
  }
  const body = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(body);
};

export const fetchPublicHtml = async (input: string): Promise<{ response: Response; html: string }> => {
  const signal = AbortSignal.timeout(4000);
  let current = new URL(input);

  for (let redirects = 0; redirects <= MAX_REDIRECTS; redirects += 1) {
    await assertPublicDestination(current);
    const response = await fetch(current, {
      method: 'GET',
      redirect: 'manual',
      headers: { 'User-Agent': 'Momentum metadata fetcher/1.0', Accept: 'text/html,application/xhtml+xml' },
      signal,
    });
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get('location');
      if (!location || redirects === MAX_REDIRECTS) throw new UnsafeUrlError('URL exceeded the redirect limit.');
      current = new URL(location, current);
      continue;
    }
    const contentType = response.headers.get('content-type')?.toLowerCase() || '';
    if (response.ok && !contentType.includes('text/html') && !contentType.includes('application/xhtml+xml')) {
      throw new UnsafeUrlError('Metadata endpoint did not return HTML.');
    }
    return { response, html: response.ok ? await readLimitedText(response) : '' };
  }
  throw new UnsafeUrlError('URL exceeded the redirect limit.');
};
