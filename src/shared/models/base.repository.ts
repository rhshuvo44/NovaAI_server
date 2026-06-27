import { Model, Document, FilterQuery as MongoFilterQuery, UpdateQuery, Types } from 'mongoose';
import { DatabaseError, NotFoundError } from '@shared/errors';
import { dbLogger } from '@utils/logger';
import { PAGINATION_DEFAULTS } from '@constants/index';
import { PaginationQuery } from '@types-internal/index';
import { buildPaginationMeta, PaginationMeta } from '@shared/responses/api-response';

export interface PaginatedResult<T> {
  items: T[];
  meta: PaginationMeta;
}

/**
 * Generic repository providing common data-access operations.
 * Feature-specific repositories extend this and add domain methods,
 * keeping all raw Mongoose query logic out of services and controllers.
 */
export abstract class BaseRepository<T extends Document> {
  protected readonly model: Model<T>;
  protected readonly supportsSoftDelete: boolean;

  constructor(model: Model<T>, supportsSoftDelete = true) {
    this.model = model;
    this.supportsSoftDelete = supportsSoftDelete;
  }

  private get notDeletedFilter(): MongoFilterQuery<T> {
    return this.supportsSoftDelete
      ? ({ deletedAt: null } as MongoFilterQuery<T>)
      : ({} as MongoFilterQuery<T>);
  }

  async create(payload: Partial<T>): Promise<T> {
    try {
      const doc = new this.model(payload);
      return await doc.save();
    } catch (error) {
      dbLogger.error('Repository create failed', {
        model: this.model.modelName,
        error: (error as Error).message,
      });
      throw new DatabaseError(`Failed to create ${this.model.modelName}`);
    }
  }

  async findById(id: string, populate?: string | string[]): Promise<T | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    try {
      let query = this.model.findOne({
        _id: id,
        ...this.notDeletedFilter,
      } as MongoFilterQuery<T>);
      if (populate) query = query.populate(populate as string);
      return await query.exec();
    } catch (error) {
      dbLogger.error('Repository findById failed', {
        model: this.model.modelName,
        error: (error as Error).message,
      });
      throw new DatabaseError(`Failed to fetch ${this.model.modelName}`);
    }
  }

  async findByIdOrThrow(id: string, populate?: string | string[]): Promise<T> {
    const doc = await this.findById(id, populate);
    if (!doc) throw new NotFoundError(this.model.modelName);
    return doc;
  }

  async findOne(filter: MongoFilterQuery<T>, populate?: string | string[]): Promise<T | null> {
    try {
      let query = this.model.findOne({ ...filter, ...this.notDeletedFilter });
      if (populate) query = query.populate(populate as string);
      return await query.exec();
    } catch (error) {
      dbLogger.error('Repository findOne failed', {
        model: this.model.modelName,
        error: (error as Error).message,
      });
      throw new DatabaseError(`Failed to fetch ${this.model.modelName}`);
    }
  }

  async findMany(
    filter: MongoFilterQuery<T> = {},
    options: { populate?: string | string[]; sort?: Record<string, 1 | -1>; limit?: number } = {}
  ): Promise<T[]> {
    try {
      let query = this.model.find({ ...filter, ...this.notDeletedFilter });
      if (options.populate) query = query.populate(options.populate as string);
      if (options.sort) query = query.sort(options.sort);
      if (options.limit) query = query.limit(options.limit);
      return await query.exec();
    } catch (error) {
      dbLogger.error('Repository findMany failed', {
        model: this.model.modelName,
        error: (error as Error).message,
      });
      throw new DatabaseError(`Failed to fetch ${this.model.modelName} list`);
    }
  }

  async paginate(
    filter: MongoFilterQuery<T>,
    pagination: PaginationQuery,
    populate?: string | string[]
  ): Promise<PaginatedResult<T>> {
    const page = Math.max(pagination.page ?? PAGINATION_DEFAULTS.PAGE, 1);
    const limit = Math.min(
      pagination.limit ?? PAGINATION_DEFAULTS.LIMIT,
      PAGINATION_DEFAULTS.MAX_LIMIT
    );
    const skip = (page - 1) * limit;
    const sortField = pagination.sort ?? 'createdAt';
    const sortOrder = pagination.order === 'asc' ? 1 : -1;

    try {
      const combinedFilter = { ...filter, ...this.notDeletedFilter };

      let query = this.model
        .find(combinedFilter)
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(limit);

      if (populate) query = query.populate(populate as string);

      const [items, totalItems] = await Promise.all([
        query.exec(),
        this.model.countDocuments(combinedFilter),
      ]);

      return { items, meta: buildPaginationMeta(page, limit, totalItems) };
    } catch (error) {
      dbLogger.error('Repository paginate failed', {
        model: this.model.modelName,
        error: (error as Error).message,
      });
      throw new DatabaseError(`Failed to paginate ${this.model.modelName}`);
    }
  }

  async updateById(id: string, update: UpdateQuery<T>): Promise<T | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    try {
      return await this.model.findOneAndUpdate(
        { _id: id, ...this.notDeletedFilter } as MongoFilterQuery<T>,
        update,
        { new: true, runValidators: true }
      );
    } catch (error) {
      dbLogger.error('Repository updateById failed', {
        model: this.model.modelName,
        error: (error as Error).message,
      });
      throw new DatabaseError(`Failed to update ${this.model.modelName}`);
    }
  }

  async updateByIdOrThrow(id: string, update: UpdateQuery<T>): Promise<T> {
    const doc = await this.updateById(id, update);
    if (!doc) throw new NotFoundError(this.model.modelName);
    return doc;
  }

  async bulkUpdate(
    filter: MongoFilterQuery<T>,
    update: UpdateQuery<T>
  ): Promise<{ matchedCount: number; modifiedCount: number }> {
    try {
      const result = await this.model.updateMany({ ...filter, ...this.notDeletedFilter }, update);
      return { matchedCount: result.matchedCount, modifiedCount: result.modifiedCount };
    } catch (error) {
      dbLogger.error('Repository bulkUpdate failed', {
        model: this.model.modelName,
        error: (error as Error).message,
      });
      throw new DatabaseError(`Failed to bulk update ${this.model.modelName}`);
    }
  }

  async deleteById(id: string, soft = true): Promise<boolean> {
    if (!Types.ObjectId.isValid(id)) return false;
    try {
      if (soft && this.supportsSoftDelete) {
        const result = await this.model.findOneAndUpdate(
          { _id: id, deletedAt: null } as MongoFilterQuery<T>,
          { deletedAt: new Date() } as UpdateQuery<T>
        );
        return Boolean(result);
      }
      const result = await this.model.findOneAndDelete({ _id: id } as MongoFilterQuery<T>);
      return Boolean(result);
    } catch (error) {
      dbLogger.error('Repository deleteById failed', {
        model: this.model.modelName,
        error: (error as Error).message,
      });
      throw new DatabaseError(`Failed to delete ${this.model.modelName}`);
    }
  }

  async bulkDelete(ids: string[], soft = true): Promise<number> {
    const validIds = ids.filter((id) => Types.ObjectId.isValid(id));
    try {
      if (soft && this.supportsSoftDelete) {
        const result = await this.model.updateMany(
          { _id: { $in: validIds }, deletedAt: null } as MongoFilterQuery<T>,
          { deletedAt: new Date() } as UpdateQuery<T>
        );
        return result.modifiedCount;
      }
      const result = await this.model.deleteMany({ _id: { $in: validIds } } as MongoFilterQuery<T>);
      return result.deletedCount ?? 0;
    } catch (error) {
      dbLogger.error('Repository bulkDelete failed', {
        model: this.model.modelName,
        error: (error as Error).message,
      });
      throw new DatabaseError(`Failed to bulk delete ${this.model.modelName}`);
    }
  }

  async count(filter: MongoFilterQuery<T> = {}): Promise<number> {
    try {
      return await this.model.countDocuments({ ...filter, ...this.notDeletedFilter });
    } catch (error) {
      dbLogger.error('Repository count failed', {
        model: this.model.modelName,
        error: (error as Error).message,
      });
      throw new DatabaseError(`Failed to count ${this.model.modelName}`);
    }
  }

  async exists(filter: MongoFilterQuery<T>): Promise<boolean> {
    try {
      const doc = await this.model.exists({ ...filter, ...this.notDeletedFilter });
      return Boolean(doc);
    } catch (error) {
      dbLogger.error('Repository exists failed', {
        model: this.model.modelName,
        error: (error as Error).message,
      });
      throw new DatabaseError(`Failed to check existence of ${this.model.modelName}`);
    }
  }
}
