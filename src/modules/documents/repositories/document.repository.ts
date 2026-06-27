import { BaseRepository } from '@shared/models/base.repository';
import { DocumentModel, IDocument } from '@modules/documents/models/document.model';

export class DocumentRepository extends BaseRepository<IDocument> {
  constructor() {
    super(DocumentModel);
  }

  async search(ownerId: string, query: string, limit = 20): Promise<IDocument[]> {
    return this.model
      .find({ ownerId, deletedAt: null, $text: { $search: query } })
      .limit(limit)
      .exec();
  }
}

export const documentRepository = new DocumentRepository();
