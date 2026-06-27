import { Request, Response, NextFunction } from 'express';
import { verifyClerkSessionToken } from '@modules/auth/services/clerk-verification.service';
import { userService } from '@modules/users/services/user.service';
import { AuthenticationError } from '@shared/errors';
import { AuthenticatedUser } from '@types-internal/index';

function extractBearerToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return null;
  return header.slice('Bearer '.length).trim();
}

/**
 * Requires a valid Clerk session token. Attaches `req.user` populated with
 * the local user record's role and permissions for downstream RBAC checks.
 */
export async function requireAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const token = extractBearerToken(req);
    if (!token) {
      throw new AuthenticationError('Missing authentication token');
    }

    const session = await verifyClerkSessionToken(token);
    const user = await userService.getByClerkId(session.clerkUserId);

    if (!user.isActive) {
      throw new AuthenticationError('This account has been deactivated');
    }

    const permissions = await userService.getPermissionsForUser(user._id.toString(), user.role);

    const authenticatedUser: AuthenticatedUser = {
      userId: user._id.toString(),
      clerkId: user.clerkId,
      email: user.email,
      role: user.role,
      permissions,
      sessionId: session.sessionId,
    };

    req.user = authenticatedUser;
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Optional auth: attaches `req.user` if a valid token is present, but does
 * not reject the request if absent. Useful for endpoints with public +
 * personalized behavior (e.g. public documents that show "favorited" state).
 */
export async function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = extractBearerToken(req);
    if (!token) {
      next();
      return;
    }

    const session = await verifyClerkSessionToken(token);
    const user = await userService.getByClerkId(session.clerkUserId);

    if (user.isActive) {
      const permissions = await userService.getPermissionsForUser(user._id.toString(), user.role);
      req.user = {
        userId: user._id.toString(),
        clerkId: user.clerkId,
        email: user.email,
        role: user.role,
        permissions,
        sessionId: session.sessionId,
      };
    }

    next();
  } catch {
    // optional auth: any failure simply means unauthenticated, not an error
    next();
  }
}
