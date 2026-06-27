import { Types } from 'mongoose';
import { tagRepository } from '@modules/tags/repositories/tag.repository';
import { ITag } from '@modules/tags/models/tag.model';
import { ConflictError } from '@shared/errors';
import { PaginationQuery } from '@types-internal/index';
import { PaginatedResult } from '@shared/models/base.repository';

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export class TagService {
  async create(ownerId: string, name: string, aiGenerated = false): Promise<ITag> {
    const slug = slugify(name);
    const existing = await tagRepository.findBySlugForOwner(ownerId, slug);
    if (existing) throw new ConflictError(`Tag "${name}" already exists`);

    return tagRepository.create({
      name,
      slug,
      ownerId: new Types.ObjectId(ownerId),
      aiGenerated,
    });
  }

  /**
   * Idempotent helper used by the AI tags generator: finds-or-creates each
   * tag by name for the given owner, returning the resulting tag documents.
   */
  async findOrCreateMany(ownerId: string, names: string[]): Promise<ITag[]> {
    const results: ITag[] = [];
    for (const name of names) {
      const slug = slugify(name);
      const existing = await tagRepository.findBySlugForOwner(ownerId, slug);
      if (existing) {
        results.push(existing);
      } else {
        results.push(
          await tagRepository.create({
            name,
            slug,
            ownerId: new Types.ObjectId(ownerId),
            aiGenerated: true,
          })
        );
      }
    }
    return results;
  }

  async list(ownerId: string, pagination: PaginationQuery): Promise<PaginatedResult<ITag>> {
    return tagRepository.paginate({ ownerId }, pagination);
  }

  async delete(id: string): Promise<void> {
    await tagRepository.deleteById(id);
  }
}

export const tagService = new TagService();
