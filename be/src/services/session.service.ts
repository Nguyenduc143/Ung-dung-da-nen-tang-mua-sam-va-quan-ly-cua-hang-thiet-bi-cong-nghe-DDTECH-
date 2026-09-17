import { withTransaction } from '../config/database';
import * as sessionRepository from '../repositories/session.repository';
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

    await sessionRepository.revokeRefreshTokenById(connection, storedToken.id);

    const tokens = createTokenPair({ id: storedToken.user_id, role: storedToken.role });
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

export const logoutAll = async (userId: number): Promise<number> =>
  sessionRepository.revokeAllRefreshTokens(userId);
