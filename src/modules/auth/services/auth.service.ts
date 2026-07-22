import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { userService } from '@modules/users/services/user.service';
import { userRepository } from '@modules/users/repositories/user.repository';
import { refreshTokenRepository } from '@modules/auth/repositories/refresh-token.repository';
import { jwtService } from '@modules/auth/services/jwt.service';
import { AuthenticationError, NotFoundError } from '@shared/errors';
import { env } from '@config/env';
import { IUser } from '@modules/users/models/user.model';
import { auditLogger } from '@utils/logger';

export interface AuthResult {
  user: IUser;
  accessToken: string;
  refreshToken: string;
}

export interface RequestMetadata {
  ipAddress?: string;
  userAgent?: string;
}

export class AuthService {
  async register(
    email: string,
    password: string,
    firstName: string | undefined,
    lastName: string | undefined,
    meta: RequestMetadata
  ): Promise<AuthResult> {
    const user = await userService.register({ email, password, firstName, lastName });
    const tokens = await this.issueTokenPair(user, meta);

    auditLogger.info('User registered', { userId: user._id.toString(), email: user.email });

    return { user, accessToken: tokens.accessToken, refreshToken: tokens.refreshToken };
  }

  async login(email: string, password: string, meta: RequestMetadata): Promise<AuthResult> {
    let user: IUser;
    try {
      user = await userService.getByEmail(email);
    } catch {
      throw new AuthenticationError('Invalid email or password');
    }

    if (!user.isActive) {
      throw new AuthenticationError('This account has been deactivated');
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new AuthenticationError('Invalid email or password');
    }

    await userRepository.markLoginNow(user._id.toString()).catch(() => undefined);
    const tokens = await this.issueTokenPair(user, meta);

    auditLogger.info('User logged in', { userId: user._id.toString(), email: user.email });

    return { user, accessToken: tokens.accessToken, refreshToken: tokens.refreshToken };
  }

  private async issueTokenPair(
    user: IUser,
    meta: RequestMetadata
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const accessToken = jwtService.signAccessToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    const tokenId = crypto.randomUUID();
    const refreshToken = jwtService.signRefreshToken({ userId: user._id.toString(), tokenId });
    const tokenHash = jwtService.hashToken(refreshToken);

    const expiresAt = new Date();
    expiresAt.setSeconds(
      expiresAt.getSeconds() + this.parseExpiryToSeconds(env.JWT_REFRESH_EXPIRY)
    );

    await refreshTokenRepository.create({
      userId: user._id,
      tokenHash,
      userAgent: meta.userAgent,
      ipAddress: meta.ipAddress,
      expiresAt,
    });

    return { accessToken, refreshToken };
  }

  private parseExpiryToSeconds(expiry: string): number {
    const match = /^(\d+)([smhd])$/.exec(expiry);
    if (!match) return 7 * 24 * 60 * 60; // default 7 days
    const value = Number(match[1]);
    const unit = match[2];
    const multipliers: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400 };
    return value * (multipliers[unit] ?? 86400);
  }

  /**
   * Rotates a refresh token: validates the presented token against the
   * stored hash, revokes it, and issues a fresh access/refresh pair.
   * Rotation prevents replay of a stolen refresh token after first use.
   */
  async refreshSession(refreshToken: string, meta: RequestMetadata): Promise<AuthResult> {
    const payload = jwtService.verifyRefreshToken(refreshToken);
    const tokenHash = jwtService.hashToken(refreshToken);

    const stored = await refreshTokenRepository.findByTokenHash(tokenHash);
    if (!stored) {
      throw new AuthenticationError('Refresh token has been revoked or does not exist');
    }

    if (stored.expiresAt < new Date()) {
      throw new AuthenticationError('Refresh token has expired');
    }

    const user = await userService.getById(payload.userId);
    if (!user.isActive) {
      throw new AuthenticationError('This account has been deactivated');
    }

    const tokens = await this.issueTokenPair(user, meta);
    await refreshTokenRepository.revoke(tokenHash, jwtService.hashToken(tokens.refreshToken));

    return { user, accessToken: tokens.accessToken, refreshToken: tokens.refreshToken };
  }

  async logout(refreshToken: string): Promise<void> {
    try {
      const tokenHash = jwtService.hashToken(refreshToken);
      await refreshTokenRepository.revoke(tokenHash);
    } catch {
      // logout should be idempotent and never fail loudly on an already-invalid token
    }
  }

  async logoutAllSessions(userId: string): Promise<void> {
    await refreshTokenRepository.revokeAllForUser(userId);
    auditLogger.info('All sessions revoked for user', { userId });
  }

  async getCurrentUser(userId: string): Promise<IUser> {
    const user = await userService.getById(userId);
    if (!user) throw new NotFoundError('User');
    return user;
  }
}

export const authService = new AuthService();
