import { withTransaction } from '../config/database';
import * as sessionRepository from '../repositories/session.repository';
import { emitToUser } from '../socket';
import { AppError } from '../utils/app-error';
import {
hashRefreshToken,
verifyRefreshToken
} from '../utils/token';
import { ClientMetadata,createTokenPair } from './auth.shared';

export const refreshTokens = async (rawRefreshToken: string, metadata: ClientMetadata) => {
  const payload = verifyRefreshToken(rawRefreshToken);
  const userId = Number(payload.sub);
  const currentTokenHash = hashRefreshToken(rawRefreshToken);

  return withTransaction(async (connection) => {
    const storedToken = await sessionRepository.findUsableRefreshTokenForUpdate(
      connection,
      currentTokenHash,
    );

    if (!storedToken || storedToken.user_id !== userId) {
      throw new AppError(401, 'Refresh token không hợp lệ hoặc đã bị thu hồi');
    }

    if (payload.ver !== storedToken.auth_version) {
      throw new AppError(401, 'Phiên đăng nhập đã bị thu hồi');
    }

    await sessionRepository.revokeRefreshTokenById(connection, storedToken.id);

    const tokens = createTokenPair({
      id: storedToken.user_id,
      role: storedToken.role,
      authVersion: storedToken.auth_version,
    });
    await sessionRepository.createRefreshToken(connection, {
      userId: storedToken.user_id,
      tokenHash: tokens.refreshTokenHash,
      userAgent: metadata.userAgent,
      ipAddress: metadata.ipAddress,
      expiresAt: tokens.refreshTokenExpiresAt,
    });

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  });
};

export const logout = async (rawRefreshToken: string): Promise<void> => {
  const payload = verifyRefreshToken(rawRefreshToken);
  const revoked = await sessionRepository.revokeRefreshToken(
    Number(payload.sub),
    hashRefreshToken(rawRefreshToken),
  );

  if (!revoked) {
    throw new AppError(401, 'Refresh token không hợp lệ hoặc đã bị thu hồi');
  }
};

export const logoutAll = async (userId: number): Promise<number> => {
  const revokedCount = await withTransaction((connection) => (
    sessionRepository.revokeAllRefreshTokens(connection, userId)
  ));

  emitToUser(userId, 'auth:session_revoked', { reason: 'logout_all' });
  return revokedCount;
};
