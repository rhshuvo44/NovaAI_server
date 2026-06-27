import { BaseRepository } from '@shared/models/base.repository';
import { RoleModel, IRole } from '@modules/roles/models/role.model';
import { Role } from '@constants/index';

export class RoleRepository extends BaseRepository<IRole> {
  constructor() {
    super(RoleModel);
  }

  async findByName(name: Role): Promise<IRole | null> {
    return this.findOne({ name });
  }
}

export const roleRepository = new RoleRepository();
