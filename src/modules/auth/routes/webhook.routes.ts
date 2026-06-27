import { Router } from 'express';
import { handleClerkWebhook } from '@modules/auth/controllers/webhook.controller';

const router = Router();

/**
 * @openapi
 * /webhooks/clerk:
 *   post:
 *     tags: [Webhooks]
 *     summary: Receives Clerk user lifecycle events (user.created, user.updated, user.deleted)
 */
router.post('/clerk', handleClerkWebhook);

export default router;
