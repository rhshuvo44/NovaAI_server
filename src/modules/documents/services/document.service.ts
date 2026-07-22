import { Types } from 'mongoose';
import { documentRepository } from '@modules/documents/repositories/document.repository';
import { IDocument } from '@modules/documents/models/document.model';
import { AuthorizationError } from '@shared/errors';
import { cacheService } from '@shared/services/cache.service';
import { CACHE_TTL } from '@constants/index';
import { PaginationQuery, SearchQuery } from '@types-internal/index';
import { PaginatedResult } from '@shared/models/base.repository';

export interface CreateDocumentInput {
  title: string;
  content: string;
  categoryId?: string;
  tags?: string[];
  isPublic?: boolean;
}

export class DocumentService {
  private listCacheKey(ownerId: string, page: number, limit: number): string {
    return `documents:${ownerId}:${page}:${limit}`;
  }

  async create(ownerId: string, input: CreateDocumentInput): Promise<IDocument> {
    const doc = await documentRepository.create({
      title: input.title,
      content: input.content,
      ownerId: new Types.ObjectId(ownerId),
      categoryId: input.categoryId ? new Types.ObjectId(input.categoryId) : undefined,
      tags: (input.tags ?? []).map((t) => new Types.ObjectId(t)),
      isPublic: input.isPublic ?? false,
    });
    await cacheService.invalidatePattern(`documents:${ownerId}:*`);
    return doc;
  }

  async list(ownerId: string, pagination: PaginationQuery): Promise<PaginatedResult<IDocument>> {
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 20;
    const key = this.listCacheKey(ownerId, page, limit);

    return cacheService.getOrSet(
      key,
      () => documentRepository.paginate({ ownerId, isArchived: false }, pagination),
      CACHE_TTL.SHORT
    );
  }

  async search(ownerId: string, query: SearchQuery): Promise<IDocument[]> {
    if (!query.q) return [];
    const key = `search:documents:${ownerId}:${query.q}`;
    return cacheService.getOrSet(
      key,
      () => documentRepository.search(ownerId, query.q!),
      CACHE_TTL.SEARCH
    );
  }

  async getById(id: string, requesterId?: string): Promise<IDocument> {
    const doc = await documentRepository.findByIdOrThrow(id);
    if (!doc.isPublic && doc.ownerId.toString() !== requesterId) {
      throw new AuthorizationError('You do not have access to this document');
    }
    return doc;
  }

  async update(
    id: string,
    ownerId: string,
    updates: Partial<CreateDocumentInput>
  ): Promise<IDocument> {
    const doc = await documentRepository.findByIdOrThrow(id);
    this.assertOwnership(doc, ownerId);

    const { categoryId, tags, ...rest } = updates;
    const updated = await documentRepository.updateByIdOrThrow(id, {
      ...rest,
      ...(categoryId ? { categoryId: new Types.ObjectId(categoryId) } : {}),
      ...(tags ? { tags: tags.map((t) => new Types.ObjectId(t)) } : {}),
      $inc: { version: 1 },
    });

    await cacheService.invalidatePattern(`documents:${ownerId}:*`);
    return updated;
  }

  private assertOwnership(doc: IDocument, ownerId: string): void {
    if (doc.ownerId.toString() !== ownerId) {
      throw new AuthorizationError('You do not have permission to modify this document');
    }
  }

  async archive(id: string, ownerId: string): Promise<IDocument> {
    const doc = await documentRepository.findByIdOrThrow(id);
    this.assertOwnership(doc, ownerId);
    const updated = await documentRepository.updateByIdOrThrow(id, { isArchived: true });
    await cacheService.invalidatePattern(`documents:${ownerId}:*`);
    return updated;
  }

  async delete(id: string, ownerId: string): Promise<void> {
    const doc = await documentRepository.findByIdOrThrow(id);
    this.assertOwnership(doc, ownerId);
    await documentRepository.deleteById(id);
    await cacheService.invalidatePattern(`documents:${ownerId}:*`);
  }

  async bulkDelete(ids: string[], ownerId: string): Promise<number> {
    const count = await documentRepository.bulkDelete(ids);
    await cacheService.invalidatePattern(`documents:${ownerId}:*`);
    return count;
  }
}

export const documentService = new DocumentService();
