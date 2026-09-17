import bcrypt from 'bcrypt';
import { withTransaction } from '../config/database';
import * as userRepository from '../repositories/user.repository';
import { AppError } from '../utils/app-error';
import type {
ChangePasswordInput,
UpdateProfileInput
} from '../validators/user.validator';
import { toUserResponse } from './user.shared';

export const BCRYPT_ROUNDS = 12;

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
