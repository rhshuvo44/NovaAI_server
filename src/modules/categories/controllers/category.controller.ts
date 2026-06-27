import { Request, Response } from 'express';
import { categoryService } from '@modules/categories/services/category.service';
import { ApiResponse } from '@shared/responses/api-response';
import { asyncHandler } from '@utils/async-handler';
import { AuthenticationError } from '@shared/errors';
import { parsePaginationQuery } from '@validators/pagination.validator';
import { getParam } from '@utils/get-param';

export const createCategory = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AuthenticationError();
  const category = await categoryService.create(req.user.userId, req.body);
  ApiResponse.created(res, category, 'Category created successfully');
});

export const listCategories = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AuthenticationError();
  const { items, meta } = await categoryService.list(req.user.userId, parsePaginationQuery(req));
  ApiResponse.paginated(res, items, meta, 'Categories fetched successfully');
});

export const getCategory = asyncHandler(async (req: Request, res: Response) => {
  const category = await categoryService.getById(getParam(req, 'id'));
  ApiResponse.success(res, category, 'Category fetched successfully');
});

export const updateCategory = asyncHandler(async (req: Request, res: Response) => {
  const category = await categoryService.update(getParam(req, 'id'), req.body);
  ApiResponse.success(res, category, 'Category updated successfully');
});

export const deleteCategory = asyncHandler(async (req: Request, res: Response) => {
  await categoryService.delete(getParam(req, 'id'));
  ApiResponse.noContent(res, 'Category deleted successfully');
});
