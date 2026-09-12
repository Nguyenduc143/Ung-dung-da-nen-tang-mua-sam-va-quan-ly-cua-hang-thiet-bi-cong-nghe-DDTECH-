import { z } from 'zod';

const slugSchema = z.string().trim().min(1).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const urlSchema = z.string().trim().url().max(500).nullable().optional();
const statusSchema = z.enum(['ACTIVE', 'HIDDEN']);

export const categoryIdParamsSchema = z.object({
  id: z.string().regex(/^\d+$/, 'ID danh mục không hợp lệ'),
});

export const categorySlugParamsSchema = z.object({
  slug: slugSchema,
});

export const createCategorySchema = z
  .object({
    parentId: z.number().int().positive().nullable().optional(),
    name: z.string().trim().min(1).max(100),
    slug: slugSchema.optional(),
    description: z.string().trim().max(500).nullable().optional(),
    imageUrl: urlSchema,
    sortOrder: z.number().int().min(0).default(0),
    status: statusSchema.default('ACTIVE'),
  })
  .strict();

export const updateCategorySchema = z
  .object({
    parentId: z.number().int().positive().nullable().optional(),
    name: z.string().trim().min(1).max(100).optional(),
    slug: slugSchema.optional(),
    description: z.string().trim().max(500).nullable().optional(),
    imageUrl: urlSchema,
    sortOrder: z.number().int().min(0).optional(),
    status: statusSchema.optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, 'Cần cung cấp ít nhất một trường để cập nhật');

export const brandIdParamsSchema = z.object({
  id: z.string().regex(/^\d+$/, 'ID thương hiệu không hợp lệ'),
});

export const brandSlugParamsSchema = z.object({
  slug: slugSchema,
});

export const createBrandSchema = z
  .object({
    name: z.string().trim().min(1).max(100),
    slug: slugSchema.optional(),
    logoUrl: urlSchema,
    description: z.string().trim().max(500).nullable().optional(),
    status: statusSchema.default('ACTIVE'),
  })
  .strict();

export const updateBrandSchema = z
  .object({
    name: z.string().trim().min(1).max(100).optional(),
    slug: slugSchema.optional(),
    logoUrl: urlSchema,
    description: z.string().trim().max(500).nullable().optional(),
    status: statusSchema.optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, 'Cần cung cấp ít nhất một trường để cập nhật');

export const categoryAttributeIdParamsSchema = z.object({
  id: z.string().regex(/^\d+$/, 'ID thông số không hợp lệ'),
});

const attributeFields = {
  attrKey: z.string().trim().min(1).max(50).regex(/^[a-z][a-z0-9_]*$/),
  attrName: z.string().trim().min(1).max(100),
  unit: z.string().trim().max(20).nullable().optional(),
  inputType: z.enum(['TEXT', 'NUMBER', 'SELECT']).default('TEXT'),
  options: z.unknown().nullable().optional(),
  isFilterable: z.boolean().default(false),
  sortOrder: z.number().int().min(0).default(0),
};

export const createCategoryAttributeSchema = z.object(attributeFields).strict();

export const updateCategoryAttributeSchema = z
  .object({
    attrKey: attributeFields.attrKey.optional(),
    attrName: attributeFields.attrName.optional(),
    unit: attributeFields.unit,
    inputType: z.enum(['TEXT', 'NUMBER', 'SELECT']).optional(),
    options: attributeFields.options,
    isFilterable: z.boolean().optional(),
    sortOrder: z.number().int().min(0).optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, 'Cần cung cấp ít nhất một trường để cập nhật');

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type CreateBrandInput = z.infer<typeof createBrandSchema>;
export type UpdateBrandInput = z.infer<typeof updateBrandSchema>;
export type CreateCategoryAttributeInput = z.infer<typeof createCategoryAttributeSchema>;
export type UpdateCategoryAttributeInput = z.infer<typeof updateCategoryAttributeSchema>;