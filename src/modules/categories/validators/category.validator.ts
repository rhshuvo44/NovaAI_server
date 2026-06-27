import { body, param } from 'express-validator';

export const categoryIdParamValidator = [
  param('id').isMongoId().withMessage('Invalid category id'),
];

export const createCategoryValidator = [
  body('name').isString().notEmpty().isLength({ max: 150 }).withMessage('name is required'),
  body('description').optional().isString().isLength({ max: 500 }),
  body('parentId').optional().isMongoId(),
  body('icon').optional().isString(),
  body('color').optional().isString(),
];

export const updateCategoryValidator = [
  param('id').isMongoId().withMessage('Invalid category id'),
  body('name').optional().isString().isLength({ max: 150 }),
  body('description').optional().isString().isLength({ max: 500 }),
  body('parentId').optional().isMongoId(),
  body('icon').optional().isString(),
  body('color').optional().isString(),
];
