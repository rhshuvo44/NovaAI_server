import { BaseRepository } from '@shared/models/base.repository';
import { UserModel, IUser } from '@modules/users/models/user.model';
import { Role } from '@constants/index';

export class UserRepository extends BaseRepository<IUser> {
  constructor() {
    super(UserModel);
  }

  async findByEmail(email: string): Promise<IUser | null> {
    return this.findOne({ email: email.toLowerCase().trim() });
  }

  async updateRole(userId: string, role: Role): Promise<IUser | null> {
    return this.updateById(userId, { role });
  }

  async markLoginNow(userId: string): Promise<IUser | null> {
    return this.updateById(userId, { lastLoginAt: new Date() });
  }

  async setActiveStatus(userId: string, isActive: boolean): Promise<IUser | null> {
    return this.updateById(userId, { isActive });
  }
}

export const userRepository = new UserRepository();
