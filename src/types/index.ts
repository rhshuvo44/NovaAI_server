import { Role, Permission } from '@constants/index';

export interface AuthenticatedUser {
  userId: string;
  email: string;
  role: Role;
  permissions: Permission[];
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      requestId?: string;
      rawBody?: Buffer;
    }
  }
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface CursorPaginationQuery {
  cursor?: string;
  limit?: number;
  order?: 'asc' | 'desc';
}

export interface SearchQuery extends PaginationQuery {
  q?: string;
}

export interface FilterQuery extends PaginationQuery {
  [key: string]: unknown;
}

export interface BaseEntity {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export type SortOrder = 1 | -1;

export interface RepositoryOptions {
  session?: unknown;
  lean?: boolean;
  populate?: string | string[];
}

export interface BulkOperationResult {
  matchedCount: number;
  modifiedCount: number;
  deletedCount?: number;
}

export {};
