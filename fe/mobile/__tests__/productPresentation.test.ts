import type { Product, ProductVariant } from '@/types';
import { getProductAvailability, getVariantAvailability } from '@/utils/productPresentation';

const product: Product = {
  id: 1,
  categoryId: 1,
  brandId: 1,
  name: 'Điện thoại thử nghiệm',
  slug: 'dien-thoai-thu-nghiem',
  sku: 'TEST-001',
  shortDescription: null,
  description: null,
  specifications: null,
  price: 10_000_000,
  salePrice: null,
  stock: 5,
  soldCount: 0,
  hasVariants: false,
  warrantyMonths: 12,
  weightGram: null,
  ratingAvg: 0,
  reviewCount: 0,
  viewCount: 0,
  isFeatured: false,
  isNew: false,
  status: 'ACTIVE',
  primaryImageUrl: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const variant: ProductVariant = {
  id: 10,
  productId: 1,
  sku: 'TEST-001-BLACK',
  variantName: 'Màu đen',
  attributes: { color: 'black' },
  price: 10_000_000,
  salePrice: null,
  stock: 2,
  soldCount: 0,
  imageUrl: null,
  sortOrder: 0,
  status: 'ACTIVE',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('product availability', () => {
  test('cho mua sản phẩm còn hàng', () => {
    expect(getProductAvailability(product)).toMatchObject({
      code: 'AVAILABLE',
      isPurchasable: true,
      stock: 5,
    });
  });

  test('khóa mua khi sản phẩm hết hàng', () => {
    expect(getProductAvailability({ ...product, stock: 0 })).toMatchObject({
      code: 'OUT_OF_STOCK',
      isPurchasable: false,
    });
  });

  test('khóa mua khi giá không khả dụng', () => {
    expect(getProductAvailability({ ...product, price: 0 })).toMatchObject({
      code: 'PRICE_UNAVAILABLE',
      isPurchasable: false,
    });
  });

  test('tính tổng kho từ các biến thể khả dụng', () => {
    const result = getProductAvailability(
      { ...product, hasVariants: true, stock: 0 },
      [variant, { ...variant, id: 11, stock: 3 }],
    );

    expect(result).toMatchObject({ code: 'AVAILABLE', isPurchasable: true, stock: 5 });
  });

  test('phân biệt biến thể bị ẩn, hết hàng và chưa có giá', () => {
    expect(getVariantAvailability({ ...variant, status: 'INACTIVE' }).code)
      .toBe('VARIANT_UNAVAILABLE');
    expect(getVariantAvailability({ ...variant, stock: 0 }).code).toBe('OUT_OF_STOCK');
    expect(getVariantAvailability({ ...variant, price: 0 }).code).toBe('PRICE_UNAVAILABLE');
  });
});
