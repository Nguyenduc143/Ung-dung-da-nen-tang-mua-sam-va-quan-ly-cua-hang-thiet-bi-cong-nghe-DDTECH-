import * as productImageRepository from '../repositories/product-image.repository';
import * as productVariantRepository from '../repositories/product-variant.repository';
import { AppError } from '../utils/app-error';

export const parseJson = (value: unknown): unknown => {
  if (typeof value !== 'string') return value;

  try {
    return JSON.parse(value) as unknown;
  } catch {
    return value;
  }
};

export const toVariantResponse = (variant: productVariantRepository.VariantRecord) => ({
  id: variant.id,
  productId: variant.productId,
  sku: variant.sku,
  variantName: variant.variantName,
  attributes: parseJson(variant.attributes),
  price: Number(variant.price),
  salePrice: variant.salePrice === null ? null : Number(variant.salePrice),
  stock: variant.stock,
  soldCount: variant.soldCount,
  imageUrl: variant.imageUrl,
  sortOrder: variant.sortOrder,
  status: variant.status,
  createdAt: variant.createdAt,
  updatedAt: variant.updatedAt,
});

export const toImageResponse = (image: productImageRepository.ProductImageRecord) => ({
  id: image.id,
  productId: image.productId,
  variantId: image.variantId,
  imageUrl: image.imageUrl,
  altText: image.altText,
  isPrimary: image.isPrimary === 1,
  sortOrder: image.sortOrder,
  createdAt: image.createdAt,
});

export const isDuplicateEntryError = (error: unknown): boolean =>
  typeof error === 'object' && error !== null && 'code' in error && error.code === 'ER_DUP_ENTRY';

export const ensureValidPrices = (
  price: string | number,
  salePrice: string | number | null | undefined,
): void => {
  if (salePrice !== null && salePrice !== undefined && Number(salePrice) > Number(price)) {
    throw new AppError(422, 'Giá khuyến mãi không được lớn hơn giá gốc');
  }
};
