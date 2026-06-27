import { BaseRepository } from '@shared/models/base.repository';
import { PromptModel, IPrompt } from '@modules/prompts/models/prompt.model';

export class PromptRepository extends BaseRepository<IPrompt> {
  constructor() {
    super(PromptModel);
  }

  async incrementUsage(id: string): Promise<void> {
    await this.model.updateOne({ _id: id }, { $inc: { usageCount: 1 } });
  }
}

export const promptRepository = new PromptRepository();
