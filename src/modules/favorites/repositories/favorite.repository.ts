import { BaseRepository } from '@shared/models/base.repository';
import {
  FavoriteModel,
  IFavorite,
  FavoriteEntityType,
} from '@modules/favorites/models/favorite.model';

export class FavoriteRepository extends BaseRepository<IFavorite> {
  constructor() {
    super(FavoriteModel);
  }

  async findExisting(
    userId: string,
    entityType: FavoriteEntityType,
    entityId: string
  ): Promise<IFavorite | null> {
    return this.findOne({ userId, entityType, entityId });
  }
}

export const favoriteRepository = new FavoriteRepository();
