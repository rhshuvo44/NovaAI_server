import { UserModel, IUser } from '@modules/users/models/user.model';
import { Role } from '@constants/index';
import { jwtService } from '@modules/auth/services/jwt.service';

let counter = 0;

export interface CreateTestUserOptions {
  role?: Role;
  email?: string;
  isActive?: boolean;
}

export async function createTestUser(options: CreateTestUserOptions = {}): Promise<IUser> {
  counter += 1;
  return UserModel.create({
    clerkId: `clerk_test_${counter}`,
    email: options.email ?? `test-user-${counter}@example.com`,
    firstName: 'Test',
    lastName: `User${counter}`,
    role: options.role ?? Role.USER,
    isActive: options.isActive ?? true,
    isEmailVerified: true,
  });
}

/**
 * Generates a valid internal access token for a test user, for use in
 * integration tests that exercise endpoints protected by requireAuth.
 *
 * Note: requireAuth in this codebase verifies Clerk session tokens, not
 * internal JWTs directly. Tests that need to go through the full Clerk
 * verification path should mock `verifyClerkSessionToken` instead; this
 * helper is provided for tests against internal-JWT-based flows.
 */
export function generateAccessTokenFor(user: IUser): string {
  return jwtService.signAccessToken({
    userId: user._id.toString(),
    clerkId: user.clerkId,
    email: user.email,
    role: user.role,
  });
}
