import { Router } from 'express';
import { param } from 'express-validator';
import * as uploadController from '@modules/uploads/controllers/upload.controller';
import { uploadSingle } from '@middlewares/upload.middleware';
import { handleValidationErrors } from '@middlewares/validation.middleware';
import { requireAuth } from '@middlewares/auth.middleware';
import { uploadRateLimiter } from '@middlewares/rate-limit.middleware';

const router = Router();
const uploadIdValidator = [param('id').isMongoId().withMessage('Invalid upload id')];

router.use(requireAuth);

router.post('/', uploadRateLimiter, uploadSingle, uploadController.uploadFile);
router.get('/:id', uploadIdValidator, handleValidationErrors, uploadController.getUpload);
router.get(
  '/:id/signed-url',
  uploadIdValidator,
  handleValidationErrors,
  uploadController.getSignedUrl
);
router.delete('/:id', uploadIdValidator, handleValidationErrors, uploadController.deleteUpload);

export default router;
