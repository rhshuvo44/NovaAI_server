import { body, param } from 'express-validator';

export const apiKeyIdParamValidator = [param('id').isMongoId().withMessage('Invalid API key id')];

export const createApiKeyValidator = [
  body('name').isString().notEmpty().isLength({ max: 100 }),
  body('scopes').isArray().withMessage('scopes must be an array'),
  body('scopes.*').isString(),
  body('expiresAt').optional().isISO8601().withMessage('expiresAt must be a valid ISO date'),
];
