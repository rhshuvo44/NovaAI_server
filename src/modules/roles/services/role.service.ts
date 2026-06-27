import { roleRepository } from '@modules/roles/repositories/role.repository';
import { IRole } from '@modules/roles/models/role.model';
import { Role, Permission } from '@constants/index';
import { ConflictError } from '@shared/errors';
import { cacheService } from '@shared/services/cache.service';
import { PaginationQuery } from '@types-internal/index';
import { PaginatedResult } from '@shared/models/base.repository';

export class RoleService {
  async createRole(input: {
    name: Role;
    displayName: string;
    description?: string;
    permissions: Permission[];
  }): Promise<IRole> {
    const existing = await roleRepository.findByName(input.name);
    if (existing) throw new ConflictError(`Role '${input.name}' already exists`);
    return roleRepository.create(input);
  }

  async listRoles(pagination: PaginationQuery): Promise<PaginatedResult<IRole>> {
    return roleRepository.paginate({}, pagination);
  }

  async getRole(id: string): Promise<IRole> {
    return roleRepository.findByIdOrThrow(id);
  }

  async updatePermissions(id: string, permissions: Permission[]): Promise<IRole> {
    const role = await roleRepository.updateByIdOrThrow(id, { permissions });
    // permissions are cached per-user; invalidate broadly since we don't
    // track which users hold this role without an extra query
    await cacheService.invalidatePattern('session:permissions:*');
    return role;
  }

  async deleteRole(id: string): Promise<void> {
    const role = await roleRepository.findByIdOrThrow(id);
    if (role.isSystemRole) {
      throw new ConflictError('System roles cannot be deleted');
    }
    await roleRepository.deleteById(id);
  }
}

export const roleService = new RoleService();
