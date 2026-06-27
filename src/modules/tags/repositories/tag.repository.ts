import { BaseRepository } from '@shared/models/base.repository';
import { TagModel, ITag } from '@modules/tags/models/tag.model';

export class TagRepository extends BaseRepository<ITag> {
  constructor() {
    super(TagModel);
  }

  async findBySlugForOwner(ownerId: string, slug: string): Promise<ITag | null> {
    return this.findOne({ ownerId, slug });
  }

  async incrementUsage(tagId: string): Promise<void> {
    await this.model.updateOne({ _id: tagId }, { $inc: { usageCount: 1 } });
  }
}

export const tagRepository = new TagRepository();
