import { createHash, randomUUID } from 'node:crypto';
import jwt, { type JwtPayload, type SignOptions } from 'jsonwebtoken';

import { env } from '../config/env';
import type { AuthenticatedUser, UserRole } from '../types/auth';
import { AppError } from './app-error';

interface AuthTokenPayload extends JwtPayload {
  sub: string;
  role: UserRole;
}

interface RefreshTokenResult {
  token: string;
  expiresAt: Date;
}

const isUserRole = (value: unknown): value is UserRole =>
  value === 'CUSTOMER' || value === 'ADMIN';

const signToken = (
  user: AuthenticatedUser,
  secret: string,
  expiresIn: SignOptions['expiresIn'],
): string =>
  jwt.sign(
    {
      sub: String(user.id),
      role: user.role,
    },
    secret,
    { expiresIn, keyid: randomUUID() },
  );

const verifyToken = (token: string, secret: string): AuthTokenPayload => {
  try {
    const payload = jwt.verify(token, secret);

    if (
      typeof payload === 'string' ||
      typeof payload.sub !== 'string' ||
      !/^\d+$/.test(payload.sub) ||
      !isUserRole(payload.role)
    ) {
      throw new AppError(401, 'Token không hợp lệ');
    }

    return payload as AuthTokenPayload;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(401, 'Token không hợp lệ hoặc đã hết hạn');
  }
};

export const signAccessToken = (user: AuthenticatedUser): string =>
  signToken(user, env.JWT_ACCESS_SECRET, env.JWT_ACCESS_EXPIRES_IN as SignOptions['expiresIn']);

export const signRefreshToken = (user: AuthenticatedUser): RefreshTokenResult => {
  const token = signToken(
    user,
    env.JWT_REFRESH_SECRET,
    env.JWT_REFRESH_EXPIRES_IN as SignOptions['expiresIn'],
  );
  const payload = jwt.decode(token);

  if (typeof payload === 'string' || payload?.exp === undefined) {
    throw new Error('Refresh token expiration could not be determined');
  }

  return {
    token,
    expiresAt: new Date(payload.exp * 1000),
  };
};

export const verifyAccessToken = (token: string): AuthTokenPayload =>
  verifyToken(token, env.JWT_ACCESS_SECRET);

export const verifyRefreshToken = (token: string): AuthTokenPayload =>
  verifyToken(token, env.JWT_REFRESH_SECRET);

export const hashRefreshToken = (token: string): string =>
  createHash('sha256').update(token).digest('hex');
