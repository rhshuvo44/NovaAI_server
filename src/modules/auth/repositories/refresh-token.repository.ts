import { BaseRepository } from '@shared/models/base.repository';
import { RefreshTokenModel, IRefreshToken } from '@modules/auth/models/refresh-token.model';

export class RefreshTokenRepository extends BaseRepository<IRefreshToken> {
  constructor() {
    super(RefreshTokenModel, false); // refresh tokens are hard-deleted/expired via TTL index
  }

  async findByTokenHash(tokenHash: string): Promise<IRefreshToken | null> {
    return this.findOne({ tokenHash, revokedAt: null });
  }

  async revoke(tokenHash: string, replacedByTokenHash?: string): Promise<void> {
    await this.model.updateOne(
      { tokenHash },
      { revokedAt: new Date(), ...(replacedByTokenHash ? { replacedByTokenHash } : {}) }
    );
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.model.updateMany({ userId, revokedAt: null }, { revokedAt: new Date() });
  }
}

export const refreshTokenRepository = new RefreshTokenRepository();
