import { Types } from 'mongoose';
import { promptRepository } from '@modules/prompts/repositories/prompt.repository';
import { IPrompt } from '@modules/prompts/models/prompt.model';
import { promptOptimizerService } from '@modules/ai/services/prompt-optimizer.service';
import { AIFeature } from '@constants/index';
import { AuthorizationError } from '@shared/errors';
import { PaginationQuery } from '@types-internal/index';
import { PaginatedResult } from '@shared/models/base.repository';

export interface CreatePromptInput {
  title: string;
  content: string;
  feature?: AIFeature;
  isPublic?: boolean;
}

export class PromptService {
  async create(ownerId: string, input: CreatePromptInput): Promise<IPrompt> {
    return promptRepository.create({
      ...input,
      ownerId: new Types.ObjectId(ownerId),
    });
  }

  async list(ownerId: string, pagination: PaginationQuery): Promise<PaginatedResult<IPrompt>> {
    return promptRepository.paginate({ ownerId }, pagination);
  }

  async getById(id: string): Promise<IPrompt> {
    return promptRepository.findByIdOrThrow(id);
  }

  private assertOwnership(prompt: IPrompt, ownerId: string): void {
    if (prompt.ownerId.toString() !== ownerId) {
      throw new AuthorizationError('You do not have permission to modify this prompt');
    }
  }

  async update(id: string, ownerId: string, updates: Partial<CreatePromptInput>): Promise<IPrompt> {
    const prompt = await promptRepository.findByIdOrThrow(id);
    this.assertOwnership(prompt, ownerId);
    return promptRepository.updateByIdOrThrow(id, updates);
  }

  async toggleFavorite(id: string, ownerId: string): Promise<IPrompt> {
    const prompt = await promptRepository.findByIdOrThrow(id);
    this.assertOwnership(prompt, ownerId);
    return promptRepository.updateByIdOrThrow(id, { isFavorite: !prompt.isFavorite });
  }

  async optimizeAndSave(id: string, ownerId: string): Promise<IPrompt> {
    const prompt = await promptRepository.findByIdOrThrow(id);
    this.assertOwnership(prompt, ownerId);

    const { optimizedPrompt } = await promptOptimizerService.optimize(ownerId, prompt.content);
    return promptRepository.updateByIdOrThrow(id, { optimizedVersion: optimizedPrompt });
  }

  async recordUsage(id: string): Promise<void> {
    await promptRepository.incrementUsage(id);
  }

  async delete(id: string, ownerId: string): Promise<void> {
    const prompt = await promptRepository.findByIdOrThrow(id);
    this.assertOwnership(prompt, ownerId);
    await promptRepository.deleteById(id);
  }
}

export const promptService = new PromptService();
