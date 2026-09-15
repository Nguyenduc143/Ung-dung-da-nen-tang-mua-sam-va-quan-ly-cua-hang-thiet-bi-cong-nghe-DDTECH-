import { z } from 'zod';

export const cartIdSchema = z.coerce.number().int().positive().max(Number.MAX_SAFE_INTEGER);

export const addCartItemSchema = z
  .object({
    productId: cartIdSchema,
    variantId: cartIdSchema.nullable().optional(),
    quantity: z.number().int().positive('Số lượng phải lớn hơn 0').max(4294967295),
  })
  .strict();

export const updateCartItemSchema = z
  .object({
    quantity: z.number().int().positive('Số lượng phải lớn hơn 0').max(4294967295),
  })
  .strict();

export type AddCartItemInput = z.infer<typeof addCartItemSchema>;
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;
