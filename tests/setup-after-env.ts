// import { MongoMemoryServer } from 'mongodb-memory-server';
// import mongoose from 'mongoose';
// import { redisManager } from '@config/database/redis';

// let mongoServer: MongoMemoryServer;

// beforeAll(async () => {
//   mongoServer = await MongoMemoryServer.create();
//   const uri = mongoServer.getUri();
//   await mongoose.connect(uri);
// });

// afterEach(async () => {
//   // Clear all collections between tests for isolation, without tearing
//   // down and re-establishing the connection (which is slow).
//   const collections = mongoose.connection.collections;
//   await Promise.all(Object.values(collections).map((collection) => collection.deleteMany({})));

//   // Flush the Redis test DB between tests as well.
//   await redisManager.client.flushdb();
// });

// afterAll(async () => {
//   await mongoose.connection.dropDatabase();
//   await mongoose.connection.close();
//   await mongoServer.stop();
//   await redisManager.disconnectAll();
// });
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

import { redisManager } from '@config/database/redis';

import { PermissionModel } from '@modules/permissions/models/permission.model';
import { RoleModel } from '@modules/roles/models/role.model';

import { seedPermissions } from '@database/seeds/permission.seed';
import { seedRoles } from '@database/seeds/role.seed';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();

  await mongoose.connect(mongoServer.getUri());

  // Seed RBAC once
  await seedPermissions();
  await seedRoles();
});

beforeEach(async () => {
  // Always start each test with valid RBAC data
  await seedPermissions();
  await seedRoles();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;

  for (const collection of Object.values(collections)) {
    // Never delete RBAC collections
    if (collection.name === PermissionModel.collection.name) continue;
    if (collection.name === RoleModel.collection.name) continue;

    await collection.deleteMany({});
  }

  // Clear Redis cache
  await redisManager.client.flushdb();

  // Re-seed because permissions may have been cached
  await seedPermissions();
  await seedRoles();
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();

  await mongoose.connection.close();

  await mongoServer.stop();

  await redisManager.disconnectAll();
});