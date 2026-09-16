import { z } from 'zod';

const MAX_UNSIGNED_INT = 4294967295;
const MAX_SIGNED_INT = 2147483647;

export const inventoryIdSchema = z.coerce.number().int().positive().max(Number.MAX_SAFE_INTEGER);

export const inventoryQuerySchema = z
  .object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    search: z.string().trim().max(255).optional(),
    status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  })
  .strict();

export const inventoryTransactionQuerySchema = z
  .object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    productId: inventoryIdSchema.optional(),
    variantId: inventoryIdSchema.optional(),
    createdBy: inventoryIdSchema.optional(),
    type: z.enum(['IMPORT', 'SALE', 'RETURN', 'ADJUSTMENT', 'CANCEL_ORDER']).optional(),
    dateFrom: z.coerce.date().optional(),
    dateTo: z.coerce.date().optional(),
  })
  .strict()
  .refine(
    (data) => data.dateFrom === undefined || data.dateTo === undefined || data.dateFrom <= data.dateTo,
    { message: 'dateFrom không được sau dateTo', path: ['dateFrom'] },
  );

export const lowStockQuerySchema = z
  .object({
    threshold: z.coerce.number().int().min(0).max(MAX_UNSIGNED_INT).default(5),
  })
  .strict();

const baseStockChangeFields = {
  productId: inventoryIdSchema,
  variantId: inventoryIdSchema.nullable().optional(),
  note: z.string().trim().min(1).max(255).nullable().optional(),
};

export const adjustInventorySchema = z
  .object({
    ...baseStockChangeFields,
    quantity: z.number().int().min(-MAX_SIGNED_INT - 1).max(MAX_SIGNED_INT)
      .refine((value) => value !== 0, 'Số lượng điều chỉnh phải khác 0'),
  })
  .strict();

export const importInventorySchema = z
  .object({
    ...baseStockChangeFields,
    quantity: z.number().int().positive().max(MAX_SIGNED_INT),
  })
  .strict();

export type InventoryQuery = z.infer<typeof inventoryQuerySchema>;
export type InventoryTransactionQuery = z.infer<typeof inventoryTransactionQuerySchema>;
export type LowStockQuery = z.infer<typeof lowStockQuerySchema>;
export type AdjustInventoryInput = z.infer<typeof adjustInventorySchema>;
export type ImportInventoryInput = z.infer<typeof importInventorySchema>;
