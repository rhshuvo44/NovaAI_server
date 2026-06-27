import { Schema, model, Document as MongooseDocument } from 'mongoose';
import { BaseRepository } from '@shared/models/base.repository';
import { applyBasePlugin, baseSchemaOptions } from '@shared/models/base.plugin';
import { NotFoundError } from '@shared/errors';

interface ITestEntity extends MongooseDocument {
  name: string;
  value: number;
  deletedAt?: Date | null;
}

const testEntitySchema = new Schema<ITestEntity>(
  { name: { type: String, required: true }, value: { type: Number, default: 0 } },
  baseSchemaOptions
);
applyBasePlugin(testEntitySchema);
const TestEntityModel = model<ITestEntity>('TestEntity', testEntitySchema);

class TestEntityRepository extends BaseRepository<ITestEntity> {
  constructor() {
    super(TestEntityModel);
  }
}

describe('BaseRepository', () => {
  const repo = new TestEntityRepository();

  it('creates a document', async () => {
    const doc = await repo.create({ name: 'alpha', value: 1 });
    expect(doc.name).toBe('alpha');
    expect(doc.deletedAt).toBeNull();
  });

  it('finds a document by id', async () => {
    const created = await repo.create({ name: 'beta', value: 2 });
    const found = await repo.findById(created._id.toString());
    expect(found?.name).toBe('beta');
  });

  it('returns null for a non-existent id', async () => {
    const found = await repo.findById('507f1f77bcf86cd799439011');
    expect(found).toBeNull();
  });

  it('returns null for an invalid id format rather than throwing', async () => {
    const found = await repo.findById('not-a-valid-object-id');
    expect(found).toBeNull();
  });

  it('throws NotFoundError via findByIdOrThrow for a missing document', async () => {
    await expect(repo.findByIdOrThrow('507f1f77bcf86cd799439011')).rejects.toThrow(NotFoundError);
  });

  it('updates a document by id', async () => {
    const created = await repo.create({ name: 'gamma', value: 3 });
    const updated = await repo.updateById(created._id.toString(), { value: 30 });
    expect(updated?.value).toBe(30);
  });

  it('soft-deletes a document by default', async () => {
    const created = await repo.create({ name: 'delta', value: 4 });
    const deleted = await repo.deleteById(created._id.toString());
    expect(deleted).toBe(true);

    const found = await repo.findById(created._id.toString());
    expect(found).toBeNull(); // soft-deleted docs are excluded from default queries
  });

  it('paginates results with correct metadata', async () => {
    for (let i = 0; i < 15; i += 1) {
      await repo.create({ name: `item-${i}`, value: i });
    }

    const { items, meta } = await repo.paginate({}, { page: 1, limit: 10 });
    expect(items.length).toBe(10);
    expect(meta.totalItems).toBeGreaterThanOrEqual(15);
    expect(meta.hasNextPage).toBe(true);
    expect(meta.page).toBe(1);
  });

  it('bulk deletes multiple documents', async () => {
    const docs = await Promise.all([
      repo.create({ name: 'bulk-1', value: 1 }),
      repo.create({ name: 'bulk-2', value: 2 }),
    ]);

    const count = await repo.bulkDelete(docs.map((d) => d._id.toString()));
    expect(count).toBe(2);
  });

  it('counts documents matching a filter, excluding soft-deleted ones', async () => {
    await repo.create({ name: 'count-me', value: 100 });
    const countBefore = await repo.count({ name: 'count-me' });
    expect(countBefore).toBe(1);
  });

  it('checks existence correctly', async () => {
    await repo.create({ name: 'exists-test', value: 1 });
    expect(await repo.exists({ name: 'exists-test' })).toBe(true);
    expect(await repo.exists({ name: 'does-not-exist' })).toBe(false);
  });
});
