import { Request, Response, NextFunction } from 'express';
import { apiKeyService } from '@modules/api-keys/services/api-key.service';
import { userService } from '@modules/users/services/user.service';
import { AuthenticationError } from '@shared/errors';
import { HTTP_HEADERS } from '@constants/index';
import { AuthenticatedUser } from '@types-internal/index';

export async function requireApiKey(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const rawKey = req.headers[HTTP_HEADERS.API_KEY] as string | undefined;
    if (!rawKey) {
      throw new AuthenticationError('Missing API key');
    }

    const apiKey = await apiKeyService.verify(rawKey);
    const owner = await userService.getById(apiKey.ownerId.toString());

    const permissions = await userService.getPermissionsForUser(owner._id.toString(), owner.role);

    const authenticatedUser: AuthenticatedUser = {
      userId: owner._id.toString(),
      email: owner.email,
      role: owner.role,
      permissions,
    };

    req.user = authenticatedUser;
    next();
  } catch (error) {
    next(error);
  }
}
