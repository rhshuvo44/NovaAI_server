import { Router } from 'express';
import * as promptController from '@modules/prompts/controllers/prompt.controller';
import {
  promptIdParamValidator,
  createPromptValidator,
  updatePromptValidator,
} from '@modules/prompts/validators/prompt.validator';
import { paginationValidator } from '@validators/pagination.validator';
import { handleValidationErrors } from '@middlewares/validation.middleware';
import { requireAuth } from '@middlewares/auth.middleware';
import { aiRateLimiter } from '@middlewares/rate-limit.middleware';

const router = Router();

router.use(requireAuth);

router.post('/', createPromptValidator, handleValidationErrors, promptController.createPrompt);
router.get('/', paginationValidator, handleValidationErrors, promptController.listPrompts);
router.get('/:id', promptIdParamValidator, handleValidationErrors, promptController.getPrompt);
router.patch('/:id', updatePromptValidator, handleValidationErrors, promptController.updatePrompt);
router.patch(
  '/:id/favorite',
  promptIdParamValidator,
  handleValidationErrors,
  promptController.toggleFavoritePrompt
);
router.post(
  '/:id/optimize',
  aiRateLimiter,
  promptIdParamValidator,
  handleValidationErrors,
  promptController.optimizePrompt
);
router.delete(
  '/:id',
  promptIdParamValidator,
  handleValidationErrors,
  promptController.deletePrompt
);

export default router;
