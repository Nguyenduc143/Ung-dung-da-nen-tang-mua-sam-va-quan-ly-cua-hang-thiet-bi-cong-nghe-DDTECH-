import { z } from 'zod';

const positiveId = z.string().regex(/^\d+$/, 'ID không hợp lệ');

export const cartItemIdParamsSchema = z.object({ id: positiveId });
export const favoriteProductIdParamsSchema = z.object({ productId: positiveId });

export const addCartItemSchema = z
  .object({
    productId: z.number().int().positive(),
    variantId: z.number().int().positive().nullable().optional(),
    quantity: z.number().int().positive(),
  })
  .strict();

export const updateCartItemSchema = z
  .object({
    quantity: z.number().int().positive(),
  })
  .strict();

export type AddCartItemInput = z.infer<typeof addCartItemSchema>;
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;