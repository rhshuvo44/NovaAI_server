import { Webhook } from 'svix';
import { env } from '@config/env';
import { userRepository } from '@modules/users/repositories/user.repository';
import { userService } from '@modules/users/services/user.service';
import { AuthenticationError } from '@shared/errors';
import { logger } from '@utils/logger';

interface ClerkWebhookEvent {
  type: string;
  data: {
    id: string;
    email_addresses?: Array<{ id: string; email_address: string }>;
    primary_email_address_id?: string;
    first_name?: string | null;
    last_name?: string | null;
    image_url?: string;
  };
}

export class ClerkWebhookService {
  verifyAndParse(rawBody: string, headers: Record<string, string>): ClerkWebhookEvent {
    const webhook = new Webhook(env.CLERK_WEBHOOK_SECRET);
    try {
      return webhook.verify(rawBody, headers) as unknown as ClerkWebhookEvent;
    } catch (error) {
      logger.warn('Clerk webhook signature verification failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw new AuthenticationError('Invalid webhook signature');
    }
  }

  async handleEvent(event: ClerkWebhookEvent): Promise<void> {
    switch (event.type) {
      case 'user.created':
      case 'user.updated':
        await this.syncUser(event.data);
        break;
      case 'user.deleted':
        await this.handleUserDeleted(event.data.id);
        break;
      default:
        logger.info('Unhandled Clerk webhook event type', { type: event.type });
    }
  }

  private async syncUser(data: ClerkWebhookEvent['data']): Promise<void> {
    const primaryEmail =
      data.email_addresses?.find((e) => e.id === data.primary_email_address_id)?.email_address ??
      data.email_addresses?.[0]?.email_address;

    if (!primaryEmail) {
      logger.warn('Clerk user webhook missing email address', { clerkId: data.id });
      return;
    }

    await userService.findOrCreateFromClerk({
      clerkId: data.id,
      email: primaryEmail,
      firstName: data.first_name ?? undefined,
      lastName: data.last_name ?? undefined,
      avatarUrl: data.image_url,
    });
  }

  private async handleUserDeleted(clerkId: string): Promise<void> {
    const user = await userRepository.findByClerkId(clerkId);
    if (!user) return;
    await userRepository.deleteById(user._id.toString());
  }
}

export const clerkWebhookService = new ClerkWebhookService();
