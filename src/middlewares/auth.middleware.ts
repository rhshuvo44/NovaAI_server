import { Request, Response, NextFunction } from 'express';
import { jwtService } from '@modules/auth/services/jwt.service';
import { userService } from '@modules/users/services/user.service';
import { AuthenticationError } from '@shared/errors';
import { AuthenticatedUser } from '@types-internal/index';

function extractBearerToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return null;
  return header.slice('Bearer '.length).trim();
}

export async function requireAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const token = extractBearerToken(req);
    if (!token) {
      throw new AuthenticationError('Missing authentication token');
    }

    const payload = jwtService.verifyAccessToken(token);

    const user = await userService.getById(payload.userId);
    if (!user.isActive) {
      throw new AuthenticationError('This account has been deactivated');
    }

    const permissions = await userService.getPermissionsForUser(user._id.toString(), user.role);

    const authenticatedUser: AuthenticatedUser = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      permissions,
    };

    req.user = authenticatedUser;
    next();
  } catch (error) {
    next(error);
  }
}

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

    const payload = jwtService.verifyAccessToken(token);
    const user = await userService.getById(payload.userId);

    if (user.isActive) {
      const permissions = await userService.getPermissionsForUser(user._id.toString(), user.role);
      req.user = {
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
        permissions,
      };
    }

    next();
  } catch {
    next();
  }
}
