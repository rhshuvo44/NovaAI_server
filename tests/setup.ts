import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

import { PermissionModel } from '@modules/permissions/models/permission.model';
import { RoleModel } from '@modules/roles/models/role.model';

import { seedPermissions } from '@database/seeds/permission.seed';
import { seedRoles } from '@database/seeds/role.seed';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  process.env.NODE_ENV = 'test';

  mongoServer = await MongoMemoryServer.create();

  await mongoose.connect(mongoServer.getUri());

  await seedPermissions();
  await seedRoles();
});

beforeEach(async () => {
  const collections = mongoose.connection.collections;

  for (const key of Object.keys(collections)) {
    if (key === PermissionModel.collection.name) continue;
    if (key === RoleModel.collection.name) continue;

    await collections[key].deleteMany({});
  }
});

afterEach(async () => {
  // Refresh RBAC data after each test if required
  await seedPermissions();
  await seedRoles();
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();

  if (mongoServer) {
    await mongoServer.stop();
  }
});