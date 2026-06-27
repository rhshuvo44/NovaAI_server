import { permissionRepository } from '@modules/permissions/repositories/permission.repository';
import { IPermission } from '@modules/permissions/models/permission.model';
import { PaginationQuery } from '@types-internal/index';
import { PaginatedResult } from '@shared/models/base.repository';

export class PermissionService {
  async listPermissions(pagination: PaginationQuery): Promise<PaginatedResult<IPermission>> {
    return permissionRepository.paginate({}, pagination);
  }

  async listByCategory(category: string): Promise<IPermission[]> {
    return permissionRepository.findMany({ category });
  }
}

export const permissionService = new PermissionService();
