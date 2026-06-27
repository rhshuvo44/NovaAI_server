import { BaseRepository } from '@shared/models/base.repository';
import { CategoryModel, ICategory } from '@modules/categories/models/category.model';

export class CategoryRepository extends BaseRepository<ICategory> {
  constructor() {
    super(CategoryModel);
  }

  async findBySlug(slug: string): Promise<ICategory | null> {
    return this.findOne({ slug });
  }
}

export const categoryRepository = new CategoryRepository();
