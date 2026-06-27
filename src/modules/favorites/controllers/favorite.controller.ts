import { Request, Response } from 'express';
import { favoriteService } from '@modules/favorites/services/favorite.service';
import { FavoriteEntityType } from '@modules/favorites/models/favorite.model';
import { ApiResponse } from '@shared/responses/api-response';
import { asyncHandler } from '@utils/async-handler';
import { AuthenticationError } from '@shared/errors';
import { parsePaginationQuery } from '@validators/pagination.validator';

export const addFavorite = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AuthenticationError();
  const { entityType, entityId } = req.body as { entityType: FavoriteEntityType; entityId: string };
  const favorite = await favoriteService.add(req.user.userId, entityType, entityId);
  ApiResponse.created(res, favorite, 'Added to favorites');
});

export const removeFavorite = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AuthenticationError();
  const { entityType, entityId } = req.body as { entityType: FavoriteEntityType; entityId: string };
  await favoriteService.remove(req.user.userId, entityType, entityId);
  ApiResponse.noContent(res, 'Removed from favorites');
});

export const listFavorites = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AuthenticationError();
  const entityType = req.query.entityType as FavoriteEntityType | undefined;
  const { items, meta } = await favoriteService.list(
    req.user.userId,
    parsePaginationQuery(req),
    entityType
  );
  ApiResponse.paginated(res, items, meta, 'Favorites fetched successfully');
});
