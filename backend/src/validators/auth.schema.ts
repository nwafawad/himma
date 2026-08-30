/**
 * @file auth.schema.ts
 * @description Shared validation schemas for local authentication (signup, login).
 */

export {
  loginInputSchema as loginSchema,
  signUpInputSchema as signUpSchema,
} from '@himma/contracts';
export type { LoginInput, SignUpInput } from '@himma/contracts';
