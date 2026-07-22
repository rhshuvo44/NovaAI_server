import bcrypt from 'bcryptjs';
import { UserModel, IUser } from '@modules/users/models/user.model';
import { Role } from '@constants/index';
import { jwtService } from '@modules/auth/services/jwt.service';
import { env } from '@config/env';

let counter = 0;

export interface CreateTestUserOptions {
  role?: Role;
  email?: string;
  password?: string;
  isActive?: boolean;
}

export async function createTestUser(options: CreateTestUserOptions = {}): Promise<IUser> {
  counter += 1;
  const password = options.password ?? 'password123';
  const passwordHash = await bcrypt.hash(password, env.BCRYPT_SALT_ROUNDS);
  return UserModel.create({
    email: options.email ?? `test-user-${counter}@example.com`,
    passwordHash,
    firstName: 'Test',
    lastName: `User${counter}`,
    role: options.role ?? Role.USER,
    isActive: options.isActive ?? true,
    isEmailVerified: true,
  });
}

export function generateAccessTokenFor(user: IUser): string {
  return jwtService.signAccessToken({
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
  });
}
