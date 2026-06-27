import { BaseRepository } from '@shared/models/base.repository';
import { MessageModel, IMessage } from '@modules/chat/models/message.model';

export class MessageRepository extends BaseRepository<IMessage> {
  constructor() {
    super(MessageModel, false);
  }

  async findByChatId(chatId: string, limit = 50): Promise<IMessage[]> {
    return this.findMany({ chatId }, { sort: { createdAt: 1 }, limit });
  }
}

export const messageRepository = new MessageRepository();
