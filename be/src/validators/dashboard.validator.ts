import { z } from 'zod';

const dateSchema = z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày phải có định dạng YYYY-MM-DD');

export const emptyDashboardQuerySchema = z.object({}).strict();

export const revenueQuerySchema = z
  .object({
    period: z.enum(['7d', '30d', '12m']).optional(),
    from: dateSchema.optional(),
    to: dateSchema.optional(),
  })
  .strict()
  .superRefine((data, context) => {
    if ((data.from === undefined) !== (data.to === undefined)) {
      context.addIssue({
        code: 'custom',
        message: 'Phải cung cấp đồng thời from và to',
        path: [data.from === undefined ? 'from' : 'to'],
      });
    }
    if (data.period !== undefined && data.from !== undefined) {
      context.addIssue({
        code: 'custom',
        message: 'Chỉ sử dụng period hoặc khoảng from/to',
        path: ['period'],
      });
    }
  });

export const dashboardLimitQuerySchema = z
  .object({ limit: z.coerce.number().int().positive().max(50).default(10) })
  .strict();

export const dashboardLowStockQuerySchema = z
  .object({ threshold: z.coerce.number().int().min(0).max(4294967295).default(5) })
  .strict();

export type RevenueQuery = z.infer<typeof revenueQuerySchema>;
export type DashboardLimitQuery = z.infer<typeof dashboardLimitQuerySchema>;
