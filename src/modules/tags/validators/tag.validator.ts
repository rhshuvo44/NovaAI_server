import { body, param } from 'express-validator';

export const tagIdParamValidator = [param('id').isMongoId().withMessage('Invalid tag id')];

export const createTagValidator = [
  body('name')
    .isString()
    .notEmpty()
    .isLength({ max: 50 })
    .withMessage('name is required (max 50 chars)'),
];
