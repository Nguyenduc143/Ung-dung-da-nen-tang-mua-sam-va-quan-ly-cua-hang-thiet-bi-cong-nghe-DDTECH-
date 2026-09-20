import { withTransaction } from '../config/database';
import * as adminUserRepository from '../repositories/admin-user.repository';
import * as userRepository from '../repositories/user.repository';
import { AppError } from '../utils/app-error';
import type {
AdminUserQuery,
UpdateUserStatusInput
} from '../validators/user.validator';
import { getProfile } from './user.service';
import { toUserResponse } from './user.shared';

export const listUsers = async (query: AdminUserQuery) => {
  const result = await adminUserRepository.listUsers(query);
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
    const updated = await adminUserRepository.updateUserStatus(connection, userId, input.status);
    if (!updated) throw new AppError(404, 'Không tìm thấy người dùng');
    if (input.status === 'LOCKED') await userRepository.revokeUserTokens(connection, userId);
  });
  return getProfile(userId);
};
