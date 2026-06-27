import { Request, Response } from 'express';
import { documentService } from '@modules/documents/services/document.service';
import { ApiResponse } from '@shared/responses/api-response';
import { asyncHandler } from '@utils/async-handler';
import { AuthenticationError } from '@shared/errors';
import { parsePaginationQuery } from '@validators/pagination.validator';
import { getParam } from '@utils/get-param';

export const createDocument = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AuthenticationError();
  const doc = await documentService.create(req.user.userId, req.body);
  ApiResponse.created(res, doc, 'Document created successfully');
});

export const listDocuments = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AuthenticationError();
  const { items, meta } = await documentService.list(req.user.userId, parsePaginationQuery(req));
  ApiResponse.paginated(res, items, meta, 'Documents fetched successfully');
});

export const searchDocuments = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AuthenticationError();
  const results = await documentService.search(req.user.userId, { q: req.query.q as string });
  ApiResponse.success(res, results, 'Search completed successfully');
});

export const getDocument = asyncHandler(async (req: Request, res: Response) => {
  const doc = await documentService.getById(getParam(req, 'id'), req.user?.userId);
  ApiResponse.success(res, doc, 'Document fetched successfully');
});

export const updateDocument = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AuthenticationError();
  const doc = await documentService.update(getParam(req, 'id'), req.user.userId, req.body);
  ApiResponse.success(res, doc, 'Document updated successfully');
});

export const archiveDocument = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AuthenticationError();
  const doc = await documentService.archive(getParam(req, 'id'), req.user.userId);
  ApiResponse.success(res, doc, 'Document archived successfully');
});

export const deleteDocument = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AuthenticationError();
  await documentService.delete(getParam(req, 'id'), req.user.userId);
  ApiResponse.noContent(res, 'Document deleted successfully');
});

export const bulkDeleteDocuments = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AuthenticationError();
  const count = await documentService.bulkDelete(req.body.ids, req.user.userId);
  ApiResponse.success(res, { deletedCount: count }, 'Documents deleted successfully');
});
