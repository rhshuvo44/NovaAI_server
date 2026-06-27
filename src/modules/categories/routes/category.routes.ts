import { Router } from 'express';
import * as categoryController from '@modules/categories/controllers/category.controller';
import {
  categoryIdParamValidator,
  createCategoryValidator,
  updateCategoryValidator,
} from '@modules/categories/validators/category.validator';
import { paginationValidator } from '@validators/pagination.validator';
import { handleValidationErrors } from '@middlewares/validation.middleware';
import { requireAuth } from '@middlewares/auth.middleware';

const router = Router();

router.use(requireAuth);

router.post(
  '/',
  createCategoryValidator,
  handleValidationErrors,
  categoryController.createCategory
);
router.get('/', paginationValidator, handleValidationErrors, categoryController.listCategories);
router.get(
  '/:id',
  categoryIdParamValidator,
  handleValidationErrors,
  categoryController.getCategory
);
router.patch(
  '/:id',
  updateCategoryValidator,
  handleValidationErrors,
  categoryController.updateCategory
);
router.delete(
  '/:id',
  categoryIdParamValidator,
  handleValidationErrors,
  categoryController.deleteCategory
);

export default router;
