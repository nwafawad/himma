import type { RequestHandler } from 'express';

/** Marks a compatibility route and points clients at its canonical successor. */
export const markDeprecatedRoute = (successor: string | ((path: string) => string)): RequestHandler =>
  (req, res, next) => {
    const successorPath = typeof successor === 'function' ? successor(req.path) : successor;
    res.setHeader('X-API-Deprecated', 'true');
    res.append('Link', `<${successorPath}>; rel="successor-version"`);
    next();
  };
