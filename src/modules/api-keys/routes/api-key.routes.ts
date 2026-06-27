import { Router } from 'express';
import * as apiKeyController from '@modules/api-keys/controllers/api-key.controller';
import {
  apiKeyIdParamValidator,
  createApiKeyValidator,
} from '@modules/api-keys/validators/api-key.validator';
import { paginationValidator } from '@validators/pagination.validator';
import { handleValidationErrors } from '@middlewares/validation.middleware';
import { requireAuth } from '@middlewares/auth.middleware';

const router = Router();

router.use(requireAuth);

router.post('/', createApiKeyValidator, handleValidationErrors, apiKeyController.createApiKey);
router.get('/', paginationValidator, handleValidationErrors, apiKeyController.listApiKeys);
router.delete(
  '/:id',
  apiKeyIdParamValidator,
  handleValidationErrors,
  apiKeyController.revokeApiKey
);

export default router;
