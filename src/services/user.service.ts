import bcrypt from 'bcrypt';

import { withTransaction } from '../config/database';
import * as userRepository from '../repositories/user.repository';
import { AppError } from '../utils/app-error';
import type {
  AdminUserQuery,
  ChangePasswordInput,
  UpdateProfileInput,
  UpdateUserStatusInput,
} from '../validators/user.validator';

const BCRYPT_ROUNDS = 12;

const toUserResponse = (user: userRepository.UserProfileRecord) => ({
  id: user.id,
  fullName: user.full_name,
  email: user.email,
  phone: user.phone,
  avatarUrl: user.avatar_url,
  gender: user.gender,
  dateOfBirth: user.date_of_birth,
  role: user.role,
  status: user.status,
  lastLoginAt: user.last_login_at,
  createdAt: user.created_at,
  updatedAt: user.updated_at,
});

export const getProfile = async (userId: number) => {
  const user = await userRepository.findProfileById(userId);
  if (!user) throw new AppError(404, 'Không tìm thấy người dùng');
  return toUserResponse(user);
};

export const updateProfile = async (userId: number, input: UpdateProfileInput) => {
  if (input.phone && (await userRepository.phoneBelongsToAnotherUser(input.phone, userId))) {
    throw new AppError(409, 'Số điện thoại đã được sử dụng');
  }

  try {
    await userRepository.updateProfile(userId, input);
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'ER_DUP_ENTRY') {
      throw new AppError(409, 'Số điện thoại đã được sử dụng');
    }
    throw error;
  }
  return getProfile(userId);
};

export const changePassword = async (userId: number, input: ChangePasswordInput): Promise<void> => {
  const current = await userRepository.findPasswordById(userId);
  if (!current || !(await bcrypt.compare(input.currentPassword, current.password_hash))) {
    throw new AppError(400, 'Mật khẩu hiện tại không chính xác');
  }
  const hash = await bcrypt.hash(input.newPassword, BCRYPT_ROUNDS);
  await withTransaction(async (connection) => {
    await userRepository.updatePassword(connection, userId, hash);
    await userRepository.revokeUserTokens(connection, userId);
  });
};

export const listUsers = async (query: AdminUserQuery) => {
  const result = await userRepository.listUsers(query);
  return {
    users: result.users.map(toUserResponse),
    pagination: {
      page: query.page,
      limit: query.limit,
      total: result.total,
      totalPages: Math.ceil(result.total / query.limit),
    },
  };
};

export const getUserById = getProfile;

export const updateStatus = async (
  adminId: number,
  userId: number,
  input: UpdateUserStatusInput,
) => {
  if (adminId === userId && input.status === 'LOCKED') {
    throw new AppError(400, 'Bạn không thể tự khóa tài khoản của mình');
  }

  await withTransaction(async (connection) => {
    const updated = await userRepository.updateUserStatus(connection, userId, input.status);
    if (!updated) throw new AppError(404, 'Không tìm thấy người dùng');
    if (input.status === 'LOCKED') await userRepository.revokeUserTokens(connection, userId);
  });
  return getProfile(userId);
};
