import { withTransaction } from '../config/database';
import * as brandRepository from '../repositories/brand.repository';
import * as categoryRepository from '../repositories/category.repository';
import * as productRepository from '../repositories/product.repository';
import { AppError } from '../utils/app-error';
import { slugify } from '../utils/slug';
import type {
  CreateImageInput,
  CreateProductInput,
  CreateVariantInput,
  ProductQuery,
  UpdateProductInput,
  UpdateVariantInput,
} from '../validators/product.validator';

const isDuplicateEntryError = (error: unknown): boolean =>
  typeof error === 'object' && error !== null && 'code' in error && error.code === 'ER_DUP_ENTRY';

const parseJson = (value: unknown): unknown => {
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

const toVariantResponse = (variant: productRepository.VariantRecord) => ({
  id: variant.id,
  productId: variant.product_id,
  sku: variant.sku,
  variantName: variant.variant_name,
  attributes: parseJson(variant.attributes),
  price: Number(variant.price),
  salePrice: variant.sale_price === null ? null : Number(variant.sale_price),
  stock: variant.stock,
  soldCount: variant.sold_count,
  imageUrl: variant.image_url,
  sortOrder: variant.sort_order,
  status: variant.status,
  createdAt: variant.created_at,
  updatedAt: variant.updated_at,
});

const toImageResponse = (image: productRepository.ImageRecord) => ({
  id: image.id,
  productId: image.product_id,
  variantId: image.variant_id,
  imageUrl: image.image_url,
  altText: image.alt_text,
  isPrimary: image.is_primary === 1,
  sortOrder: image.sort_order,
  createdAt: image.created_at,
});

const toProductResponse = (product: productRepository.ProductRecord) => ({
  id: product.id,
  categoryId: product.category_id,
  brandId: product.brand_id,
  name: product.name,
  slug: product.slug,
  sku: product.sku,
  shortDescription: product.short_description,
  description: product.description,
  specifications: parseJson(product.specifications),
  price: Number(product.price),
  salePrice: product.sale_price === null ? null : Number(product.sale_price),
  stock: product.stock,
  soldCount: product.sold_count,
  hasVariants: product.has_variants === 1,
  warrantyMonths: product.warranty_months,
  weightGram: product.weight_gram,
  ratingAvg: Number(product.rating_avg),
  reviewCount: product.review_count,
  viewCount: product.view_count,
  isFeatured: product.is_featured === 1,
  isNew: product.is_new === 1,
  status: product.status,
  deletedAt: product.deleted_at,
  createdAt: product.created_at,
  updatedAt: product.updated_at,
  ...(product.category_name === undefined
    ? {}
    : {
        category: {
          id: product.category_id,
          name: product.category_name,
          slug: product.category_slug,
        },
      }),
  ...(product.brand_name === undefined
    ? {}
    : {
        brand: product.brand_id === null ? null : {
          id: product.brand_id,
          name: product.brand_name,
          slug: product.brand_slug,
        },
      }),
  ...(product.primary_image_url === undefined ? {} : { primaryImageUrl: product.primary_image_url }),
});

const ensureCategoryAndBrand = async (categoryId: number, brandId: number | null) => {
  const category = await categoryRepository.findById(categoryId);
  if (!category || category.deleted_at !== null || category.status !== 'ACTIVE') {
    throw new AppError(404, 'Không tìm thấy danh mục hoạt động');
  }

  if (brandId !== null) {
    const brand = await brandRepository.findById(brandId);
    if (!brand || brand.deleted_at !== null || brand.status !== 'ACTIVE') {
      throw new AppError(404, 'Không tìm thấy thương hiệu hoạt động');
    }
  }
};

const ensureProduct = async (productId: number, includeDeleted = false) => {
  const product = await productRepository.findById(productId);
  if (!product || (!includeDeleted && product.deleted_at !== null)) {
    throw new AppError(404, 'Không tìm thấy sản phẩm');
  }
  return product;
};

const validateSalePrice = (price: number, salePrice: number | null | undefined) => {
  if (salePrice !== null && salePrice !== undefined && salePrice > price) {
    throw new AppError(422, 'salePrice phải nhỏ hơn hoặc bằng price');
  }
};

export const listPublic = async (query: ProductQuery) => {
  const result = await productRepository.listPublic(query);
  return {
    products: result.products.map(toProductResponse),
    pagination: {
      page: query.page,
      limit: query.limit,
      total: result.total,
      totalPages: Math.ceil(result.total / query.limit),
    },
  };
};

const getDetail = async (product: productRepository.ProductRecord) => {
  const [variants, images] = await Promise.all([
    productRepository.listVariants(product.id),
    productRepository.listImages(product.id),
  ]);
  return {
    product: toProductResponse(product),
    variants: variants.map(toVariantResponse),
    images: images.map(toImageResponse),
  };
};

export const getPublicById = async (productId: number) => {
  const product = await productRepository.findPublicById(productId);
  if (!product) throw new AppError(404, 'Không tìm thấy sản phẩm');
  return getDetail(product);
};

export const getPublicBySlug = async (slug: string) => {
  const product = await productRepository.findPublicBySlug(slug);
  if (!product) throw new AppError(404, 'Không tìm thấy sản phẩm');
  return getDetail(product);
};

export const create = async (input: CreateProductInput) => {
  await ensureCategoryAndBrand(input.categoryId, input.brandId ?? null);
  validateSalePrice(input.price, input.salePrice);
  const slug = input.slug ?? slugify(input.name);

  try {
    const productId = await productRepository.create(input, slug);
    const product = await ensureProduct(productId);
    return toProductResponse(product);
  } catch (error) {
    if (isDuplicateEntryError(error)) throw new AppError(409, 'Slug hoặc SKU sản phẩm đã được sử dụng');
    throw error;
  }
};

export const update = async (productId: number, input: UpdateProductInput) => {
  const current = await ensureProduct(productId);
  const categoryId = input.categoryId ?? current.category_id;
  const brandId = input.brandId === undefined ? current.brand_id : input.brandId;
  await ensureCategoryAndBrand(categoryId, brandId);

  const price = input.price ?? Number(current.price);
  validateSalePrice(price, input.salePrice === undefined ? current.sale_price === null ? null : Number(current.sale_price) : input.salePrice);
  const hasVariants = input.hasVariants ?? current.has_variants === 1;
  const normalizedInput: UpdateProductInput = hasVariants
    ? Object.fromEntries(Object.entries(input).filter(([field]) => field !== 'stock')) as UpdateProductInput
    : input;
  const slug = input.slug ?? (input.name === undefined ? undefined : slugify(input.name));

  try {
    await productRepository.update(productId, normalizedInput, slug);
  } catch (error) {
    if (isDuplicateEntryError(error)) throw new AppError(409, 'Slug hoặc SKU sản phẩm đã được sử dụng');
    throw error;
  }

  const updated = await ensureProduct(productId);
  return toProductResponse(updated);
};

export const remove = async (productId: number): Promise<void> => {
  if (!(await productRepository.softDelete(productId))) {
    throw new AppError(404, 'Không tìm thấy sản phẩm');
  }
};

export const createVariant = async (productId: number, input: CreateVariantInput) => {
  await ensureProduct(productId);
  validateSalePrice(input.price, input.salePrice);

  try {
    const variantId = await withTransaction(async (connection) => {
      const createdVariantId = await productRepository.createVariant(productId, input, connection);
      await productRepository.syncProductStock(connection, productId);
      return createdVariantId;
    });
    const variant = await productRepository.findVariantById(variantId);
    if (!variant) throw new Error('Newly created variant could not be loaded');
    return toVariantResponse(variant);
  } catch (error) {
    if (isDuplicateEntryError(error)) throw new AppError(409, 'SKU variant đã được sử dụng');
    throw error;
  }
};

const ensureOwnedVariant = async (productId: number, variantId: number) => {
  const variant = await productRepository.findVariantById(variantId);
  if (!variant || variant.product_id !== productId) {
    throw new AppError(404, 'Không tìm thấy variant thuộc sản phẩm');
  }
  return variant;
};

export const updateVariant = async (variantId: number, input: UpdateVariantInput) => {
  const current = await productRepository.findVariantById(variantId);
  if (!current) throw new AppError(404, 'Không tìm thấy variant');
  const price = input.price ?? Number(current.price);
  validateSalePrice(price, input.salePrice === undefined ? current.sale_price === null ? null : Number(current.sale_price) : input.salePrice);

  try {
    await withTransaction(async (connection) => {
      await productRepository.updateVariant(variantId, input, connection);
      await productRepository.syncProductStock(connection, current.product_id);
    });
  } catch (error) {
    if (isDuplicateEntryError(error)) throw new AppError(409, 'SKU variant đã được sử dụng');
    throw error;
  }
  const updated = await ensureOwnedVariant(current.product_id, variantId);
  return toVariantResponse(updated);
};

export const removeVariant = async (variantId: number): Promise<void> => {
  const current = await productRepository.findVariantById(variantId);
  if (!current) throw new AppError(404, 'Không tìm thấy variant');
  await withTransaction(async (connection) => {
    await productRepository.deleteVariant(variantId, connection);
    await productRepository.syncProductStock(connection, current.product_id);
  });
};

export const listImages = async (productId: number) => {
  await ensureProduct(productId);
  return (await productRepository.listImages(productId)).map(toImageResponse);
};

export const createImage = async (productId: number, input: CreateImageInput) => {
  await ensureProduct(productId);
  if (input.variantId !== null && input.variantId !== undefined) {
    await ensureOwnedVariant(productId, input.variantId);
  }

  const imageId = await withTransaction(async (connection) => {
    if (input.isPrimary) await productRepository.clearPrimaryImage(connection, productId);
    return productRepository.createImage(connection, productId, input);
  });
  const image = await productRepository.findImageById(imageId);
  if (!image) throw new Error('Newly created image could not be loaded');
  return toImageResponse(image);
};

export const removeImage = async (imageId: number): Promise<void> => {
  const image = await productRepository.findImageById(imageId);
  if (!image) throw new AppError(404, 'Không tìm thấy ảnh');
  await productRepository.deleteImage(imageId);
};

export const setPrimaryImage = async (imageId: number) => {
  const image = await productRepository.findImageById(imageId);
  if (!image) throw new AppError(404, 'Không tìm thấy ảnh');

  await withTransaction(async (connection) => {
    if (!(await productRepository.setPrimaryImage(connection, image.product_id, imageId))) {
      throw new AppError(404, 'Không tìm thấy ảnh thuộc sản phẩm');
    }
  });
  const updated = await productRepository.findImageById(imageId);
  if (!updated) throw new AppError(404, 'Không tìm thấy ảnh');
  return toImageResponse(updated);
};