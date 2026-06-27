import { Request, Response, NextFunction } from 'express';
import { Role, Permission, ROLE_HIERARCHY } from '@constants/index';
import { AuthenticationError, AuthorizationError } from '@shared/errors';

/**
 * Requires the authenticated user's role to be at or above the given
 * minimum role in the hierarchy (USER < MANAGER < ADMIN < SUPER_ADMIN).
 */
export function requireRole(minimumRole: Role) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AuthenticationError('Authentication required'));
      return;
    }

    const userLevel = ROLE_HIERARCHY[req.user.role];
    const requiredLevel = ROLE_HIERARCHY[minimumRole];

    if (userLevel < requiredLevel) {
      next(new AuthorizationError(`This action requires the '${minimumRole}' role or higher`));
      return;
    }

    next();
  };
}

/**
 * Requires the authenticated user to have ALL of the listed permissions.
 */
export function requirePermissions(...permissions: Permission[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AuthenticationError('Authentication required'));
      return;
    }

    const hasAll = permissions.every((p) => req.user!.permissions.includes(p));
    if (!hasAll) {
      next(new AuthorizationError('You do not have the required permissions for this action'));
      return;
    }

    next();
  };
}

/**
 * Requires the authenticated user to have AT LEAST ONE of the listed permissions.
 */
export function requireAnyPermission(...permissions: Permission[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AuthenticationError('Authentication required'));
      return;
    }

    const hasAny = permissions.some((p) => req.user!.permissions.includes(p));
    if (!hasAny) {
      next(new AuthorizationError('You do not have the required permissions for this action'));
      return;
    }

    next();
  };
}

/**
 * Allows the action if the requester owns the resource (req.params[idParam]
 * matches req.user.userId) OR has the given override permission (e.g. an
 * admin permission that lets them act on others' resources).
 */
export function requireOwnershipOrPermission(idParam: string, overridePermission: Permission) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AuthenticationError('Authentication required'));
      return;
    }

    const isOwner = req.params[idParam] === req.user.userId;
    const hasOverride = req.user.permissions.includes(overridePermission);

    if (!isOwner && !hasOverride) {
      next(new AuthorizationError('You do not have permission to access this resource'));
      return;
    }

    next();
  };
}
