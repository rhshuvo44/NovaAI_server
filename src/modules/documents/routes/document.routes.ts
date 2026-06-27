import { Router } from 'express';
import * as documentController from '@modules/documents/controllers/document.controller';
import {
  documentIdParamValidator,
  createDocumentValidator,
  updateDocumentValidator,
  searchDocumentValidator,
  bulkDeleteValidator,
} from '@modules/documents/validators/document.validator';
import { paginationValidator } from '@validators/pagination.validator';
import { handleValidationErrors } from '@middlewares/validation.middleware';
import { requireAuth, optionalAuth } from '@middlewares/auth.middleware';
import { requirePermissions } from '@middlewares/rbac.middleware';
import { Permission } from '@constants/index';

const router = Router();

router.get(
  '/search',
  requireAuth,
  searchDocumentValidator,
  handleValidationErrors,
  documentController.searchDocuments
);
router.get(
  '/:id',
  optionalAuth,
  documentIdParamValidator,
  handleValidationErrors,
  documentController.getDocument
);

router.use(requireAuth);

router.post(
  '/',
  requirePermissions(Permission.DOCUMENT_WRITE),
  createDocumentValidator,
  handleValidationErrors,
  documentController.createDocument
);

router.get('/', paginationValidator, handleValidationErrors, documentController.listDocuments);

router.patch(
  '/:id',
  requirePermissions(Permission.DOCUMENT_WRITE),
  updateDocumentValidator,
  handleValidationErrors,
  documentController.updateDocument
);

router.patch(
  '/:id/archive',
  requirePermissions(Permission.DOCUMENT_WRITE),
  documentIdParamValidator,
  handleValidationErrors,
  documentController.archiveDocument
);

router.delete(
  '/:id',
  requirePermissions(Permission.DOCUMENT_DELETE),
  documentIdParamValidator,
  handleValidationErrors,
  documentController.deleteDocument
);

router.post(
  '/bulk-delete',
  requirePermissions(Permission.DOCUMENT_DELETE),
  bulkDeleteValidator,
  handleValidationErrors,
  documentController.bulkDeleteDocuments
);

export default router;
