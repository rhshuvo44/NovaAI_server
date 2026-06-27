import request from 'supertest';
import { createApp } from '@app';
import { createTestUser } from '../factories/user.factory';
import { setupClerkMock, TEST_BEARER_TOKEN } from '../mocks/clerk.mock';
import { Role } from '@constants/index';
import { RoleModel } from '@modules/roles/models/role.model';
import { ROLE_SEEDS } from '@database/seeds/role.seed';

jest.mock('@modules/auth/services/clerk-verification.service');

const app = createApp();

async function seedRoles(): Promise<void> {
  await Promise.all(ROLE_SEEDS.map((seed) => RoleModel.create(seed)));
}

describe('RBAC enforcement', () => {
  beforeEach(async () => {
    await seedRoles();
  });

  it('denies a plain user access to the user list endpoint', async () => {
    const user = await createTestUser({ role: Role.USER });
    const { mockClerkSessionFor } = setupClerkMock();
    mockClerkSessionFor(user);

    const res = await request(app)
      .get('/api/v1/users')
      .set('Authorization', `Bearer ${TEST_BEARER_TOKEN}`);

    expect(res.status).toBe(403);
    expect(res.body.errorCode).toBe('AUTHORIZATION_ERROR');
  });

  it('allows an admin to access the user list endpoint', async () => {
    const admin = await createTestUser({ role: Role.ADMIN });
    const { mockClerkSessionFor } = setupClerkMock();
    mockClerkSessionFor(admin);

    const res = await request(app)
      .get('/api/v1/users')
      .set('Authorization', `Bearer ${TEST_BEARER_TOKEN}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('denies an unauthenticated request to a protected endpoint', async () => {
    const res = await request(app).get('/api/v1/users');
    expect(res.status).toBe(401);
  });

  it('allows a user to read their own profile via ownership but not another user\'s', async () => {
    const userA = await createTestUser({ role: Role.USER });
    const userB = await createTestUser({ role: Role.USER });
    const { mockClerkSessionFor } = setupClerkMock();

    mockClerkSessionFor(userA);
    const ownProfileRes = await request(app)
      .get(`/api/v1/users/${userA._id.toString()}`)
      .set('Authorization', `Bearer ${TEST_BEARER_TOKEN}`);
    expect(ownProfileRes.status).toBe(200);

    const otherProfileRes = await request(app)
      .get(`/api/v1/users/${userB._id.toString()}`)
      .set('Authorization', `Bearer ${TEST_BEARER_TOKEN}`);
    expect(otherProfileRes.status).toBe(403);
  });

  it('denies a deactivated user access to protected endpoints', async () => {
    const user = await createTestUser({ role: Role.USER, isActive: false });
    const { mockClerkSessionFor } = setupClerkMock();
    mockClerkSessionFor(user);

    const res = await request(app)
      .get('/api/v1/documents')
      .set('Authorization', `Bearer ${TEST_BEARER_TOKEN}`);

    expect(res.status).toBe(401);
  });
});
