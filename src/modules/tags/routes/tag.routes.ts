import { Router } from 'express';
import * as tagController from '@modules/tags/controllers/tag.controller';
import { tagIdParamValidator, createTagValidator } from '@modules/tags/validators/tag.validator';
import { paginationValidator } from '@validators/pagination.validator';
import { handleValidationErrors } from '@middlewares/validation.middleware';
import { requireAuth } from '@middlewares/auth.middleware';

const router = Router();

router.use(requireAuth);

router.post('/', createTagValidator, handleValidationErrors, tagController.createTag);
router.get('/', paginationValidator, handleValidationErrors, tagController.listTags);
router.delete('/:id', tagIdParamValidator, handleValidationErrors, tagController.deleteTag);

export default router;
