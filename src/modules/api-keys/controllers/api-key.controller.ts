import { Request, Response } from 'express';
import { apiKeyService } from '@modules/api-keys/services/api-key.service';
import { ApiResponse } from '@shared/responses/api-response';
import { asyncHandler } from '@utils/async-handler';
import { AuthenticationError } from '@shared/errors';
import { parsePaginationQuery } from '@validators/pagination.validator';
import { getParam } from '@utils/get-param';

export const createApiKey = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AuthenticationError();
  const { name, scopes, expiresAt } = req.body as {
    name: string;
    scopes: string[];
    expiresAt?: string;
  };
  const result = await apiKeyService.create(
    req.user.userId,
    name,
    scopes,
    expiresAt ? new Date(expiresAt) : undefined
  );

  // rawKey is only ever returned here - it cannot be retrieved again later
  ApiResponse.created(
    res,
    { apiKey: result.apiKey, rawKey: result.rawKey },
    'API key created successfully'
  );
});

export const listApiKeys = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AuthenticationError();
  const { items, meta } = await apiKeyService.list(req.user.userId, parsePaginationQuery(req));
  ApiResponse.paginated(res, items, meta, 'API keys fetched successfully');
});

export const revokeApiKey = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AuthenticationError();
  await apiKeyService.revoke(getParam(req, 'id'), req.user.userId);
  ApiResponse.success(res, null, 'API key revoked successfully');
});
