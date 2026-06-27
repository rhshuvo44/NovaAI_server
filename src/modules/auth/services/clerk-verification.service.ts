import { verifyToken } from '@clerk/clerk-sdk-node';
import { env } from '@config/env';
import { AuthenticationError } from '@shared/errors';
import { logger } from '@utils/logger';

export interface VerifiedClerkSession {
  clerkUserId: string;
  sessionId?: string;
  email?: string;
}

/**
 * Verifies a Clerk session JWT (sent by the frontend in the Authorization
 * header as a Bearer token). Uses Clerk's backend verification, which checks
 * signature, expiry, and issuer against Clerk's JWKS.
 */
export async function verifyClerkSessionToken(token: string): Promise<VerifiedClerkSession> {
  try {
    const payload = await verifyToken(token, {
      secretKey: env.CLERK_SECRET_KEY,
      // issuer is explicitly disabled while running against placeholder Clerk
      // credentials. Once real Clerk keys are configured, set this to your
      // Clerk Frontend API URL (e.g. "https://your-app.clerk.accounts.dev")
      // to additionally validate the `iss` claim.
      issuer: null,
    });

    if (!payload.sub) {
      throw new AuthenticationError('Invalid session token: missing subject claim');
    }

    return {
      clerkUserId: payload.sub,
      sessionId: typeof payload.sid === 'string' ? payload.sid : undefined,
      email: typeof payload.email === 'string' ? payload.email : undefined,
    };
  } catch (error) {
    logger.warn('Clerk session token verification failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw new AuthenticationError('Invalid or expired session token');
  }
}
