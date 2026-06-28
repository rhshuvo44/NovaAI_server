import request from 'supertest';
import { createApp } from '@app';
import { createTestUser } from '../factories/user.factory';
import { setupClerkMock, TEST_BEARER_TOKEN } from '../mocks/clerk.mock';

jest.mock('@modules/auth/services/clerk-verification.service');

const app = createApp();

describe('Documents API', () => {
  
  it('creates a document for the authenticated user', async () => {
    const user = await createTestUser();

    const { mockClerkSessionFor } = setupClerkMock();
    mockClerkSessionFor(user);
const permissions = await user.getPermissionsForUser(
    user._id.toString(),
    user.role
);

console.log(permissions);
    const res = await request(app)
      .post('/api/v1/documents')
      .set('Authorization', `Bearer ${TEST_BEARER_TOKEN}`)
      .send({ title: 'My First Doc', content: 'Hello world' });

    expect(res.status).toBe(201);
    expect(res.body.data.title).toBe('My First Doc');
    expect(res.body.data.ownerId).toBe(user._id.toString());
  });

  it('rejects document creation with missing required fields', async () => {
    const user = await createTestUser();
    const { mockClerkSessionFor } = setupClerkMock();
    mockClerkSessionFor(user);

    const res = await request(app)
      .post('/api/v1/documents')
      .set('Authorization', `Bearer ${TEST_BEARER_TOKEN}`)
      .send({ title: '' });

    expect(res.status).toBe(422);
  });

  it('prevents a user from updating another user\'s document', async () => {
    const owner = await createTestUser();
    const intruder = await createTestUser();
    const { mockClerkSessionFor } = setupClerkMock();

    mockClerkSessionFor(owner);
    const createRes = await request(app)
      .post('/api/v1/documents')
      .set('Authorization', `Bearer ${TEST_BEARER_TOKEN}`)
      .send({ title: 'Owned Doc', content: 'Secret content' });

    const docId = createRes.body.data._id;

    mockClerkSessionFor(intruder);
    const updateRes = await request(app)
      .patch(`/api/v1/documents/${docId}`)
      .set('Authorization', `Bearer ${TEST_BEARER_TOKEN}`)
      .send({ title: 'Hijacked Title' });

    expect(updateRes.status).toBe(403);
  });

  it('allows anyone to view a public document without authentication', async () => {
    const owner = await createTestUser();
    const { mockClerkSessionFor } = setupClerkMock();
    mockClerkSessionFor(owner);

    const createRes = await request(app)
      .post('/api/v1/documents')
      .set('Authorization', `Bearer ${TEST_BEARER_TOKEN}`)
      .send({ title: 'Public Doc', content: 'Visible to all', isPublic: true });

    const docId = createRes.body.data._id;

    const publicRes = await request(app).get(`/api/v1/documents/${docId}`);
    expect(publicRes.status).toBe(200);
    expect(publicRes.body.data.title).toBe('Public Doc');
  });

  it('denies viewing a private document without authentication', async () => {
    const owner = await createTestUser();
    const { mockClerkSessionFor } = setupClerkMock();
    mockClerkSessionFor(owner);

    const createRes = await request(app)
      .post('/api/v1/documents')
      .set('Authorization', `Bearer ${TEST_BEARER_TOKEN}`)
      .send({ title: 'Private Doc', content: 'Secret', isPublic: false });

    const docId = createRes.body.data._id;

    const res = await request(app).get(`/api/v1/documents/${docId}`);
    expect(res.status).toBe(403);
  });

  it('soft-deletes a document so it no longer appears in the owner\'s list', async () => {
    const owner = await createTestUser();
    const { mockClerkSessionFor } = setupClerkMock();
    mockClerkSessionFor(owner);

    const createRes = await request(app)
      .post('/api/v1/documents')
      .set('Authorization', `Bearer ${TEST_BEARER_TOKEN}`)
      .send({ title: 'To Delete', content: 'Bye' });

    const docId = createRes.body.data._id;

    const deleteRes = await request(app)
      .delete(`/api/v1/documents/${docId}`)
      .set('Authorization', `Bearer ${TEST_BEARER_TOKEN}`);
    expect(deleteRes.status).toBe(200);

    const listRes = await request(app)
      .get('/api/v1/documents')
      .set('Authorization', `Bearer ${TEST_BEARER_TOKEN}`);

    const titles = listRes.body.data.map((d: { title: string }) => d.title);
    expect(titles).not.toContain('To Delete');
  });
});
