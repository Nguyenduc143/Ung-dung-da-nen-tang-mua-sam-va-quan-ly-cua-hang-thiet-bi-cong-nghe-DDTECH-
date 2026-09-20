import type { AuthenticatedUser } from '../types/auth';
import {
hashRefreshToken,
signAccessToken,
signRefreshToken
} from '../utils/token';

export interface ClientMetadata {
  userAgent: string | null;
  ipAddress: string | null;
}

export const createTokenPair = (user: AuthenticatedUser) => {
  const accessToken = signAccessToken(user);
  const refresh = signRefreshToken(user);

  return {
    accessToken,
    refreshToken: refresh.token,
    refreshTokenHash: hashRefreshToken(refresh.token),
    refreshTokenExpiresAt: refresh.expiresAt,
  };
};
