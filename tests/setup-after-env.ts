import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { redisManager } from '@config/database/redis';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterEach(async () => {
  // Clear all collections between tests for isolation, without tearing
  // down and re-establishing the connection (which is slow).
  const collections = mongoose.connection.collections;
  await Promise.all(Object.values(collections).map((collection) => collection.deleteMany({})));

  // Flush the Redis test DB between tests as well.
  await redisManager.client.flushdb();
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
  await redisManager.disconnectAll();
});
