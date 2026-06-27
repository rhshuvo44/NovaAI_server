import { Request, Response } from 'express';
import { clerkWebhookService } from '@modules/auth/services/clerk-webhook.service';
import { ApiResponse } from '@shared/responses/api-response';
import { asyncHandler } from '@utils/async-handler';
import { ValidationError } from '@shared/errors';

export const handleClerkWebhook = asyncHandler(async (req: Request, res: Response) => {
  if (!req.rawBody) {
    throw new ValidationError('Missing raw request body for webhook verification');
  }

  const headers: Record<string, string> = {
    'svix-id': req.headers['svix-id'] as string,
    'svix-timestamp': req.headers['svix-timestamp'] as string,
    'svix-signature': req.headers['svix-signature'] as string,
  };

  const event = clerkWebhookService.verifyAndParse(req.rawBody.toString('utf-8'), headers);
  await clerkWebhookService.handleEvent(event);

  ApiResponse.success(res, { received: true }, 'Webhook processed');
});
