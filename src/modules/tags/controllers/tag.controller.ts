import { Request, Response } from 'express';
import { tagService } from '@modules/tags/services/tag.service';
import { ApiResponse } from '@shared/responses/api-response';
import { asyncHandler } from '@utils/async-handler';
import { AuthenticationError } from '@shared/errors';
import { parsePaginationQuery } from '@validators/pagination.validator';
import { getParam } from '@utils/get-param';

export const createTag = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AuthenticationError();
  const tag = await tagService.create(req.user.userId, req.body.name);
  ApiResponse.created(res, tag, 'Tag created successfully');
});

export const listTags = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AuthenticationError();
  const { items, meta } = await tagService.list(req.user.userId, parsePaginationQuery(req));
  ApiResponse.paginated(res, items, meta, 'Tags fetched successfully');
});

export const deleteTag = asyncHandler(async (req: Request, res: Response) => {
  await tagService.delete(getParam(req, 'id'));
  ApiResponse.noContent(res, 'Tag deleted successfully');
});
