import { Types } from 'mongoose';
import { favoriteRepository } from '@modules/favorites/repositories/favorite.repository';
import { IFavorite, FavoriteEntityType } from '@modules/favorites/models/favorite.model';
import { ConflictError, NotFoundError } from '@shared/errors';
import { PaginationQuery } from '@types-internal/index';
import { PaginatedResult } from '@shared/models/base.repository';

export class FavoriteService {
  async add(userId: string, entityType: FavoriteEntityType, entityId: string): Promise<IFavorite> {
    const existing = await favoriteRepository.findExisting(userId, entityType, entityId);
    if (existing) throw new ConflictError('This item is already in your favorites');

    return favoriteRepository.create({
      userId: new Types.ObjectId(userId),
      entityType,
      entityId: new Types.ObjectId(entityId),
    });
  }

  async remove(userId: string, entityType: FavoriteEntityType, entityId: string): Promise<void> {
    const existing = await favoriteRepository.findExisting(userId, entityType, entityId);
    if (!existing) throw new NotFoundError('Favorite');
    await favoriteRepository.deleteById(existing._id.toString());
  }

  async list(
    userId: string,
    pagination: PaginationQuery,
    entityType?: FavoriteEntityType
  ): Promise<PaginatedResult<IFavorite>> {
    return favoriteRepository.paginate(
      { userId, ...(entityType ? { entityType } : {}) },
      pagination
    );
  }

  async isFavorited(
    userId: string,
    entityType: FavoriteEntityType,
    entityId: string
  ): Promise<boolean> {
    return favoriteRepository.exists({ userId, entityType, entityId });
  }
}

export const favoriteService = new FavoriteService();
