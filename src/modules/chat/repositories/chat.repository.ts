import { BaseRepository } from '@shared/models/base.repository';
import { ChatModel, IChat } from '@modules/chat/models/chat.model';

export class ChatRepository extends BaseRepository<IChat> {
  constructor() {
    super(ChatModel);
  }

  async incrementMessageCount(chatId: string): Promise<void> {
    await this.model.updateOne(
      { _id: chatId },
      { $inc: { messageCount: 1 }, lastMessageAt: new Date() }
    );
  }
}

export const chatRepository = new ChatRepository();
