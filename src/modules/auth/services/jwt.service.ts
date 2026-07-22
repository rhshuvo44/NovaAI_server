import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '@config/env';
import { AuthenticationError } from '@shared/errors';
import { Role } from '@constants/index';

export interface AccessTokenPayload {
  userId: string;
  email: string;
  role: Role;
}

export interface RefreshTokenPayload {
  userId: string;
  tokenId: string;
}

export class JwtService {
  signAccessToken(payload: AccessTokenPayload): string {
    return jwt.sign({ ...payload }, env.JWT_ACCESS_SECRET, {
      expiresIn: env.JWT_ACCESS_EXPIRY,
      issuer: env.APP_NAME,
    } as jwt.SignOptions);
  }

  verifyAccessToken(token: string): AccessTokenPayload {
    try {
      return jwt.verify(token, env.JWT_ACCESS_SECRET, {
        issuer: env.APP_NAME,
      }) as AccessTokenPayload;
    } catch {
      throw new AuthenticationError('Invalid or expired access token');
    }
  }

  signRefreshToken(payload: RefreshTokenPayload): string {
    return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
      expiresIn: env.JWT_REFRESH_EXPIRY,
      issuer: env.APP_NAME,
    } as jwt.SignOptions);
  }

  verifyRefreshToken(token: string): RefreshTokenPayload {
    try {
      return jwt.verify(token, env.JWT_REFRESH_SECRET, {
        issuer: env.APP_NAME,
      }) as RefreshTokenPayload;
    } catch {
      throw new AuthenticationError('Invalid or expired refresh token');
    }
  }

  hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}

export const jwtService = new JwtService();
