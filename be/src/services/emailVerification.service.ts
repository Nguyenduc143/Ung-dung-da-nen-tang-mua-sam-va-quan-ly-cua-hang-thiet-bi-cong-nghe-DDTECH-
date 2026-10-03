import { createHmac, randomInt, timingSafeEqual } from 'node:crypto';
import { env } from '../config/env';
import { withTransaction } from '../config/database';
import * as verificationRepository from '../repositories/emailVerification.repository';
import { AppError } from '../utils/app-error';
import type { RegistrationEmailInput, VerifyRegistrationInput } from '../validators/auth.validator';
import { sendRegistrationVerificationCode } from './email.service';

const MAX_ATTEMPTS = 5;

const hashCode = (userId: number, code: string): string => createHmac(
  'sha256',
  env.JWT_ACCESS_SECRET,
).update(`email-verification:${userId}:${code}`).digest('hex');

const hashesMatch = (left: string, right: string): boolean => {
  const leftBuffer = Buffer.from(left, 'hex');
  const rightBuffer = Buffer.from(right, 'hex');
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
};

export const sendVerificationCode = async (input: RegistrationEmailInput) => {
  const user = await verificationRepository.findUserByEmail(input.email);
  if (!user || user.deleted_at !== null || user.status !== 'ACTIVE' || user.email_verified_at !== null) {
    return { developmentCode: undefined };
  }

  const code = randomInt(0, 1_000_000).toString().padStart(6, '0');
  const expiresAt = new Date(Date.now() + env.EMAIL_VERIFICATION_EXPIRES_MINUTES * 60_000);
  await withTransaction(async (connection) => {
    await verificationRepository.invalidateCodes(connection, user.id);
    await verificationRepository.createCode(connection, user.id, hashCode(user.id, code), expiresAt);
  });

  try {
    await sendRegistrationVerificationCode({ email: user.email, fullName: user.full_name }, code);
  } catch (error) {
    console.error('Không thể gửi email xác nhận đăng ký:', error);
    if (env.NODE_ENV !== 'test') {
      throw new AppError(503, 'Chưa thể gửi email xác nhận. Vui lòng thử lại sau');
    }
  }

  // Chỉ cung cấp mã cho kiểm thử tích hợp, không trả mã cho ứng dụng.
  return env.NODE_ENV === 'test' ? { developmentCode: code } : {};
};

export const verifyRegistration = async (input: VerifyRegistrationInput): Promise<void> => {
  const user = await verificationRepository.findUserByEmail(input.email);
  if (!user || user.deleted_at !== null || user.status !== 'ACTIVE') {
    throw new AppError(400, 'Mã xác nhận không hợp lệ hoặc đã hết hạn');
  }
  if (user.email_verified_at !== null) return;

  const submittedHash = hashCode(user.id, input.code);
  const result = await withTransaction(async (connection) => {
    const verificationCode = await verificationRepository.findLatestForUpdate(connection, user.id);
    if (
      !verificationCode
      || verificationCode.used_at !== null
      || verificationCode.attempts >= MAX_ATTEMPTS
      || new Date(verificationCode.expires_at).getTime() <= Date.now()
    ) return 'invalid' as const;

    if (!hashesMatch(verificationCode.code_hash, submittedHash)) {
      await verificationRepository.incrementAttempts(connection, verificationCode.id);
      if (verificationCode.attempts + 1 >= MAX_ATTEMPTS) {
        await verificationRepository.markUsed(connection, verificationCode.id);
      }
      return 'invalid' as const;
    }

    await verificationRepository.verifyUser(connection, user.id);
    await verificationRepository.markUsed(connection, verificationCode.id);
    return 'success' as const;
  });

  if (result === 'invalid') {
    throw new AppError(400, 'Mã xác nhận không hợp lệ hoặc đã hết hạn');
  }
};
