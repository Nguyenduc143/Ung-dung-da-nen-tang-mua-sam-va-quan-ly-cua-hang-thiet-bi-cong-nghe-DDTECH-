import { z } from 'zod';

const phoneSchema = z
  .string()
  .trim()
  .regex(/^(?:\+84|0)\d{9}$/, 'Số điện thoại người nhận không hợp lệ');

const addressFields = {
  receiverName: z.string().trim().min(2).max(100),
  receiverPhone: phoneSchema,
  province: z.string().trim().min(2).max(100),
  district: z.string().trim().min(2).max(100),
  ward: z.string().trim().min(1).max(100).nullable().optional(),
  addressLine: z.string().trim().min(3).max(255),
  addressType: z.enum(['HOME', 'OFFICE', 'OTHER']),
};

export const createAddressSchema = z
  .object({
    ...addressFields,
    addressType: addressFields.addressType.default('HOME'),
    isDefault: z.boolean().default(false),
  })
  .strict();

export const updateAddressSchema = z
  .object({
    receiverName: addressFields.receiverName.optional(),
    receiverPhone: addressFields.receiverPhone.optional(),
    province: addressFields.province.optional(),
    district: addressFields.district.optional(),
    ward: addressFields.ward,
    addressLine: addressFields.addressLine.optional(),
    addressType: addressFields.addressType.optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, 'Cần cung cấp ít nhất một trường để cập nhật');

export const addressIdParamsSchema = z.object({
  id: z.string().regex(/^\d+$/, 'ID địa chỉ không hợp lệ'),
});

export type CreateAddressInput = z.infer<typeof createAddressSchema>;
export type UpdateAddressInput = z.infer<typeof updateAddressSchema>;
