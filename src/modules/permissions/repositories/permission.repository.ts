import { BaseRepository } from '@shared/models/base.repository';
import { PermissionModel, IPermission } from '@modules/permissions/models/permission.model';

export class PermissionRepository extends BaseRepository<IPermission> {
  constructor() {
    super(PermissionModel);
  }
}

export const permissionRepository = new PermissionRepository();
