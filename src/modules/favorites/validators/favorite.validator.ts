import { body, query } from 'express-validator';
import { FavoriteEntityType } from '@modules/favorites/models/favorite.model';

export const toggleFavoriteValidator = [
  body('entityType').isIn(Object.values(FavoriteEntityType)).withMessage('Invalid entityType'),
  body('entityId').isMongoId().withMessage('Invalid entityId'),
];

export const listFavoritesValidator = [
  query('entityType')
    .optional()
    .isIn(Object.values(FavoriteEntityType))
    .withMessage('Invalid entityType'),
];
