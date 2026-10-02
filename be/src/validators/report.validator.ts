import { z } from 'zod';

const dateSchema = z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày phải có định dạng YYYY-MM-DD');
const idSchema = z.coerce.number().int().positive().max(Number.MAX_SAFE_INTEGER);
const orderStatusSchema = z.enum([
  'PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPING', 'DELIVERED', 'CANCELLED',
]);
const inventoryTypeSchema = z.enum(['IMPORT', 'SALE', 'RETURN', 'ADJUSTMENT', 'CANCEL_ORDER']);

const rangeFields = {
  from: dateSchema.optional(),
  to: dateSchema.optional(),
};

const validateRangePair = <T extends { from?: string; to?: string }>(
  data: T,
  context: z.RefinementCtx,
) => {
  if ((data.from === undefined) !== (data.to === undefined)) {
    context.addIssue({
      code: 'custom',
      message: 'Phải cung cấp đồng thời from và to',
      path: [data.from === undefined ? 'from' : 'to'],
    });
  }
};

export const revenueReportQuerySchema = z.object({
  ...rangeFields,
  groupBy: z.enum(['DAY', 'MONTH']).default('DAY'),
}).strict().superRefine(validateRangePair);

export const orderReportQuerySchema = z.object({
  ...rangeFields,
  status: orderStatusSchema.optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
}).strict().superRefine(validateRangePair);

export const productReportQuerySchema = z.object({
  ...rangeFields,
  categoryId: idSchema.optional(),
  brandId: idSchema.optional(),
  limit: z.coerce.number().int().positive().max(500).default(100),
}).strict().superRefine(validateRangePair);

export const inventoryReportQuerySchema = z.object({
  ...rangeFields,
  type: inventoryTypeSchema.optional(),
  productId: idSchema.optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
}).strict().superRefine(validateRangePair);

export const exportReportQuerySchema = z.object({
  ...rangeFields,
  report: z.enum(['revenue', 'orders', 'products', 'inventory']),
  format: z.enum(['csv', 'xlsx']).default('xlsx'),
  groupBy: z.enum(['DAY', 'MONTH']).default('DAY'),
  status: orderStatusSchema.optional(),
  categoryId: idSchema.optional(),
  brandId: idSchema.optional(),
  type: inventoryTypeSchema.optional(),
  productId: idSchema.optional(),
}).strict().superRefine(validateRangePair);

export type RevenueReportQuery = z.infer<typeof revenueReportQuerySchema>;
export type OrderReportQuery = z.infer<typeof orderReportQuerySchema>;
export type ProductReportQuery = z.infer<typeof productReportQuerySchema>;
export type InventoryReportQuery = z.infer<typeof inventoryReportQuerySchema>;
export type ExportReportQuery = z.infer<typeof exportReportQuerySchema>;
