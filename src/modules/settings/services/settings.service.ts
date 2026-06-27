import { settingsRepository } from '@modules/settings/repositories/settings.repository';
import { ISettings } from '@modules/settings/models/settings.model';
import { cacheService } from '@shared/services/cache.service';
import { CACHE_TTL } from '@constants/index';

export class SettingsService {
  private systemCacheKey(key: string): string {
    return `cache:settings:system:${key}`;
  }

  async getSystemSetting<T = unknown>(key: string): Promise<T | null> {
    return cacheService.getOrSet(
      this.systemCacheKey(key),
      async () => {
        const setting = await settingsRepository.findByKey('system', key);
        return (setting?.value ?? null) as T;
      },
      CACHE_TTL.LONG
    );
  }

  async setSystemSetting(key: string, value: unknown): Promise<ISettings> {
    const setting = await settingsRepository.upsert('system', key, value);
    await cacheService.del(this.systemCacheKey(key));
    return setting;
  }

  async getUserSetting<T = unknown>(userId: string, key: string): Promise<T | null> {
    const setting = await settingsRepository.findByKey('user', key, userId);
    return (setting?.value ?? null) as T;
  }

  async setUserSetting(userId: string, key: string, value: unknown): Promise<ISettings> {
    return settingsRepository.upsert('user', key, value, userId);
  }

  async listUserSettings(userId: string): Promise<ISettings[]> {
    return settingsRepository.findMany({ scope: 'user', ownerId: userId });
  }
}

export const settingsService = new SettingsService();
