import { BaseRepository } from '@shared/models/base.repository';
import { SettingsModel, ISettings } from '@modules/settings/models/settings.model';

export class SettingsRepository extends BaseRepository<ISettings> {
  constructor() {
    super(SettingsModel);
  }

  async findByKey(
    scope: 'system' | 'user',
    key: string,
    ownerId?: string
  ): Promise<ISettings | null> {
    return this.findOne({ scope, key, ownerId: ownerId ?? null });
  }

  async upsert(
    scope: 'system' | 'user',
    key: string,
    value: unknown,
    ownerId?: string
  ): Promise<ISettings> {
    const result = await this.model.findOneAndUpdate(
      { scope, key, ownerId: ownerId ?? null },
      { value },
      { new: true, upsert: true }
    );
    return result;
  }
}

export const settingsRepository = new SettingsRepository();
