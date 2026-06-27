import { Types } from 'mongoose';
import { chatRepository } from '@modules/chat/repositories/chat.repository';
import { messageRepository } from '@modules/chat/repositories/message.repository';
import { aiCoreService } from '@modules/ai/services/ai-core.service';
import { IChat } from '@modules/chat/models/chat.model';
import { IMessage, MessageRole } from '@modules/chat/models/message.model';
import { AIFeature } from '@constants/index';
import { AIMessage } from '@modules/ai/interfaces/ai-provider.interface';
import { NotFoundError, AuthorizationError } from '@shared/errors';
import { PaginationQuery } from '@types-internal/index';
import { PaginatedResult } from '@shared/models/base.repository';

const SYSTEM_PROMPT =
  'You are a helpful assistant inside the AI Workspace platform. Be concise and accurate.';

export class ChatService {
  async createChat(userId: string, title?: string): Promise<IChat> {
    return chatRepository.create({
      userId: new Types.ObjectId(userId),
      title: title ?? 'New Chat',
    });
  }

  async listChats(userId: string, pagination: PaginationQuery): Promise<PaginatedResult<IChat>> {
    return chatRepository.paginate({ userId, isArchived: false }, pagination);
  }

  async getChat(chatId: string, userId: string): Promise<IChat> {
    const chat = await chatRepository.findByIdOrThrow(chatId);
    this.assertOwnership(chat, userId);
    return chat;
  }

  private assertOwnership(chat: IChat, userId: string): void {
    if (chat.userId.toString() !== userId) {
      throw new AuthorizationError('You do not have access to this chat');
    }
  }

  async getMessages(chatId: string, userId: string): Promise<IMessage[]> {
    await this.getChat(chatId, userId); // ownership check
    return messageRepository.findByChatId(chatId);
  }

  async sendMessage(
    chatId: string,
    userId: string,
    content: string
  ): Promise<{ userMessage: IMessage; assistantMessage: IMessage }> {
    const chat = await chatRepository.findById(chatId);
    if (!chat) throw new NotFoundError('Chat');
    this.assertOwnership(chat, userId);

    const userMessage = await messageRepository.create({
      chatId: new Types.ObjectId(chatId),
      userId: new Types.ObjectId(userId),
      role: MessageRole.USER,
      content,
    });

    const history = await messageRepository.findByChatId(chatId, 20);
    const aiMessages: AIMessage[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history.map((m) => ({
        role: m.role === MessageRole.ASSISTANT ? ('assistant' as const) : ('user' as const),
        content: m.content,
      })),
    ];

    const result = await aiCoreService.completeTracked(
      { messages: aiMessages },
      { userId, feature: AIFeature.CHAT, cache: false } // conversational turns should not be cached
    );

    const assistantMessage = await messageRepository.create({
      chatId: new Types.ObjectId(chatId),
      userId: new Types.ObjectId(userId),
      role: MessageRole.ASSISTANT,
      content: result.content,
      tokensUsed: result.totalTokens,
      aiModel: result.model,
    });

    await chatRepository.incrementMessageCount(chatId);

    return { userMessage, assistantMessage };
  }

  async archiveChat(chatId: string, userId: string): Promise<IChat> {
    const chat = await this.getChat(chatId, userId);
    return chatRepository.updateByIdOrThrow(chat._id.toString(), { isArchived: true });
  }

  async deleteChat(chatId: string, userId: string): Promise<void> {
    await this.getChat(chatId, userId);
    await chatRepository.deleteById(chatId);
  }
}

export const chatService = new ChatService();
