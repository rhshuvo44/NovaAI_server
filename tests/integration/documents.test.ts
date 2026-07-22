import { createApp } from '@app';
import { Permission, Role } from '@constants/index';
import { RoleModel } from '@modules/roles/models/role.model';
import request from 'supertest';
import { createTestUser, generateAccessTokenFor } from '../factories/user.factory';

const app = createApp();

describe('Documents API', () => {
  beforeEach(async () => {
    await RoleModel.create({
      name: Role.USER,
      displayName: 'User',
      description: 'test role',
      permissions: [Permission.AI_USE, Permission.DOCUMENT_READ, Permission.DOCUMENT_WRITE, Permission.DOCUMENT_DELETE],
      isSystemRole: true,
    });
  });

  it('creates a document for the authenticated user', async () => {
    const user = await createTestUser({ role: Role.USER });
    const token = generateAccessTokenFor(user);

    const res = await request(app)
      .post('/api/v1/documents')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'My First Doc', content: 'Hello world' });

    expect(res.status).toBe(201);
    expect(res.body.data.title).toBe('My First Doc');
    expect(res.body.data.ownerId).toBe(user._id.toString());
  });

  it('rejects document creation with missing required fields', async () => {
    const user = await createTestUser();
    const token = generateAccessTokenFor(user);

    const res = await request(app)
      .post('/api/v1/documents')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: '' });

    expect(res.status).toBe(422);
  });

  it('prevents a user from updating another user\'s document', async () => {
    const owner = await createTestUser();
    const intruder = await createTestUser();
    const ownerToken = generateAccessTokenFor(owner);

    const createRes = await request(app)
      .post('/api/v1/documents')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ title: 'Owned Doc', content: 'Secret content' });

    const docId = createRes.body.data._id;

    const intruderToken = generateAccessTokenFor(intruder);
    const updateRes = await request(app)
      .patch(`/api/v1/documents/${docId}`)
      .set('Authorization', `Bearer ${intruderToken}`)
      .send({ title: 'Hijacked Title' });

    expect(updateRes.status).toBe(403);
  });

  it('allows anyone to view a public document without authentication', async () => {
    const owner = await createTestUser();
    const token = generateAccessTokenFor(owner);

    const createRes = await request(app)
      .post('/api/v1/documents')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Public Doc', content: 'Visible to all', isPublic: true });

    const docId = createRes.body.data._id;

    const publicRes = await request(app).get(`/api/v1/documents/${docId}`);
    expect(publicRes.status).toBe(200);
    expect(publicRes.body.data.title).toBe('Public Doc');
  });

  it('denies viewing a private document without authentication', async () => {
    const owner = await createTestUser();
    const token = generateAccessTokenFor(owner);

    const createRes = await request(app)
      .post('/api/v1/documents')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Private Doc', content: 'Secret', isPublic: false });

    const docId = createRes.body.data._id;

    const res = await request(app).get(`/api/v1/documents/${docId}`);
    expect(res.status).toBe(403);
  });

  it('soft-deletes a document so it no longer appears in the owner\'s list', async () => {
    const owner = await createTestUser();
    const token = generateAccessTokenFor(owner);

    const createRes = await request(app)
      .post('/api/v1/documents')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'To Delete', content: 'Bye' });

    const docId = createRes.body.data._id;

    const deleteRes = await request(app)
      .delete(`/api/v1/documents/${docId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(deleteRes.status).toBe(200);

    const listRes = await request(app)
      .get('/api/v1/documents')
      .set('Authorization', `Bearer ${token}`);

    const titles = listRes.body.data.map((d: { title: string }) => d.title);
    expect(titles).not.toContain('To Delete');
  });
});
