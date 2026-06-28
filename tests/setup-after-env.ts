import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { redisManager } from '@config/database/redis';
import { PermissionModel } from '@modules/permissions/models/permission.model';
import { RoleModel } from '@modules/roles/models/role.model';

import { PERMISSION_SEEDS } from '@database/seeds/permission.seed';
import { ROLE_SEEDS } from '@database/seeds/role.seed';

import { logger } from '@utils/logger';

let mongoServer: MongoMemoryServer;
async function seedPermissions(): Promise<void> {
  for (const seed of PERMISSION_SEEDS) {
    await PermissionModel.findOneAndUpdate(
      { key: seed.key },
      { $set: seed },
      { upsert: true, new: true }
    );
  }
  logger.info(`Seeded ${PERMISSION_SEEDS.length} permissions`);
}

async function seedRoles(): Promise<void> {
  for (const seed of ROLE_SEEDS) {
    await RoleModel.findOneAndUpdate(
      { name: seed.name },
      { $set: seed },
      { upsert: true, new: true }
    );
  }
  logger.info(`Seeded ${ROLE_SEEDS.length} roles`);
}
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
  await seedPermissions();
  await seedRoles();
});

afterEach(async () => {
  // Clear all collections between tests for isolation, without tearing
  // down and re-establishing the connection (which is slow).
  const collections = mongoose.connection.collections;
  // await Promise.all(Object.values(collections).map((collection) => collection.deleteMany({})));

    for (const collection of Object.values(collections)) {
    if (collection.collectionName === 'roles') continue;
    if (collection.collectionName === 'permissions') continue;

    await collection.deleteMany({});
  }
  // Flush the Redis test DB between tests as well.
  await redisManager.client.flushdb();
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
  await redisManager.disconnectAll();
});
