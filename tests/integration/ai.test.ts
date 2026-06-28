import request from 'supertest';
import { createApp } from '@app';
import { createTestUser } from '../factories/user.factory';
import { setupClerkMock, TEST_BEARER_TOKEN } from '../mocks/clerk.mock';
import { mockAIProvider } from '../mocks/ai-provider.mock';
import { Role, Permission } from '@constants/index';
import { RoleModel } from '@modules/roles/models/role.model';

jest.mock('@modules/auth/services/clerk-verification.service');
jest.mock('@modules/ai/providers/provider.factory', () => ({
  getAIProvider: () => require('../mocks/ai-provider.mock').mockAIProvider,
  getAIProviderByName: () => require('../mocks/ai-provider.mock').mockAIProvider,
}));

const app = createApp();

describe('AI feature endpoints', () => {
  beforeEach(async () => {
    await RoleModel.create({
      name: Role.USER,
      displayName: 'User',
      description: 'test role',
      permissions: [Permission.AI_USE, Permission.DOCUMENT_READ, Permission.DOCUMENT_WRITE],
      isSystemRole: true,
    });
  });

  it('rejects requests without the AI_USE permission', async () => {
    await RoleModel.deleteMany({});
    await RoleModel.create({
      name: Role.USER,
      displayName: 'User',
      description: 'no AI permission',
      permissions: [],
      isSystemRole: true,
    });

    const user = await createTestUser({ role: Role.USER });
    const { mockClerkSessionFor } = setupClerkMock();
    mockClerkSessionFor(user);

    const res = await request(app)
      .post('/api/v1/ai/summarizer')
      .set('Authorization', `Bearer ${TEST_BEARER_TOKEN}`)
      .send({ text: 'Some long text to summarize.' });

    expect(res.status).toBe(403);
  });

  it('summarizes text using the (mocked) AI provider', async () => {
    mockAIProvider.nextResponse = 'This is a mock summary.';
    const user = await createTestUser({ role: Role.USER });
    const { mockClerkSessionFor } = setupClerkMock();
    mockClerkSessionFor(user);

    const res = await request(app)
      .post('/api/v1/ai/summarizer')
      .set('Authorization', `Bearer ${TEST_BEARER_TOKEN}`)
      .send({ text: 'Some long text to summarize.' });

    expect(res.status).toBe(200);
    expect(res.body.data.summary).toBe('This is a mock summary.');
  });

  it('rejects an empty prompt for the optimizer', async () => {
    const user = await createTestUser({ role: Role.USER });
    const { mockClerkSessionFor } = setupClerkMock();
    mockClerkSessionFor(user);

    const res = await request(app)
      .post('/api/v1/ai/prompt-optimizer')
      .set('Authorization', `Bearer ${TEST_BEARER_TOKEN}`)
      .send({ prompt: '' });

    expect(res.status).toBe(422);
  });

  it('generates tags as a parsed array from the AI JSON response', async () => {
    mockAIProvider.nextResponse = '["productivity", "ai", "workspace"]';
    const user = await createTestUser({ role: Role.USER });
    const { mockClerkSessionFor } = setupClerkMock();
    mockClerkSessionFor(user);

    const res = await request(app)
      .post('/api/v1/ai/tags-generator')
      .set('Authorization', `Bearer ${TEST_BEARER_TOKEN}`)
      .send({ content: 'An article about productivity tools.' });

    expect(res.status).toBe(200);
    expect(res.body.data.tags).toEqual(['productivity', 'ai', 'workspace']);
  });
});
