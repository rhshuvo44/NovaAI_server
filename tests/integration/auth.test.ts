import request from 'supertest';
import { createApp } from '@app';
import { createTestUser } from '../factories/user.factory';
import { setupClerkMock, TEST_BEARER_TOKEN } from '../mocks/clerk.mock';

jest.mock('@modules/auth/services/clerk-verification.service');
jest.mock('@config/clerk', () => ({
  clerkClient: {
    users: {
      getUser: jest.fn(),
    },
  },
}));

const app = createApp();

describe('Auth API', () => {
  describe('POST /api/v1/auth/session', () => {
    it('returns 422 when sessionToken is missing', async () => {
      const res = await request(app).post('/api/v1/auth/session').send({});
      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
    });

    it('bootstraps a session for an existing user and returns tokens', async () => {
      const user = await createTestUser();
      const { mockClerkSessionFor } = setupClerkMock();
      mockClerkSessionFor(user);

      const { clerkClient } = jest.requireMock('@config/clerk') as {
        clerkClient: { users: { getUser: jest.Mock } };
      };
      clerkClient.users.getUser.mockResolvedValue({
        id: user.clerkId,
        emailAddresses: [{ id: 'email_1', emailAddress: user.email }],
        primaryEmailAddressId: 'email_1',
        firstName: user.firstName,
        lastName: user.lastName,
        imageUrl: user.avatarUrl,
      });

      const res = await request(app)
        .post('/api/v1/auth/session')
        .send({ sessionToken: TEST_BEARER_TOKEN });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(user.email);
      expect(typeof res.body.data.accessToken).toBe('string');
      expect(typeof res.body.data.refreshToken).toBe('string');
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('returns 401 without an Authorization header', async () => {
      const res = await request(app).get('/api/v1/auth/me');
      expect(res.status).toBe(401);
    });

    it('returns the authenticated user when a valid token is provided', async () => {
      const user = await createTestUser();
      const { mockClerkSessionFor } = setupClerkMock();
      mockClerkSessionFor(user);

      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${TEST_BEARER_TOKEN}`);

      expect(res.status).toBe(200);
      expect(res.body.data.email).toBe(user.email);
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    it('returns 422 when refreshToken is missing', async () => {
      const res = await request(app).post('/api/v1/auth/refresh').send({});
      expect(res.status).toBe(422);
    });

    it('returns 401 for an invalid refresh token', async () => {
      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: 'not-a-real-token' });
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('returns 422 when refreshToken is missing', async () => {
      const res = await request(app).post('/api/v1/auth/logout').send({});
      expect(res.status).toBe(422);
    });

    it('returns success even for an already-invalid refresh token (idempotent logout)', async () => {
      const res = await request(app)
        .post('/api/v1/auth/logout')
        .send({ refreshToken: 'some-token-that-does-not-exist' });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
