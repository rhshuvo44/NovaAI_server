import { BaseRepository } from '@shared/models/base.repository';
import { ApiKeyModel, IApiKey } from '@modules/api-keys/models/api-key.model';

export class ApiKeyRepository extends BaseRepository<IApiKey> {
  constructor() {
    super(ApiKeyModel);
  }

  async findByHash(keyHash: string): Promise<IApiKey | null> {
    return this.findOne({ keyHash, isActive: true });
  }

  async touchLastUsed(id: string): Promise<void> {
    await this.model.updateOne({ _id: id }, { lastUsedAt: new Date() });
  }
}

export const apiKeyRepository = new ApiKeyRepository();
