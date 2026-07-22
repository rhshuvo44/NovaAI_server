import { Request, Response, NextFunction } from 'express';
import {
  requireRole,
  requirePermissions,
  requireAnyPermission,
  requireOwnershipOrPermission,
} from '@middlewares/rbac.middleware';
import { Role, Permission } from '@constants/index';
import { AuthenticationError, AuthorizationError } from '@shared/errors';
import { AuthenticatedUser } from '@types-internal/index';

function buildMockUser(overrides: Partial<AuthenticatedUser> = {}): AuthenticatedUser {
  return {
    userId: 'user-1',
    email: 'test@example.com',
    role: Role.USER,
    permissions: [],
    ...overrides,
  };
}

function buildMockReq(user?: AuthenticatedUser, params: Record<string, string> = {}): Request {
  return { user, params } as unknown as Request;
}

const mockRes = {} as Response;

describe('requireRole', () => {
  it('calls next() with no error when the user meets the minimum role', () => {
    const req = buildMockReq(buildMockUser({ role: Role.ADMIN }));
    const next = jest.fn() as NextFunction;

    requireRole(Role.MANAGER)(req, mockRes, next);
    expect(next).toHaveBeenCalledWith();
  });

  it('calls next() with AuthorizationError when the user role is below the minimum', () => {
    const req = buildMockReq(buildMockUser({ role: Role.USER }));
    const next = jest.fn() as NextFunction;

    requireRole(Role.ADMIN)(req, mockRes, next);
    expect(next).toHaveBeenCalledWith(expect.any(AuthorizationError));
  });

  it('calls next() with AuthenticationError when there is no authenticated user', () => {
    const req = buildMockReq(undefined);
    const next = jest.fn() as NextFunction;

    requireRole(Role.USER)(req, mockRes, next);
    expect(next).toHaveBeenCalledWith(expect.any(AuthenticationError));
  });
});

describe('requirePermissions', () => {
  it('passes when the user has all required permissions', () => {
    const req = buildMockReq(
      buildMockUser({ permissions: [Permission.DOCUMENT_READ, Permission.DOCUMENT_WRITE] })
    );
    const next = jest.fn() as NextFunction;

    requirePermissions(Permission.DOCUMENT_READ, Permission.DOCUMENT_WRITE)(req, mockRes, next);
    expect(next).toHaveBeenCalledWith();
  });

  it('rejects when the user is missing one of the required permissions', () => {
    const req = buildMockReq(buildMockUser({ permissions: [Permission.DOCUMENT_READ] }));
    const next = jest.fn() as NextFunction;

    requirePermissions(Permission.DOCUMENT_READ, Permission.DOCUMENT_WRITE)(req, mockRes, next);
    expect(next).toHaveBeenCalledWith(expect.any(AuthorizationError));
  });
});

describe('requireAnyPermission', () => {
  it('passes when the user has at least one of the listed permissions', () => {
    const req = buildMockReq(buildMockUser({ permissions: [Permission.ROLE_MANAGE] }));
    const next = jest.fn() as NextFunction;

    requireAnyPermission(Permission.ROLE_MANAGE, Permission.PERMISSION_MANAGE)(req, mockRes, next);
    expect(next).toHaveBeenCalledWith();
  });

  it('rejects when the user has none of the listed permissions', () => {
    const req = buildMockReq(buildMockUser({ permissions: [] }));
    const next = jest.fn() as NextFunction;

    requireAnyPermission(Permission.ROLE_MANAGE, Permission.PERMISSION_MANAGE)(req, mockRes, next);
    expect(next).toHaveBeenCalledWith(expect.any(AuthorizationError));
  });
});

describe('requireOwnershipOrPermission', () => {
  it('passes when the requester owns the resource', () => {
    const req = buildMockReq(buildMockUser({ userId: 'user-1' }), { id: 'user-1' });
    const next = jest.fn() as NextFunction;

    requireOwnershipOrPermission('id', Permission.USER_READ)(req, mockRes, next);
    expect(next).toHaveBeenCalledWith();
  });

  it('passes when the requester has the override permission, even without ownership', () => {
    const req = buildMockReq(
      buildMockUser({ userId: 'user-1', permissions: [Permission.USER_READ] }),
      { id: 'someone-else' }
    );
    const next = jest.fn() as NextFunction;

    requireOwnershipOrPermission('id', Permission.USER_READ)(req, mockRes, next);
    expect(next).toHaveBeenCalledWith();
  });

  it('rejects when neither ownership nor override permission applies', () => {
    const req = buildMockReq(buildMockUser({ userId: 'user-1', permissions: [] }), { id: 'someone-else' });
    const next = jest.fn() as NextFunction;

    requireOwnershipOrPermission('id', Permission.USER_READ)(req, mockRes, next);
    expect(next).toHaveBeenCalledWith(expect.any(AuthorizationError));
  });
});
