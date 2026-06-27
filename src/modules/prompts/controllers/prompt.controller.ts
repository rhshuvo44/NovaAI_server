import { Request, Response } from 'express';
import { promptService } from '@modules/prompts/services/prompt.service';
import { ApiResponse } from '@shared/responses/api-response';
import { asyncHandler } from '@utils/async-handler';
import { AuthenticationError } from '@shared/errors';
import { parsePaginationQuery } from '@validators/pagination.validator';
import { getParam } from '@utils/get-param';

export const createPrompt = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AuthenticationError();
  const prompt = await promptService.create(req.user.userId, req.body);
  ApiResponse.created(res, prompt, 'Prompt created successfully');
});

export const listPrompts = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AuthenticationError();
  const { items, meta } = await promptService.list(req.user.userId, parsePaginationQuery(req));
  ApiResponse.paginated(res, items, meta, 'Prompts fetched successfully');
});

export const getPrompt = asyncHandler(async (req: Request, res: Response) => {
  const prompt = await promptService.getById(getParam(req, 'id'));
  ApiResponse.success(res, prompt, 'Prompt fetched successfully');
});

export const updatePrompt = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AuthenticationError();
  const prompt = await promptService.update(getParam(req, 'id'), req.user.userId, req.body);
  ApiResponse.success(res, prompt, 'Prompt updated successfully');
});

export const toggleFavoritePrompt = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AuthenticationError();
  const prompt = await promptService.toggleFavorite(getParam(req, 'id'), req.user.userId);
  ApiResponse.success(res, prompt, 'Prompt favorite status updated');
});

export const optimizePrompt = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AuthenticationError();
  const prompt = await promptService.optimizeAndSave(getParam(req, 'id'), req.user.userId);
  ApiResponse.success(res, prompt, 'Prompt optimized successfully');
});

export const deletePrompt = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AuthenticationError();
  await promptService.delete(getParam(req, 'id'), req.user.userId);
  ApiResponse.noContent(res, 'Prompt deleted successfully');
});
