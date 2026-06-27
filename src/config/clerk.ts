import { createClerkClient } from '@clerk/clerk-sdk-node';
import { env } from '@config/env';

export const clerkClient = createClerkClient({ secretKey: env.CLERK_SECRET_KEY });

export interface ClerkSessionClaims {
  sub: string; // Clerk user id
  email?: string;
  sid?: string; // session id
  [key: string]: unknown;
}
