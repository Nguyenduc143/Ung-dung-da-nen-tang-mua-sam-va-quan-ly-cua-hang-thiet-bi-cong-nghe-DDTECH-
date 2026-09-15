import { z } from 'zod';

export const orderIdSchema = z.coerce.number().int().positive().max(Number.MAX_SAFE_INTEGER);

const receiverPhoneSchema = z
  .string()
  .trim()
  .regex(/^(?:\+84|0)\d{9}$/, 'Số điện thoại người nhận không hợp lệ');

export const checkoutSchema = z
  .object({
    addressId: orderIdSchema.optional(),
    receiverName: z.string().trim().min(2).max(100).optional(),
    receiverPhone: receiverPhoneSchema.optional(),
    province: z.string().trim().min(2).max(100).optional(),
    district: z.string().trim().min(2).max(100).optional(),
    ward: z.string().trim().min(1).max(100).nullable().optional(),
    addressLine: z.string().trim().min(3).max(255).optional(),
    shippingMethodId: orderIdSchema,
    promotionCode: z.string().trim().min(1).max(50).toUpperCase().nullable().optional(),
    note: z.string().trim().max(500).nullable().optional(),
    paymentMethod: z.enum(['COD', 'VNPAY', 'MOMO', 'ZALOPAY']).default('COD'),
  })
  .strict()
  .superRefine((data, context) => {
    const receiverFields = [
      data.receiverName,
      data.receiverPhone,
      data.province,
      data.district,
      data.addressLine,
    ];
    const hasReceiverFields = receiverFields.some((value) => value !== undefined)
      || data.ward !== undefined;

    if (data.addressId !== undefined && hasReceiverFields) {
      context.addIssue({
        code: 'custom',
        message: 'Chỉ sử dụng addressId hoặc thông tin nhận hàng trực tiếp',
        path: ['addressId'],
      });
      return;
    }
    if (data.addressId === undefined) {
      const missingFields = [
        ['receiverName', data.receiverName],
        ['receiverPhone', data.receiverPhone],
        ['province', data.province],
        ['district', data.district],
        ['addressLine', data.addressLine],
      ] as const;
      for (const [field, value] of missingFields) {
        if (value === undefined) {
          context.addIssue({
            code: 'custom',
            message: 'Trường này là bắt buộc khi không sử dụng addressId',
            path: [field],
          });
        }
      }
    }
  });

export const cancelOrderSchema = z
  .object({
    reason: z.string().trim().min(3).max(255),
  })
  .strict();

export const updateOrderStatusSchema = z
  .object({
    status: z.enum(['CONFIRMED', 'PROCESSING', 'SHIPPING', 'DELIVERED', 'CANCELLED']),
    note: z.string().trim().max(255).nullable().optional(),
  })
  .strict();

const orderStatusSchema = z.enum([
  'PENDING',
  'CONFIRMED',
  'PROCESSING',
  'SHIPPING',
  'DELIVERED',
  'CANCELLED',
]);

export const customerOrderQuerySchema = z
  .object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    status: orderStatusSchema.optional(),
  })
  .strict();

export const adminOrderQuerySchema = z
  .object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    search: z.string().trim().max(100).optional(),
    status: orderStatusSchema.optional(),
    paymentStatus: z.enum(['UNPAID', 'PAID', 'FAILED', 'REFUNDED']).optional(),
    paymentMethod: z.enum(['COD', 'VNPAY', 'MOMO', 'ZALOPAY']).optional(),
    userId: orderIdSchema.optional(),
  })
  .strict();

export type OrderStatus = z.infer<typeof orderStatusSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type CancelOrderInput = z.infer<typeof cancelOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
export type CustomerOrderQuery = z.infer<typeof customerOrderQuerySchema>;
export type AdminOrderQuery = z.infer<typeof adminOrderQuerySchema>;
