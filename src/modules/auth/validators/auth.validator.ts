import { body } from 'express-validator';

export const bootstrapSessionValidator = [
  body('sessionToken')
    .isString()
    .withMessage('sessionToken must be a string')
    .notEmpty()
    .withMessage('sessionToken is required'),
];

export const refreshTokenValidator = [
  body('refreshToken')
    .isString()
    .withMessage('refreshToken must be a string')
    .notEmpty()
    .withMessage('refreshToken is required'),
];

export const logoutValidator = [
  body('refreshToken')
    .isString()
    .withMessage('refreshToken must be a string')
    .notEmpty()
    .withMessage('refreshToken is required'),
];
