import { Router } from 'express';
import * as authController from '@modules/auth/controllers/auth.controller';
import {
  registerValidator,
  loginValidator,
  refreshTokenValidator,
  logoutValidator,
} from '@modules/auth/validators/auth.validator';
import { handleValidationErrors } from '@middlewares/validation.middleware';
import { requireAuth } from '@middlewares/auth.middleware';

const router = Router();

/**
 * @openapi
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user account
 */
router.post('/register', registerValidator, handleValidationErrors, authController.register);

/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login with email and password
 */
router.post('/login', loginValidator, handleValidationErrors, authController.login);

/**
 * @openapi
 * /auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Rotate refresh token and obtain a new access token
 */
router.post(
  '/refresh',
  refreshTokenValidator,
  handleValidationErrors,
  authController.refreshSession
);

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Revoke the provided refresh token
 */
router.post('/logout', logoutValidator, handleValidationErrors, authController.logout);

/**
 * @openapi
 * /auth/logout-all:
 *   post:
 *     tags: [Auth]
 *     summary: Revoke all refresh tokens for the authenticated user
 */
router.post('/logout-all', requireAuth, authController.logoutAllSessions);

/**
 * @openapi
 * /auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Get the currently authenticated user
 */
router.get('/me', requireAuth, authController.getCurrentUser);

export default router;
