import { query } from 'express-validator';
import { Request } from 'express';
import { PaginationQuery } from '@types-internal/index';
import { PAGINATION_DEFAULTS } from '@constants/index';

export const paginationValidator = [
  query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer').toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: PAGINATION_DEFAULTS.MAX_LIMIT })
    .withMessage(`limit must be between 1 and ${PAGINATION_DEFAULTS.MAX_LIMIT}`)
    .toInt(),
  query('sort').optional().isString().trim(),
  query('order').optional().isIn(['asc', 'desc']).withMessage('order must be asc or desc'),
];

export function parsePaginationQuery(req: Request): PaginationQuery {
  return {
    page: req.query.page ? Number(req.query.page) : PAGINATION_DEFAULTS.PAGE,
    limit: req.query.limit ? Number(req.query.limit) : PAGINATION_DEFAULTS.LIMIT,
    sort: typeof req.query.sort === 'string' ? req.query.sort : undefined,
    order: req.query.order === 'asc' ? 'asc' : 'desc',
  };
}
