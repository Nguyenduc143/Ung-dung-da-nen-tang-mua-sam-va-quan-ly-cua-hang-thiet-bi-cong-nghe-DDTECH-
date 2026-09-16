import { z } from 'zod';

const MAX_MONEY = 9999999999999.99;

export const promotionIdSchema = z.coerce.number().int().positive().max(Number.MAX_SAFE_INTEGER);

const promotionCodeSchema = z
  .string()
  .trim()
  .min(1)
  .max(50)
  .regex(/^[A-Za-z0-9_-]+$/, 'Mã khuyến mãi chỉ gồm chữ, số, dấu gạch ngang hoặc gạch dưới')
  .transform((value) => value.toUpperCase());

const moneySchema = z.number().finite().min(0).max(MAX_MONEY);
const positiveMoneySchema = z.number().finite().positive().max(MAX_MONEY);
const positiveIntegerSchema = z.number().int().positive().max(4294967295);

const promotionFields = {
  code: promotionCodeSchema,
  name: z.string().trim().min(1).max(150),
  description: z.string().trim().max(500).nullable(),
  discountType: z.enum(['PERCENT', 'FIXED']),
  discountValue: positiveMoneySchema,
  maxDiscount: positiveMoneySchema.nullable(),
  minOrderValue: moneySchema,
  usageLimit: positiveIntegerSchema.nullable(),
  usageLimitPerUser: positiveIntegerSchema,
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  status: z.enum(['ACTIVE', 'INACTIVE']),
};

const validateRules = (
  data: {
    discountType?: 'PERCENT' | 'FIXED';
    discountValue?: number;
    maxDiscount?: number | null;
    startDate?: Date;
    endDate?: Date;
  },
  context: z.RefinementCtx,
): void => {
  if (data.discountType === 'PERCENT' && data.discountValue !== undefined
      && data.discountValue > 100) {
    context.addIssue({
      code: 'custom',
      message: 'Phần trăm giảm giá không được vượt quá 100',
      path: ['discountValue'],
    });
  }
  if (data.discountType === 'FIXED' && data.maxDiscount != null) {
    context.addIssue({
      code: 'custom',
      message: 'maxDiscount chỉ áp dụng cho khuyến mãi phần trăm',
      path: ['maxDiscount'],
    });
  }
  if (data.startDate !== undefined && data.endDate !== undefined
      && data.endDate <= data.startDate) {
    context.addIssue({
      code: 'custom',
      message: 'Thời gian kết thúc phải sau thời gian bắt đầu',
      path: ['endDate'],
    });
  }
};

export const validatePromotionSchema = z
  .object({ code: promotionCodeSchema })
  .strict();

export const createPromotionSchema = z
  .object({
    code: promotionFields.code,
    name: promotionFields.name,
    description: promotionFields.description.optional(),
    discountType: promotionFields.discountType,
    discountValue: promotionFields.discountValue,
    maxDiscount: promotionFields.maxDiscount.optional(),
    minOrderValue: promotionFields.minOrderValue.optional(),
    usageLimit: promotionFields.usageLimit.optional(),
    usageLimitPerUser: promotionFields.usageLimitPerUser.optional(),
    startDate: promotionFields.startDate,
    endDate: promotionFields.endDate,
    status: promotionFields.status.optional(),
  })
  .strict()
  .superRefine(validateRules);

export const updatePromotionSchema = z
  .object({
    code: promotionFields.code.optional(),
    name: promotionFields.name.optional(),
    description: promotionFields.description.optional(),
    discountType: promotionFields.discountType.optional(),
    discountValue: promotionFields.discountValue.optional(),
    maxDiscount: promotionFields.maxDiscount.optional(),
    minOrderValue: promotionFields.minOrderValue.optional(),
    usageLimit: promotionFields.usageLimit.optional(),
    usageLimitPerUser: promotionFields.usageLimitPerUser.optional(),
    startDate: promotionFields.startDate.optional(),
    endDate: promotionFields.endDate.optional(),
    status: promotionFields.status.optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, 'Cần cung cấp ít nhất một trường để cập nhật')
  .superRefine(validateRules);

export type ValidatePromotionInput = z.infer<typeof validatePromotionSchema>;
export type CreatePromotionInput = z.infer<typeof createPromotionSchema>;
export type UpdatePromotionInput = z.infer<typeof updatePromotionSchema>;
