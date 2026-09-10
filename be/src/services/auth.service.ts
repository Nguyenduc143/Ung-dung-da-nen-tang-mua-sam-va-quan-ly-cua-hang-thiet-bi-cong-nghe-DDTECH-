import bcrypt from 'bcrypt';

import { withTransaction } from '../config/database';
import * as authRepository from '../repositories/auth.repository';
import type { AuthenticatedUser } from '../types/auth';
import { AppError } from '../utils/app-error';
import {
  hashRefreshToken,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../utils/token';
import type { LoginInput, RegisterInput } from '../validators/auth.validator';

interface ClientMetadata {
  userAgent: string | null;
  ipAddress: string | null;
}

const BCRYPT_ROUNDS = 12;

const toPublicUser = (user: authRepository.PublicUserRecord | authRepository.UserRecord) => ({
  id: user.id,
  fullName: user.full_name,
  email: user.email,
  phone: user.phone,
  avatarUrl: user.avatar_url,
  role: user.role,
  status: user.status,
  createdAt: user.created_at,
  updatedAt: user.updated_at,
});

const createTokenPair = (user: AuthenticatedUser) => {
  const accessToken = signAccessToken(user);
  const refresh = signRefreshToken(user);

  return {
    accessToken,
    refreshToken: refresh.token,
    refreshTokenHash: hashRefreshToken(refresh.token),
    refreshTokenExpiresAt: refresh.expiresAt,
  };
};

const isDuplicateEntryError = (error: unknown): boolean =>
  typeof error === 'object' && error !== null && 'code' in error && error.code === 'ER_DUP_ENTRY';

export const register = async (input: RegisterInput) => {
  const existing = await authRepository.findExistingIdentity(input.email, input.phone);

  if (existing?.email === input.email) {
    throw new AppError(409, 'Email đã được sử dụng');
  }

  if (existing?.phone === input.phone) {
    throw new AppError(409, 'Số điện thoại đã được sử dụng');
  }

  const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);

  try {
    const userId = await authRepository.createCustomer(
      input.fullName,
      input.email,
      input.phone,
      passwordHash,
    );
    const user = await authRepository.findActiveUserById(userId);

    if (!user) {
      throw new Error('Newly registered user could not be loaded');
    }

    return toPublicUser(user);
  } catch (error) {
    if (isDuplicateEntryError(error)) {
      throw new AppError(409, 'Email hoặc số điện thoại đã được sử dụng');
    }

    throw error;
  }
};

export const login = async (input: LoginInput, metadata: ClientMetadata) => {
  const user = await authRepository.findUserForLogin(input.email);

  if (!user || !(await bcrypt.compare(input.password, user.password_hash))) {
    throw new AppError(401, 'Email hoặc mật khẩu không chính xác');
  }

  if (user.status !== 'ACTIVE' || user.deleted_at !== null) {
    throw new AppError(403, 'Tài khoản đã bị khóa hoặc ngừng hoạt động');
  }

  const authUser: AuthenticatedUser = { id: user.id, role: user.role };
  const tokens = createTokenPair(authUser);

  await withTransaction(async (connection) => {
    await authRepository.updateLastLogin(user.id, connection);
    await authRepository.createRefreshToken(connection, {
      userId: user.id,
      tokenHash: tokens.refreshTokenHash,
      userAgent: metadata.userAgent,
      ipAddress: metadata.ipAddress,
      expiresAt: tokens.refreshTokenExpiresAt,
    });
  });

  return {
    user: toPublicUser(user),
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  };
};

export const refreshTokens = async (rawRefreshToken: string, metadata: ClientMetadata) => {
  const payload = verifyRefreshToken(rawRefreshToken);
  const userId = Number(payload.sub);
  const currentTokenHash = hashRefreshToken(rawRefreshToken);

  return withTransaction(async (connection) => {
    const storedToken = await authRepository.findUsableRefreshTokenForUpdate(
      connection,
      currentTokenHash,
    );

    if (!storedToken || storedToken.user_id !== userId) {
      throw new AppError(401, 'Refresh token không hợp lệ hoặc đã bị thu hồi');
    }

    await authRepository.revokeRefreshTokenById(connection, storedToken.id);

    const tokens = createTokenPair({ id: storedToken.user_id, role: storedToken.role });
    await authRepository.createRefreshToken(connection, {
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
  const revoked = await authRepository.revokeRefreshToken(
    Number(payload.sub),
    hashRefreshToken(rawRefreshToken),
  );

  if (!revoked) {
    throw new AppError(401, 'Refresh token không hợp lệ hoặc đã bị thu hồi');
  }
};

export const logoutAll = async (userId: number): Promise<number> =>
  authRepository.revokeAllRefreshTokens(userId);

export const getCurrentUser = async (userId: number) => {
  const user = await authRepository.findActiveUserById(userId);

  if (!user) {
    throw new AppError(401, 'Tài khoản không tồn tại hoặc đã bị khóa');
  }

  return toPublicUser(user);
};
