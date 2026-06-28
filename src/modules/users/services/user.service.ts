import { userRepository } from '@modules/users/repositories/user.repository';
import { roleRepository } from '@modules/roles/repositories/role.repository';
import { IUser } from '@modules/users/models/user.model';
import { Role, Permission } from '@constants/index';
import { NotFoundError, ConflictError } from '@shared/errors';
import { cacheService } from '@shared/services/cache.service';
import { REDIS_KEY_PREFIX, CACHE_TTL } from '@constants/index';
import { PaginationQuery } from '@types-internal/index';
import { PaginatedResult } from '@shared/models/base.repository';

export interface CreateUserFromClerkInput {
  clerkId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
}

export class UserService {
  private permissionsCacheKey(userId: string): string {
    return `${REDIS_KEY_PREFIX.SESSION}permissions:${userId}`;
  }

  async findOrCreateFromClerk(input: CreateUserFromClerkInput): Promise<IUser> {
    const existing = await userRepository.findByClerkId(input.clerkId);
    if (existing) return existing;

    const existingByEmail = await userRepository.findByEmail(input.email);
    if (existingByEmail) {
      throw new ConflictError('A user with this email already exists');
    }

    return userRepository.create({
      clerkId: input.clerkId,
      email: input.email.toLowerCase().trim(),
      firstName: input.firstName,
      lastName: input.lastName,
      avatarUrl: input.avatarUrl,
      role: Role.USER,
      isActive: true,
      isEmailVerified: true, // Clerk has already verified the email
    });
  }

  async getById(userId: string): Promise<IUser> {
    return userRepository.findByIdOrThrow(userId);
  }

  async getByClerkId(clerkId: string): Promise<IUser> {
    const user = await userRepository.findByClerkId(clerkId);
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
    await cacheService.del(this.permissionsCacheKey(userId));
    return updated;
  }

  async deactivate(userId: string): Promise<IUser> {
    const updated = await userRepository.setActiveStatus(userId, false);
    if (!updated) throw new NotFoundError('User');
    await cacheService.del(this.permissionsCacheKey(userId));
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

  /**
   * Resolves the effective permission set for a user's role, with Redis caching
   * since this is checked on every protected request.
   */
  async getPermissionsForUser(userId: string, role: Role): Promise<Permission[]> {
    return cacheService.getOrSet(
      this.permissionsCacheKey(userId),
      async () => {
        const roleDoc = await roleRepository.findByName(role);
        if (!roleDoc) {
          throw new Error(`Role '${role}' not found during test`);
        }

        return roleDoc.permissions;
      },
      CACHE_TTL.SESSION
    );
  }
}

export const userService = new UserService();
