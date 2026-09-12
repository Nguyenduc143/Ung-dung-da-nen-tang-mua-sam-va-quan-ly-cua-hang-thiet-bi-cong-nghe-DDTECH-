import { z } from 'zod';

const idParamsSchema = (message: string) =>
  z.object({ id: z.string().regex(/^\d+$/, message) });
const slugSchema = z.string().trim().min(1).max(280).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const moneySchema = z.number().nonnegative();
const urlSchema = z.string().trim().url().max(500).nullable().optional();
const statusSchema = z.enum(['ACTIVE', 'INACTIVE']);

export const productIdParamsSchema = idParamsSchema('ID sản phẩm không hợp lệ');
export const productSlugParamsSchema = z.object({ slug: slugSchema });
export const variantIdParamsSchema = idParamsSchema('ID variant không hợp lệ');
export const imageIdParamsSchema = idParamsSchema('ID ảnh không hợp lệ');

const productFields = {
  categoryId: z.number().int().positive(),
  brandId: z.number().int().positive().nullable().optional(),
  name: z.string().trim().min(1).max(255),
  slug: slugSchema.optional(),
  sku: z.string().trim().min(1).max(50),
  shortDescription: z.string().trim().max(500).nullable().optional(),
  description: z.string().nullable().optional(),
  specifications: z.unknown().nullable().optional(),
  price: moneySchema,
  salePrice: moneySchema.nullable().optional(),
  stock: z.number().int().nonnegative().default(0),
  hasVariants: z.boolean().default(false),
  warrantyMonths: z.number().int().nonnegative().default(12),
  weightGram: z.number().int().nonnegative().nullable().optional(),
  isFeatured: z.boolean().default(false),
  isNew: z.boolean().default(false),
  status: statusSchema.default('ACTIVE'),
};

const validateSalePrice = <T extends { price: number; salePrice?: number | null }>(data: T) =>
  data.salePrice === null || data.salePrice === undefined || data.salePrice <= data.price;

export const createProductSchema = z
  .object(productFields)
  .strict()
  .refine(validateSalePrice, { message: 'salePrice phải nhỏ hơn hoặc bằng price', path: ['salePrice'] });

export const updateProductSchema = z
  .object({
    categoryId: productFields.categoryId.optional(),
    brandId: productFields.brandId,
    name: productFields.name.optional(),
    slug: productFields.slug,
    sku: productFields.sku.optional(),
    shortDescription: productFields.shortDescription,
    description: productFields.description,
    specifications: productFields.specifications,
    price: productFields.price.optional(),
    salePrice: productFields.salePrice,
    stock: productFields.stock.optional(),
    hasVariants: productFields.hasVariants.optional(),
    warrantyMonths: productFields.warrantyMonths.optional(),
    weightGram: productFields.weightGram,
    isFeatured: productFields.isFeatured.optional(),
    isNew: productFields.isNew.optional(),
    status: productFields.status.optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, 'Cần cung cấp ít nhất một trường để cập nhật')
  .refine(
    (data) =>
      data.price === undefined ||
      data.salePrice === undefined ||
      data.salePrice === null ||
      data.salePrice <= data.price,
    { message: 'salePrice phải nhỏ hơn hoặc bằng price', path: ['salePrice'] },
  );

export const productQuerySchema = z.object({
  search: z.string().trim().max(255).optional(),
  category: z.string().trim().max(120).optional(),
  brand: z.string().trim().max(120).optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().nonnegative().optional(),
  sort: z.enum(['price_asc', 'price_desc', 'newest', 'best_selling', 'rating']).default('newest'),
  featured: z.coerce.boolean().optional(),
  new: z.coerce.boolean().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

const variantFields = {
  sku: z.string().trim().min(1).max(50),
  variantName: z.string().trim().min(1).max(150),
  attributes: z.unknown().nullable().optional(),
  price: moneySchema,
  salePrice: moneySchema.nullable().optional(),
  stock: z.number().int().nonnegative().default(0),
  imageUrl: urlSchema,
  sortOrder: z.number().int().min(0).default(0),
  status: statusSchema.default('ACTIVE'),
};

export const createVariantSchema = z
  .object(variantFields)
  .strict()
  .refine(validateSalePrice, { message: 'salePrice phải nhỏ hơn hoặc bằng price', path: ['salePrice'] });

export const updateVariantSchema = z
  .object({
    sku: variantFields.sku.optional(),
    variantName: variantFields.variantName.optional(),
    attributes: variantFields.attributes,
    price: variantFields.price.optional(),
    salePrice: variantFields.salePrice,
    stock: variantFields.stock.optional(),
    imageUrl: variantFields.imageUrl,
    sortOrder: variantFields.sortOrder.optional(),
    status: variantFields.status.optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, 'Cần cung cấp ít nhất một trường để cập nhật')
  .refine(
    (data) =>
      data.price === undefined ||
      data.salePrice === undefined ||
      data.salePrice === null ||
      data.salePrice <= data.price,
    { message: 'salePrice phải nhỏ hơn hoặc bằng price', path: ['salePrice'] },
  );

export const createImageSchema = z
  .object({
    variantId: z.number().int().positive().nullable().optional(),
    imageUrl: z.string().trim().url().max(500),
    altText: z.string().trim().max(255).nullable().optional(),
    isPrimary: z.boolean().default(false),
    sortOrder: z.number().int().min(0).default(0),
  })
  .strict();

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ProductQuery = z.infer<typeof productQuerySchema>;
export type CreateVariantInput = z.infer<typeof createVariantSchema>;
export type UpdateVariantInput = z.infer<typeof updateVariantSchema>;
export type CreateImageInput = z.infer<typeof createImageSchema>;