import { body, param } from 'express-validator';
import { AIFeature } from '@constants/index';

export const promptIdParamValidator = [param('id').isMongoId().withMessage('Invalid prompt id')];

export const createPromptValidator = [
  body('title').isString().notEmpty().isLength({ max: 200 }),
  body('content').isString().notEmpty(),
  body('feature').optional().isIn(Object.values(AIFeature)),
  body('isPublic').optional().isBoolean(),
];

export const updatePromptValidator = [
  param('id').isMongoId().withMessage('Invalid prompt id'),
  body('title').optional().isString().isLength({ max: 200 }),
  body('content').optional().isString(),
  body('feature').optional().isIn(Object.values(AIFeature)),
  body('isPublic').optional().isBoolean(),
];
