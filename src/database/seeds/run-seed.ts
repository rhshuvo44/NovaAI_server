import 'tsconfig-paths/register';
import { connectDatabase, disconnectDatabase } from '@config/database/mongoose';
import { PermissionModel } from '@modules/permissions/models/permission.model';
import { RoleModel } from '@modules/roles/models/role.model';
import { PERMISSION_SEEDS } from '@database/seeds/permission.seed';
import { ROLE_SEEDS } from '@database/seeds/role.seed';
import { logger } from '@utils/logger';

export async function seedPermissions(): Promise<void> {
  for (const seed of PERMISSION_SEEDS) {
    await PermissionModel.findOneAndUpdate(
      { key: seed.key },
      { $set: seed },
      { upsert: true, new: true }
    );
  }
  logger.info(`Seeded ${PERMISSION_SEEDS.length} permissions`);
}

export async function seedRoles(): Promise<void> {
  for (const seed of ROLE_SEEDS) {
    await RoleModel.findOneAndUpdate(
      { name: seed.name },
      { $set: seed },
      { upsert: true, new: true }
    );
  }
  logger.info(`Seeded ${ROLE_SEEDS.length} roles`);
}

async function runSeed(): Promise<void> {
  logger.info('Starting database seed...');
  await connectDatabase();

  await seedPermissions();
  await seedRoles();

  logger.info('Database seed completed successfully');
  await disconnectDatabase();
  process.exit(0);
}

runSeed().catch((error) => {
  logger.error('Database seed failed', { error: (error as Error).message });
  process.exit(1);
});
