import { body, param } from 'express-validator';
import { Role } from '@constants/index';

export const userIdParamValidator = [param('id').isMongoId().withMessage('Invalid user id')];

export const updateProfileValidator = [
  body('firstName').optional().isString().isLength({ max: 100 }),
  body('lastName').optional().isString().isLength({ max: 100 }),
  body('avatarUrl').optional().isURL().withMessage('avatarUrl must be a valid URL'),
];

export const changeRoleValidator = [
  param('id').isMongoId().withMessage('Invalid user id'),
  body('role').isIn(Object.values(Role)).withMessage('Invalid role'),
];
