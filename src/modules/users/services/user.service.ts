import bcrypt from 'bcryptjs';
import { userRepository } from '@modules/users/repositories/user.repository';
import { roleRepository } from '@modules/roles/repositories/role.repository';
import { IUser } from '@modules/users/models/user.model';
import { Role, Permission } from '@constants/index';
import { NotFoundError, ConflictError } from '@shared/errors';
import { env } from '@config/env';
import { PaginationQuery } from '@types-internal/index';
import { PaginatedResult } from '@shared/models/base.repository';
import { logger } from '@utils/logger';

export interface RegisterUserInput {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export class UserService {
  async register(input: RegisterUserInput): Promise<IUser> {
    const existing = await userRepository.findByEmail(input.email);
    if (existing) {
      throw new ConflictError('A user with this email already exists');
    }

    const passwordHash = await bcrypt.hash(input.password, env.BCRYPT_SALT_ROUNDS);

    return userRepository.create({
      email: input.email.toLowerCase().trim(),
      passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
      role: Role.USER,
      isActive: true,
      isEmailVerified: false,
    });
  }

  async getById(userId: string): Promise<IUser> {
    return userRepository.findByIdOrThrow(userId);
  }

  async getByEmail(email: string): Promise<IUser> {
    const user = await userRepository.findByEmail(email);
    if (!user) throw new NotFoundError('User');
    return user;
  }

  async listUsers(pagination: PaginationQuery): Promise<PaginatedResult<IUser>> {
    return userRepository.paginate({}, pagination);
  }

  async updateProfile(
    userId: string,
    updates: Partial<Pick<IUser, 'firstName' | 'lastName' | 'avatarUrl'>>
  ): Promise<IUser> {
    return userRepository.updateByIdOrThrow(userId, updates);
  }

  async changeRole(userId: string, role: Role): Promise<IUser> {
    const updated = await userRepository.updateById(userId, { role });
    if (!updated) throw new NotFoundError('User');
    return updated;
  }

  async deactivate(userId: string): Promise<IUser> {
    const updated = await userRepository.setActiveStatus(userId, false);
    if (!updated) throw new NotFoundError('User');
    return updated;
  }

  async activate(userId: string): Promise<IUser> {
    const updated = await userRepository.setActiveStatus(userId, true);
    if (!updated) throw new NotFoundError('User');
    return updated;
  }

  async deleteUser(userId: string): Promise<void> {
    const deleted = await userRepository.deleteById(userId);
    if (!deleted) throw new NotFoundError('User');
  }

  async getPermissionsForUser(_userId: string, role: Role): Promise<Permission[]> {
    const roleDoc = await roleRepository.findByName(role);
    if (!roleDoc) {
      logger.warn(`Role '${role}' not found — returning empty permissions`);
      return [];
    }
    return roleDoc.permissions;
  }
}

export const userService = new UserService();
