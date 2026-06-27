import { Router } from 'express';
import * as aiController from '@modules/ai/controllers/ai.controller';
import {
  generateContentValidator,
  optimizePromptValidator,
  summarizeValidator,
  generateTagsValidator,
  recommendationsValidator,
} from '@modules/ai/validators/ai.validator';
import { handleValidationErrors } from '@middlewares/validation.middleware';
import { requireAuth } from '@middlewares/auth.middleware';
import { requirePermissions } from '@middlewares/rbac.middleware';
import { Permission } from '@constants/index';
import { aiRateLimiter } from '@middlewares/rate-limit.middleware';

const router = Router();

router.use(requireAuth, requirePermissions(Permission.AI_USE), aiRateLimiter);

/**
 * @openapi
 * /ai/content-generator:
 *   post:
 *     tags: [AI]
 *     summary: Generate written content on a given topic
 */
router.post(
  '/content-generator',
  generateContentValidator,
  handleValidationErrors,
  aiController.generateContent
);

/**
 * @openapi
 * /ai/prompt-optimizer:
 *   post:
 *     tags: [AI]
 *     summary: Rewrite a prompt to be clearer and more effective
 */
router.post(
  '/prompt-optimizer',
  optimizePromptValidator,
  handleValidationErrors,
  aiController.optimizePrompt
);

/**
 * @openapi
 * /ai/summarizer:
 *   post:
 *     tags: [AI]
 *     summary: Summarize a block of text
 */
router.post('/summarizer', summarizeValidator, handleValidationErrors, aiController.summarizeText);

/**
 * @openapi
 * /ai/tags-generator:
 *   post:
 *     tags: [AI]
 *     summary: Generate topical tags for content
 */
router.post(
  '/tags-generator',
  generateTagsValidator,
  handleValidationErrors,
  aiController.generateTags
);

/**
 * @openapi
 * /ai/recommendations:
 *   post:
 *     tags: [AI]
 *     summary: Get personalized document recommendations
 */
router.post(
  '/recommendations',
  recommendationsValidator,
  handleValidationErrors,
  aiController.getRecommendations
);

export default router;
