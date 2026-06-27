import { Response } from 'express';
import { ErrorDetail } from '@shared/errors';

export interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface CursorPaginationMeta {
  nextCursor: string | null;
  prevCursor: string | null;
  hasMore: boolean;
}

export interface ApiSuccessBody<T> {
  success: true;
  message: string;
  data: T;
  meta?: PaginationMeta | CursorPaginationMeta | Record<string, unknown>;
  timestamp: string;
}

export interface ApiErrorBody {
  success: false;
  message: string;
  errorCode: string;
  details?: ErrorDetail[];
  timestamp: string;
  stack?: string;
}

export class ApiResponse {
  static success<T>(
    res: Response,
    data: T,
    message = 'Success',
    statusCode = 200,
    meta?: PaginationMeta | CursorPaginationMeta | Record<string, unknown>
  ): Response<ApiSuccessBody<T>> {
    const body: ApiSuccessBody<T> = {
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
    };
    if (meta) body.meta = meta;
    return res.status(statusCode).json(body);
  }

  static created<T>(res: Response, data: T, message = 'Resource created successfully'): Response {
    return this.success(res, data, message, 201);
  }

  static noContent(res: Response, message = 'Resource deleted successfully'): Response {
    return res.status(200).json({
      success: true,
      message,
      data: null,
      timestamp: new Date().toISOString(),
    });
  }

  static paginated<T>(
    res: Response,
    data: T[],
    pagination: PaginationMeta,
    message = 'Success'
  ): Response {
    return this.success(res, data, message, 200, pagination);
  }

  static error(
    res: Response,
    message: string,
    statusCode = 500,
    errorCode = 'INTERNAL_SERVER_ERROR',
    details?: ErrorDetail[],
    stack?: string
  ): Response<ApiErrorBody> {
    const body: ApiErrorBody = {
      success: false,
      message,
      errorCode,
      details,
      timestamp: new Date().toISOString(),
    };
    if (stack) body.stack = stack;
    return res.status(statusCode).json(body);
  }
}

export function buildPaginationMeta(
  page: number,
  limit: number,
  totalItems: number
): PaginationMeta {
  const totalPages = Math.max(Math.ceil(totalItems / limit), 1);
  return {
    page,
    limit,
    totalItems,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}
