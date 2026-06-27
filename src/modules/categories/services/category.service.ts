import { Types } from 'mongoose';
import { categoryRepository } from '@modules/categories/repositories/category.repository';
import { ICategory } from '@modules/categories/models/category.model';
import { ConflictError } from '@shared/errors';
import { PaginationQuery } from '@types-internal/index';
import { PaginatedResult } from '@shared/models/base.repository';

export interface CreateCategoryInput {
  name: string;
  description?: string;
  parentId?: string;
  icon?: string;
  color?: string;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export class CategoryService {
  async create(ownerId: string, input: CreateCategoryInput): Promise<ICategory> {
    const slug = slugify(input.name);
    const existing = await categoryRepository.findBySlug(slug);
    if (existing) throw new ConflictError(`A category with slug "${slug}" already exists`);

    const { parentId, ...rest } = input;
    return categoryRepository.create({
      ...rest,
      slug,
      ownerId: new Types.ObjectId(ownerId),
      ...(parentId ? { parentId: new Types.ObjectId(parentId) } : {}),
    });
  }

  async list(ownerId: string, pagination: PaginationQuery): Promise<PaginatedResult<ICategory>> {
    return categoryRepository.paginate({ ownerId }, pagination);
  }

  async getById(id: string): Promise<ICategory> {
    return categoryRepository.findByIdOrThrow(id);
  }

  async update(id: string, updates: Partial<CreateCategoryInput>): Promise<ICategory> {
    const { parentId, ...rest } = updates;
    return categoryRepository.updateByIdOrThrow(id, {
      ...rest,
      ...(parentId ? { parentId: new Types.ObjectId(parentId) } : {}),
    });
  }

  async delete(id: string): Promise<void> {
    await categoryRepository.deleteById(id);
  }
}

export const categoryService = new CategoryService();
