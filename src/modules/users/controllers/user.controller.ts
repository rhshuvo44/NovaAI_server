import { Request, Response } from 'express';
import { userService } from '@modules/users/services/user.service';
import { ApiResponse } from '@shared/responses/api-response';
import { asyncHandler } from '@utils/async-handler';
import { parsePaginationQuery } from '@validators/pagination.validator';
import { AuthenticationError } from '@shared/errors';
import { getParam } from '@utils/get-param';

export const listUsers = asyncHandler(async (req: Request, res: Response) => {
  const { items, meta } = await userService.listUsers(parsePaginationQuery(req));
  ApiResponse.paginated(res, items, meta, 'Users fetched successfully');
});

export const getUserById = asyncHandler(async (req: Request, res: Response) => {
  const user = await userService.getById(getParam(req, 'id'));
  ApiResponse.success(res, user, 'User fetched successfully');
});

export const updateOwnProfile = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AuthenticationError();
  const user = await userService.updateProfile(req.user.userId, req.body);
  ApiResponse.success(res, user, 'Profile updated successfully');
});

export const changeUserRole = asyncHandler(async (req: Request, res: Response) => {
  const user = await userService.changeRole(getParam(req, 'id'), req.body.role);
  ApiResponse.success(res, user, 'User role updated successfully');
});

export const deactivateUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await userService.deactivate(getParam(req, 'id'));
  ApiResponse.success(res, user, 'User deactivated successfully');
});

export const activateUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await userService.activate(getParam(req, 'id'));
  ApiResponse.success(res, user, 'User activated successfully');
});

export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  await userService.deleteUser(getParam(req, 'id'));
  ApiResponse.noContent(res, 'User deleted successfully');
});
