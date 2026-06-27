import crypto from 'crypto';
import { Types } from 'mongoose';
import { apiKeyRepository } from '@modules/api-keys/repositories/api-key.repository';
import { IApiKey } from '@modules/api-keys/models/api-key.model';
import { AuthenticationError, AuthorizationError, NotFoundError } from '@shared/errors';
import { PaginationQuery } from '@types-internal/index';
import { PaginatedResult } from '@shared/models/base.repository';

const KEY_PREFIX = 'aiw';

export interface CreateApiKeyResult {
  apiKey: IApiKey;
  rawKey: string; // returned only once at creation time
}

export class ApiKeyService {
  private hashKey(rawKey: string): string {
    return crypto.createHash('sha256').update(rawKey).digest('hex');
  }

  private generateRawKey(): { rawKey: string; prefix: string } {
    const secret = crypto.randomBytes(32).toString('hex');
    const prefix = `${KEY_PREFIX}_${crypto.randomBytes(4).toString('hex')}`;
    return { rawKey: `${prefix}_${secret}`, prefix };
  }

  async create(
    ownerId: string,
    name: string,
    scopes: string[],
    expiresAt?: Date
  ): Promise<CreateApiKeyResult> {
    const { rawKey, prefix } = this.generateRawKey();
    const keyHash = this.hashKey(rawKey);

    const apiKey = await apiKeyRepository.create({
      ownerId: new Types.ObjectId(ownerId),
      name,
      keyHash,
      keyPrefix: prefix,
      scopes,
      isActive: true,
      expiresAt: expiresAt ?? null,
    });

    return { apiKey, rawKey };
  }

  async verify(rawKey: string): Promise<IApiKey> {
    const keyHash = this.hashKey(rawKey);
    const apiKey = await apiKeyRepository.findByHash(keyHash);

    if (!apiKey) throw new AuthenticationError('Invalid API key');
    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
      throw new AuthenticationError('API key has expired');
    }

    void apiKeyRepository.touchLastUsed(apiKey._id.toString());
    return apiKey;
  }

  async list(ownerId: string, pagination: PaginationQuery): Promise<PaginatedResult<IApiKey>> {
    return apiKeyRepository.paginate({ ownerId }, pagination);
  }

  async revoke(id: string, ownerId: string): Promise<void> {
    const apiKey = await apiKeyRepository.findById(id);
    if (!apiKey) throw new NotFoundError('API key');
    if (apiKey.ownerId.toString() !== ownerId) {
      throw new AuthorizationError('You do not have permission to revoke this API key');
    }
    await apiKeyRepository.updateById(id, { isActive: false });
  }
}

export const apiKeyService = new ApiKeyService();
