import { Request, Response } from 'express';
import { roleService } from '@modules/roles/services/role.service';
import { ApiResponse } from '@shared/responses/api-response';
import { asyncHandler } from '@utils/async-handler';
import { parsePaginationQuery } from '@validators/pagination.validator';
import { getParam } from '@utils/get-param';

export const createRole = asyncHandler(async (req: Request, res: Response) => {
  const role = await roleService.createRole(req.body);
  ApiResponse.created(res, role, 'Role created successfully');
});

export const listRoles = asyncHandler(async (req: Request, res: Response) => {
  const { items, meta } = await roleService.listRoles(parsePaginationQuery(req));
  ApiResponse.paginated(res, items, meta, 'Roles fetched successfully');
});

export const getRole = asyncHandler(async (req: Request, res: Response) => {
  const role = await roleService.getRole(getParam(req, 'id'));
  ApiResponse.success(res, role, 'Role fetched successfully');
});

export const updatePermissions = asyncHandler(async (req: Request, res: Response) => {
  const role = await roleService.updatePermissions(getParam(req, 'id'), req.body.permissions);
  ApiResponse.success(res, role, 'Role permissions updated successfully');
});

export const deleteRole = asyncHandler(async (req: Request, res: Response) => {
  await roleService.deleteRole(getParam(req, 'id'));
  ApiResponse.noContent(res, 'Role deleted successfully');
});
