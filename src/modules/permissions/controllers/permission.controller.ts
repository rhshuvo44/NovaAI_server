import { Request, Response } from 'express';
import { permissionService } from '@modules/permissions/services/permission.service';
import { ApiResponse } from '@shared/responses/api-response';
import { asyncHandler } from '@utils/async-handler';
import { parsePaginationQuery } from '@validators/pagination.validator';

export const listPermissions = asyncHandler(async (req: Request, res: Response) => {
  const { items, meta } = await permissionService.listPermissions(parsePaginationQuery(req));
  ApiResponse.paginated(res, items, meta, 'Permissions fetched successfully');
});
