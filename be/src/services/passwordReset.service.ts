import bcrypt from 'bcrypt';
import { createHmac, randomInt, timingSafeEqual } from 'node:crypto';
import { env } from '../config/env';
import { withTransaction } from '../config/database';
import * as passwordResetRepository from '../repositories/passwordReset.repository';
import * as userRepository from '../repositories/user.repository';
import { AppError } from '../utils/app-error';
import type { ForgotPasswordInput, ResetPasswordInput } from '../validators/auth.validator';
import { BCRYPT_ROUNDS } from './auth.service';
import { sendPasswordResetCode } from './email.service';

const MAX_ATTEMPTS = 5;

const hashCode = (userId: number, code: string): string => createHmac(
  'sha256',
  env.JWT_ACCESS_SECRET,
).update(`password-reset:${userId}:${code}`).digest('hex');

const hashesMatch = (left: string, right: string): boolean => {
  const leftBuffer = Buffer.from(left, 'hex');
  const rightBuffer = Buffer.from(right, 'hex');
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
};

export const requestPasswordReset = async (input: ForgotPasswordInput) => {
  const user = await passwordResetRepository.findUserByEmail(input.email);
  if (!user || user.status !== 'ACTIVE' || user.deleted_at !== null) {
    return {};
  }

  const code = randomInt(0, 1_000_000).toString().padStart(6, '0');
  const expiresAt = new Date(Date.now() + env.PASSWORD_RESET_EXPIRES_MINUTES * 60_000);

  await withTransaction(async (connection) => {
    await passwordResetRepository.invalidateCodes(connection, user.id);
    await passwordResetRepository.createCode(connection, user.id, hashCode(user.id, code), expiresAt);
  });

  try {
    await sendPasswordResetCode({ email: user.email, fullName: user.full_name }, code);
  } catch (error) {
    console.error('Không thể gửi email đặt lại mật khẩu:', error);
    if (env.NODE_ENV !== 'test') {
      throw new AppError(503, 'Chưa thể gửi email đặt lại mật khẩu. Vui lòng thử lại sau');
    }
  }

  // Chỉ cung cấp mã cho kiểm thử tích hợp, không trả mã cho ứng dụng.
  return env.NODE_ENV === 'test' ? { developmentCode: code } : {};
};

export const resetPassword = async (input: ResetPasswordInput): Promise<void> => {
  const user = await passwordResetRepository.findUserByEmail(input.email);
  if (!user || user.status !== 'ACTIVE' || user.deleted_at !== null) {
    throw new AppError(400, 'Mã xác nhận không hợp lệ hoặc đã hết hạn');
  }

  const passwordHash = await bcrypt.hash(input.newPassword, BCRYPT_ROUNDS);
  const submittedHash = hashCode(user.id, input.code);

  const result = await withTransaction(async (connection) => {
    const resetCode = await passwordResetRepository.findLatestForUpdate(connection, user.id);
    if (
      !resetCode
      || resetCode.used_at !== null
      || resetCode.attempts >= MAX_ATTEMPTS
      || new Date(resetCode.expires_at).getTime() <= Date.now()
    ) {
      return 'invalid' as const;
    }

    if (!hashesMatch(resetCode.code_hash, submittedHash)) {
      await passwordResetRepository.incrementAttempts(connection, resetCode.id);
      if (resetCode.attempts + 1 >= MAX_ATTEMPTS) {
        await passwordResetRepository.markUsed(connection, resetCode.id);
      }
      return 'invalid' as const;
    }

    await userRepository.updatePassword(connection, user.id, passwordHash);
    await userRepository.revokeUserTokens(connection, user.id);
    await passwordResetRepository.markUsed(connection, resetCode.id);
    return 'success' as const;
  });

  if (result === 'invalid') {
    throw new AppError(400, 'Mã xác nhận không hợp lệ hoặc đã hết hạn');
  }
};
