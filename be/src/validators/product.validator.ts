import { z } from 'zod';

const MAX_MONEY = 9999999999999.99;
const MAX_UNSIGNED_INT = 4294967295;
const MAX_SIGNED_INT = 2147483647;
const MAX_SORT_ORDER = 2147483647;

export const productIdSchema = z.coerce.number().int().positive().max(Number.MAX_SAFE_INTEGER);
export const productSlugSchema = z
  .string()
  .trim()
  .min(1)
  .max(280)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug không hợp lệ');

const moneySchema = z.number().finite().min(0).max(MAX_MONEY);
const stockSchema = z.number().int().min(0).max(MAX_UNSIGNED_INT);
const nullableUrlSchema = z.string().trim().url('URL hình ảnh không hợp lệ').max(500).nullable();
const specificationsSchema = z
  .record(z.string().trim().min(1).max(50), z.unknown())
  .nullable();

const productFields = {
  categoryId: productIdSchema,
  brandId: productIdSchema.nullable(),
  name: z.string().trim().min(1).max(255),
  slug: productSlugSchema,
  sku: z.string().trim().min(1).max(50),
  shortDescription: z.string().trim().max(500).nullable(),
  description: z.string().max(65535).nullable(),
  specifications: specificationsSchema,
  price: moneySchema,
  salePrice: moneySchema.nullable(),
  stock: z.number().int().min(0).max(MAX_SIGNED_INT),
  hasVariants: z.boolean(),
  warrantyMonths: z.number().int().min(0).max(65535),
  weightGram: stockSchema.nullable(),
  isFeatured: z.boolean(),
  isNew: z.boolean(),
  status: z.enum(['ACTIVE', 'INACTIVE']),
};

export const createProductSchema = z
  .object({
    categoryId: productFields.categoryId,
    brandId: productFields.brandId.optional(),
    name: productFields.name,
    slug: productFields.slug.optional(),
    sku: productFields.sku,
    shortDescription: productFields.shortDescription.optional(),
    description: productFields.description.optional(),
    specifications: productFields.specifications.optional(),
    price: productFields.price,
    salePrice: productFields.salePrice.optional(),
    stock: productFields.stock.optional(),
    hasVariants: productFields.hasVariants.optional(),
    warrantyMonths: productFields.warrantyMonths.optional(),
    weightGram: productFields.weightGram.optional(),
    isFeatured: productFields.isFeatured.optional(),
    isNew: productFields.isNew.optional(),
    status: productFields.status.optional(),
  })
  .strict()
  .refine((data) => data.salePrice == null || data.salePrice <= data.price, {
    message: 'Giá khuyến mãi không được lớn hơn giá gốc',
    path: ['salePrice'],
  });

export const updateProductSchema = z
  .object({
    categoryId: productFields.categoryId.optional(),
    brandId: productFields.brandId.optional(),
    name: productFields.name.optional(),
    slug: productFields.slug.optional(),
    sku: productFields.sku.optional(),
    shortDescription: productFields.shortDescription.optional(),
    description: productFields.description.optional(),
    specifications: productFields.specifications.optional(),
    price: productFields.price.optional(),
    salePrice: productFields.salePrice.optional(),
    hasVariants: productFields.hasVariants.optional(),
    warrantyMonths: productFields.warrantyMonths.optional(),
    weightGram: productFields.weightGram.optional(),
    isFeatured: productFields.isFeatured.optional(),
    isNew: productFields.isNew.optional(),
    status: productFields.status.optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, 'Cần cung cấp ít nhất một trường để cập nhật');

const variantFields = {
  sku: z.string().trim().min(1).max(50),
  variantName: z.string().trim().min(1).max(150),
  attributes: z.record(z.string().trim().min(1).max(50), z.unknown()).nullable(),
  price: moneySchema,
  salePrice: moneySchema.nullable(),
  stock: stockSchema,
  imageUrl: nullableUrlSchema,
  sortOrder: z.number().int().min(-MAX_SORT_ORDER - 1).max(MAX_SORT_ORDER),
  status: z.enum(['ACTIVE', 'INACTIVE']),
};

export const createVariantSchema = z
  .object({
    sku: variantFields.sku,
    variantName: variantFields.variantName,
    attributes: variantFields.attributes.optional(),
    price: variantFields.price,
    salePrice: variantFields.salePrice.optional(),
    stock: variantFields.stock.optional(),
    imageUrl: variantFields.imageUrl.optional(),
    sortOrder: variantFields.sortOrder.optional(),
    status: variantFields.status.optional(),
  })
  .strict()
  .refine((data) => data.salePrice == null || data.salePrice <= data.price, {
    message: 'Giá khuyến mãi không được lớn hơn giá gốc',
    path: ['salePrice'],
  });

export const updateVariantSchema = z
  .object({
    sku: variantFields.sku.optional(),
    variantName: variantFields.variantName.optional(),
    attributes: variantFields.attributes.optional(),
    price: variantFields.price.optional(),
    salePrice: variantFields.salePrice.optional(),
    imageUrl: variantFields.imageUrl.optional(),
    sortOrder: variantFields.sortOrder.optional(),
    status: variantFields.status.optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, 'Cần cung cấp ít nhất một trường để cập nhật');

export const createProductImageSchema = z
  .object({
    variantId: productIdSchema.nullable().optional(),
    imageUrl: z.string().trim().url('URL hình ảnh không hợp lệ').max(500),
    altText: z.string().trim().max(255).nullable().optional(),
    isPrimary: z.boolean().optional(),
    sortOrder: z.number().int().min(-MAX_SORT_ORDER - 1).max(MAX_SORT_ORDER).optional(),
  })
  .strict();

const queryBoolean = z.preprocess((value) => {
  if (value === 'true' || value === '1') return true;
  if (value === 'false' || value === '0') return false;
  return value;
}, z.boolean());

export const productQuerySchema = z
  .object({
    search: z.string().trim().max(255).optional(),
    category: z.string().trim().min(1).max(280).optional(),
    brand: z.string().trim().min(1).max(280).optional(),
    status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
    minPrice: z.coerce.number().finite().min(0).max(MAX_MONEY).optional(),
    maxPrice: z.coerce.number().finite().min(0).max(MAX_MONEY).optional(),
    sort: z
      .enum(['price_asc', 'price_desc', 'newest', 'best_selling', 'rating'])
      .default('newest'),
    featured: queryBoolean.optional(),
    new: queryBoolean.optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
  })
  .strict()
  .refine(
    (data) => data.minPrice === undefined || data.maxPrice === undefined || data.minPrice <= data.maxPrice,
    { message: 'Giá tối thiểu không được lớn hơn giá tối đa', path: ['minPrice'] },
  );

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type CreateVariantInput = z.infer<typeof createVariantSchema>;
export type UpdateVariantInput = z.infer<typeof updateVariantSchema>;
export type CreateProductImageInput = z.infer<typeof createProductImageSchema>;
export type ProductQuery = z.infer<typeof productQuerySchema>;
