import { IUser } from '@modules/users/models/user.model';

/**
 * Mocks the Clerk session verification module so integration tests can
 * simulate an authenticated request without a real Clerk backend. Call this
 * once per test file (typically in a `jest.mock` call at the top) and then
 * use `mockClerkSessionFor(user)` inside individual tests to control which
 * user the next verified request resolves to.
 */
export function setupClerkMock(): { mockClerkSessionFor: (user: IUser) => void } {
  const clerkModule = jest.requireMock('@modules/auth/services/clerk-verification.service') as {
    verifyClerkSessionToken: jest.Mock;
  };

  function mockClerkSessionFor(user: IUser): void {
    clerkModule.verifyClerkSessionToken.mockResolvedValue({
      clerkUserId: user.clerkId,
      sessionId: 'test_session_id',
      email: user.email,
    });
  }

  return { mockClerkSessionFor };
}

export const TEST_BEARER_TOKEN = 'mock.clerk.session.token';
