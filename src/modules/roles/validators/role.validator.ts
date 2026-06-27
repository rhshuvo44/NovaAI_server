import { body, param } from 'express-validator';
import { Role, Permission } from '@constants/index';

export const createRoleValidator = [
  body('name').isIn(Object.values(Role)).withMessage('Invalid role name'),
  body('displayName').isString().notEmpty().withMessage('displayName is required'),
  body('description').optional().isString().isLength({ max: 500 }),
  body('permissions').isArray().withMessage('permissions must be an array'),
  body('permissions.*').isIn(Object.values(Permission)).withMessage('Invalid permission value'),
];

export const updatePermissionsValidator = [
  param('id').isMongoId().withMessage('Invalid role id'),
  body('permissions').isArray().withMessage('permissions must be an array'),
  body('permissions.*').isIn(Object.values(Permission)).withMessage('Invalid permission value'),
];

export const roleIdParamValidator = [param('id').isMongoId().withMessage('Invalid role id')];
