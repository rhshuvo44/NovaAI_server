import { jwtService } from '@modules/auth/services/jwt.service';
import { AuthenticationError } from '@shared/errors';
import { Role } from '@constants/index';

describe('JwtService', () => {
  const payload = {
    userId: '507f1f77bcf86cd799439011',
    clerkId: 'clerk_123',
    email: 'test@example.com',
    role: Role.USER,
  };

  it('signs and verifies a valid access token', () => {
    const token = jwtService.signAccessToken(payload);
    const decoded = jwtService.verifyAccessToken(token);

    expect(decoded.userId).toBe(payload.userId);
    expect(decoded.email).toBe(payload.email);
    expect(decoded.role).toBe(payload.role);
  });

  it('throws AuthenticationError for a malformed access token', () => {
    expect(() => jwtService.verifyAccessToken('not-a-real-token')).toThrow(AuthenticationError);
  });

  it('throws AuthenticationError for an access token signed with a different secret', () => {
    const jwt = require('jsonwebtoken');
    const wrongToken = jwt.sign(payload, 'a-completely-different-secret');
    expect(() => jwtService.verifyAccessToken(wrongToken)).toThrow(AuthenticationError);
  });

  it('signs and verifies a valid refresh token', () => {
    const refreshPayload = { userId: payload.userId, tokenId: 'token-id-123' };
    const token = jwtService.signRefreshToken(refreshPayload);
    const decoded = jwtService.verifyRefreshToken(token);

    expect(decoded.userId).toBe(refreshPayload.userId);
    expect(decoded.tokenId).toBe(refreshPayload.tokenId);
  });

  it('produces a consistent SHA-256 hash for the same token', () => {
    const hash1 = jwtService.hashToken('some-refresh-token-value');
    const hash2 = jwtService.hashToken('some-refresh-token-value');
    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64); // hex-encoded SHA-256
  });

  it('produces different hashes for different tokens', () => {
    const hash1 = jwtService.hashToken('token-a');
    const hash2 = jwtService.hashToken('token-b');
    expect(hash1).not.toBe(hash2);
  });
});
