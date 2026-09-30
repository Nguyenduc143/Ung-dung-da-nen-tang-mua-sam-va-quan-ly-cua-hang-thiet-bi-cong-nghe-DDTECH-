import type { Product, ProductListItem, ProductVariant } from '@/types';
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

export type ProductAvailabilityCode =
  | 'AVAILABLE'
  | 'OUT_OF_STOCK'
  | 'UNAVAILABLE'
  | 'VARIANT_UNAVAILABLE'
  | 'PRICE_UNAVAILABLE';

export interface ProductAvailability {
  code: ProductAvailabilityCode;
  isPurchasable: boolean;
  label: string;
  stock: number;
}

const hasValidPrice = (price: number, salePrice: number | null): boolean => (
  (Number.isFinite(salePrice) && salePrice !== null && salePrice > 0)
  || (Number.isFinite(price) && price > 0)
);

export const getVariantAvailability = (
  variant: ProductVariant,
): ProductAvailability => {
  if (variant.status !== 'ACTIVE') {
    return { code: 'VARIANT_UNAVAILABLE', isPurchasable: false, label: 'Biến thể không khả dụng', stock: 0 };
  }
  if (!hasValidPrice(variant.price, variant.salePrice)) {
    return { code: 'PRICE_UNAVAILABLE', isPurchasable: false, label: 'Giá đang cập nhật', stock: variant.stock };
  }
  if (variant.stock <= 0) {
    return { code: 'OUT_OF_STOCK', isPurchasable: false, label: 'Hết hàng', stock: 0 };
  }
  return { code: 'AVAILABLE', isPurchasable: true, label: `Còn ${variant.stock} sản phẩm`, stock: variant.stock };
};

export const getProductAvailability = (
  product: Product,
  variants?: ProductVariant[],
): ProductAvailability => {
  if (product.status !== 'ACTIVE') {
    return { code: 'UNAVAILABLE', isPurchasable: false, label: 'Sản phẩm không khả dụng', stock: 0 };
  }
  if (!hasValidPrice(product.price, product.salePrice)) {
    return { code: 'PRICE_UNAVAILABLE', isPurchasable: false, label: 'Giá đang cập nhật', stock: product.stock };
  }

  if (product.hasVariants && variants) {
    const purchasable = variants.map(getVariantAvailability).filter((item) => item.isPurchasable);
    const stock = purchasable.reduce((total, item) => total + item.stock, 0);
    if (purchasable.length === 0) {
      return { code: 'VARIANT_UNAVAILABLE', isPurchasable: false, label: 'Chưa có biến thể khả dụng', stock: 0 };
    }
    return { code: 'AVAILABLE', isPurchasable: true, label: `Còn ${stock} sản phẩm`, stock };
  }

  if (product.stock <= 0) {
    return { code: 'OUT_OF_STOCK', isPurchasable: false, label: 'Hết hàng', stock: 0 };
  }
  return { code: 'AVAILABLE', isPurchasable: true, label: `Còn ${product.stock} sản phẩm`, stock: product.stock };
};
