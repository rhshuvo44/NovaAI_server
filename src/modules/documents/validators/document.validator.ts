import { body, param, query } from 'express-validator';

export const documentIdParamValidator = [
  param('id').isMongoId().withMessage('Invalid document id'),
];

export const createDocumentValidator = [
  body('title')
    .isString()
    .notEmpty()
    .isLength({ max: 300 })
    .withMessage('title is required (max 300 chars)'),
  body('content').isString().notEmpty().withMessage('content is required'),
  body('categoryId').optional().isMongoId().withMessage('Invalid categoryId'),
  body('tags').optional().isArray(),
  body('tags.*').optional().isMongoId().withMessage('Invalid tag id'),
  body('isPublic').optional().isBoolean(),
];

export const updateDocumentValidator = [
  param('id').isMongoId().withMessage('Invalid document id'),
  body('title').optional().isString().isLength({ max: 300 }),
  body('content').optional().isString(),
  body('categoryId').optional().isMongoId(),
  body('tags').optional().isArray(),
  body('tags.*').optional().isMongoId(),
  body('isPublic').optional().isBoolean(),
];

export const searchDocumentValidator = [
  query('q').isString().notEmpty().withMessage('q query param is required'),
];

export const bulkDeleteValidator = [
  body('ids').isArray({ min: 1 }).withMessage('ids must be a non-empty array'),
  body('ids.*').isMongoId().withMessage('Invalid document id in ids array'),
];
