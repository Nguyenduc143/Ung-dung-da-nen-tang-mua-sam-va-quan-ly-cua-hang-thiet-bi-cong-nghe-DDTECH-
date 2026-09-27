import type { ProductListItem } from '@/types';
import { resolveMediaUrl } from './mediaUrl';

export const getProductPrice = (product: ProductListItem): number => (
  product.salePrice !== null && product.salePrice < product.price
    ? product.salePrice
    : product.price
);

export const getProductOriginalPrice = (product: ProductListItem): number | null => (
  product.salePrice !== null && product.salePrice < product.price
    ? product.price
    : null
);

export const getProductDiscountPercent = (product: ProductListItem): number => {
  if (product.salePrice === null || product.price <= 0 || product.salePrice >= product.price) return 0;
  return Math.round(((product.price - product.salePrice) / product.price) * 100);
};

export const getProductBadgeText = (product: ProductListItem): string | undefined => {
  const discount = getProductDiscountPercent(product);
  if (discount > 0) return `-${discount}%`;
  if (product.isNew) return 'Mới';
  if (product.isFeatured) return 'Nổi bật';
  return undefined;
};

export const getProductImageSource = (product: ProductListItem) => {
  const imageUrl = resolveMediaUrl(product.primaryImageUrl);
  return imageUrl ? { uri: imageUrl } : undefined;
};
