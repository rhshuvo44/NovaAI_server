import request from 'supertest';
import { createApp } from '@app';
import { createTestUser, generateAccessTokenFor } from '../factories/user.factory';

const app = createApp();

describe('Auth API', () => {
  describe('POST /api/v1/auth/register', () => {
    it('returns 422 when email is missing', async () => {
      const res = await request(app).post('/api/v1/auth/register').send({ password: 'password123' });
      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
    });

    it('returns 422 when password is too short', async () => {
      const res = await request(app).post('/api/v1/auth/register').send({ email: 'test@example.com', password: '123' });
      expect(res.status).toBe(422);
    });

    it('registers a new user and returns tokens', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ email: 'newuser@example.com', password: 'password123', firstName: 'New', lastName: 'User' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('newuser@example.com');
      expect(typeof res.body.data.accessToken).toBe('string');
      expect(typeof res.body.data.refreshToken).toBe('string');
    });

    it('returns 409 when email already exists', async () => {
      await createTestUser({ email: 'existing@example.com' });
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ email: 'existing@example.com', password: 'password123' });

      expect(res.status).toBe(409);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('returns 422 when email is missing', async () => {
      const res = await request(app).post('/api/v1/auth/login').send({ password: 'password123' });
      expect(res.status).toBe(422);
    });

    it('returns 401 for invalid credentials', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'nonexistent@example.com', password: 'wrongpass' });

      expect(res.status).toBe(401);
    });

    it('logs in with valid credentials and returns tokens', async () => {
      const user = await createTestUser({ email: 'login@example.com' });

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'login@example.com', password: 'password123' });

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
      const user = await createTestUser({ email: 'me@example.com' });
      const token = generateAccessTokenFor(user);

      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`);

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
