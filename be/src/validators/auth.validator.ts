import { z } from 'zod';

const emailSchema = z.string().trim().email('Email không hợp lệ').max(191).toLowerCase();
const phoneSchema = z
  .string()
  .trim()
  .regex(/^(?:\+84|0)\d{9}$/, 'Số điện thoại không hợp lệ');
const passwordSchema = z
  .string()
  .min(8, 'Mật khẩu phải có ít nhất 8 ký tự')
  .max(72, 'Mật khẩu không được vượt quá 72 ký tự');

export const registerSchema = z
  .object({
    fullName: z.string().trim().min(2).max(100),
    email: emailSchema,
    phone: phoneSchema,
    password: passwordSchema,
  })
  .strict();

export const loginSchema = z
  .object({
    email: emailSchema,
    password: z.string().min(1, 'Mật khẩu là bắt buộc').max(72),
  })
  .strict();

export const refreshTokenSchema = z
  .object({
    refreshToken: z.string().min(1, 'Refresh token là bắt buộc').max(4096),
  })
  .strict();

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
