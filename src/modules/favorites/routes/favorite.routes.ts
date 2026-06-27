import { Router } from 'express';
import * as favoriteController from '@modules/favorites/controllers/favorite.controller';
import {
  toggleFavoriteValidator,
  listFavoritesValidator,
} from '@modules/favorites/validators/favorite.validator';
import { paginationValidator } from '@validators/pagination.validator';
import { handleValidationErrors } from '@middlewares/validation.middleware';
import { requireAuth } from '@middlewares/auth.middleware';

const router = Router();

router.use(requireAuth);

router.post('/', toggleFavoriteValidator, handleValidationErrors, favoriteController.addFavorite);
router.delete(
  '/',
  toggleFavoriteValidator,
  handleValidationErrors,
  favoriteController.removeFavorite
);
router.get(
  '/',
  listFavoritesValidator,
  paginationValidator,
  handleValidationErrors,
  favoriteController.listFavorites
);

export default router;
