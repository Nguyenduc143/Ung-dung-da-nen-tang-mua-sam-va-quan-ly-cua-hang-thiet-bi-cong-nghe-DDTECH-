import { z } from 'zod';

const phoneSchema = z
  .string()
  .trim()
  .regex(/^(?:\+84|0)\d{9}$/, 'Số điện thoại không hợp lệ');

const dateOfBirthSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày sinh phải có định dạng YYYY-MM-DD')
  .refine((value) => {
    const date = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
  }, 'Ngày sinh không hợp lệ')
  .refine((value) => new Date(`${value}T00:00:00Z`) <= new Date(), 'Ngày sinh không thể ở tương lai');

export const updateProfileSchema = z
  .object({
    fullName: z.string().trim().min(2).max(100).optional(),
    phone: phoneSchema.nullable().optional(),
    avatarUrl: z.string().trim().url('URL ảnh đại diện không hợp lệ').max(500).nullable().optional(),
    gender: z.enum(['MALE', 'FEMALE', 'OTHER']).nullable().optional(),
    dateOfBirth: dateOfBirthSchema.nullable().optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, 'Cần cung cấp ít nhất một trường để cập nhật');

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Mật khẩu hiện tại là bắt buộc').max(72),
    newPassword: z.string().min(8, 'Mật khẩu mới phải có ít nhất 8 ký tự').max(72),
  })
  .strict()
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'Mật khẩu mới phải khác mật khẩu hiện tại',
    path: ['newPassword'],
  });

export const updateUserStatusSchema = z
  .object({
    status: z.enum(['ACTIVE', 'LOCKED']),
  })
  .strict();

export const userIdParamsSchema = z.object({
  id: z.string().regex(/^\d+$/, 'ID người dùng không hợp lệ'),
});

export const adminUserQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().trim().max(100).optional(),
  role: z.enum(['CUSTOMER', 'ADMIN']).optional(),
  status: z.enum(['ACTIVE', 'LOCKED']).optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type UpdateUserStatusInput = z.infer<typeof updateUserStatusSchema>;
export type AdminUserQuery = z.infer<typeof adminUserQuerySchema>;
