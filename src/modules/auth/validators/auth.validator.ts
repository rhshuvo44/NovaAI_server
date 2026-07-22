import { body } from 'express-validator';

export const registerValidator = [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password')
    .isString()
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),
  body('firstName').optional().isString().trim().isLength({ max: 100 }),
  body('lastName').optional().isString().trim().isLength({ max: 100 }),
];

export const loginValidator = [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').isString().notEmpty().withMessage('Password is required'),
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
