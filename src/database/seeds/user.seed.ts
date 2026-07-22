import bcrypt from 'bcryptjs';
import { Role } from '@constants/index';
import { env } from '@config/env';

export interface UserSeed {
  email: string;
  password: string;
  role: Role;
  firstName?: string;
  lastName?: string;
  isEmailVerified: boolean;
}

function getSeedUsers(): UserSeed[] {
  return [
    {
      email: 'admin@novaai.com',
      password: env.ADMIN_PASSWORD,
      role: Role.SUPER_ADMIN,
      firstName: 'Admin',
      isEmailVerified: true,
    },
    {
      email: 'manager@novaai.com',
      password: env.MANAGER_PASSWORD,
      role: Role.MANAGER,
      firstName: 'Manager',
      isEmailVerified: true,
    },
    {
      email: 'user@novaai.com',
      password: env.USER_PASSWORD,
      role: Role.USER,
      firstName: 'User',
      isEmailVerified: true,
    },
  ];
}

export function buildUserSeedData(): Array<Omit<UserSeed, 'password'> & { passwordHash: string }> {
  const users = getSeedUsers();
  return users.map((u) => ({
    email: u.email,
    passwordHash: bcrypt.hashSync(u.password, env.BCRYPT_SALT_ROUNDS),
    role: u.role,
    firstName: u.firstName,
    lastName: u.lastName,
    isEmailVerified: u.isEmailVerified,
  }));
}
