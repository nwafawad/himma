import test from 'node:test';
import assert from 'node:assert/strict';
import { generateToken } from './services/auth.service.js';
import { LocalJwtAuthProvider } from './middleware/auth.js';
import { signUpSchema, loginSchema } from './validators/auth.schema.js';

test('signUpSchema validates required fields', () => {
  assert.equal(signUpSchema.safeParse({ email: 'user@example.com', password: 'password123' }).success, true);
  assert.equal(signUpSchema.safeParse({ email: 'invalid-email', password: 'password123' }).success, false);
  assert.equal(signUpSchema.safeParse({ email: 'user@example.com', password: '123' }).success, false);
});

test('loginSchema validates credentials structure', () => {
  assert.equal(loginSchema.safeParse({ email: 'user@example.com', password: 'password123' }).success, true);
  assert.equal(loginSchema.safeParse({ email: 'user@example.com', password: '' }).success, false);
});

test('LocalJwtAuthProvider verifies generated JWT tokens correctly', async () => {
  const provider = new LocalJwtAuthProvider();
  const token = generateToken({ id: 'test-user-uuid-123', email: 'test@example.com' });

  const verifiedUser = await provider.verifyToken(token);
  assert.notEqual(verifiedUser, null);
  assert.equal(verifiedUser?.id, 'test-user-uuid-123');
  assert.equal(verifiedUser?.email, 'test@example.com');
  assert.equal(verifiedUser?.role, 'authenticated');
});

test('LocalJwtAuthProvider rejects invalid or corrupted tokens', async () => {
  const provider = new LocalJwtAuthProvider();
  const invalidUser = await provider.verifyToken('invalid.jwt.token');
  assert.equal(invalidUser, null);
});
