import bcrypt from 'bcrypt';
import { withTransaction } from '../config/database';
import * as authRepository from '../repositories/auth.repository';
import * as sessionRepository from '../repositories/session.repository';
import type { AuthenticatedUser } from '../types/auth';
import { AppError } from '../utils/app-error';
import type { LoginInput,RegisterInput } from '../validators/auth.validator';
import { ClientMetadata,createTokenPair } from './auth.shared';

export const BCRYPT_ROUNDS = 12;

export const toPublicUser = (user: authRepository.PublicUserRecord | authRepository.UserRecord) => ({
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

export const isDuplicateEntryError = (error: unknown): boolean =>
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
    await sessionRepository.createRefreshToken(connection, {
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

export const getCurrentUser = async (userId: number) => {
  const user = await authRepository.findActiveUserById(userId);

  if (!user) {
    throw new AppError(401, 'Tài khoản không tồn tại hoặc đã bị khóa');
  }

  return toPublicUser(user);
};
