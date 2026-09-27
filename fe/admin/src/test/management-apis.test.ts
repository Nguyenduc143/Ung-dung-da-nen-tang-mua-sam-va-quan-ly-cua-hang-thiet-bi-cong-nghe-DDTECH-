import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';

const apiClientMocks = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
}));

vi.mock('../api/axiosClient', () => ({ apiClient: apiClientMocks }));

import * as brandApi from '../api/brandApi';
import * as categoryApi from '../api/categoryApi';
import * as inventoryApi from '../api/inventoryApi';
import * as orderApi from '../api/orderApi';
import * as productApi from '../api/productApi';
import * as promotionApi from '../api/promotionApi';
import * as reviewApi from '../api/reviewApi';
import type { BrandInput, CategoryInput } from '../types/catalog';
import type { ProductInput, ProductVariantInput } from '../types/product';
import type { PromotionInput } from '../types/promotion';

const response = (data: unknown) => ({ data: { data } });
const getMock = apiClientMocks.get as Mock;
const postMock = apiClientMocks.post as Mock;
const patchMock = apiClientMocks.patch as Mock;
const deleteMock = apiClientMocks.delete as Mock;

describe('hợp đồng API quản trị', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getMock.mockResolvedValue(response({}));
    postMock.mockResolvedValue(response({}));
    patchMock.mockResolvedValue(response({}));
    deleteMock.mockResolvedValue(response(null));
  });

  it('gọi đúng API CRUD danh mục', async () => {
    const input: CategoryInput = { name: 'Laptop', status: 'ACTIVE' };
    postMock.mockResolvedValue(response({ id: 1 }));
    patchMock.mockResolvedValue(response({ id: 1 }));

    await categoryApi.createCategory(input);
    await categoryApi.updateCategory(1, input);
    await categoryApi.deleteCategory(1);

    expect(postMock).toHaveBeenCalledWith('/admin/categories', input);
    expect(patchMock).toHaveBeenCalledWith('/admin/categories/1', input);
    expect(deleteMock).toHaveBeenCalledWith('/admin/categories/1');
  });

  it('gọi đúng API CRUD thương hiệu', async () => {
    const input: BrandInput = { name: 'ASUS', status: 'ACTIVE' };
    postMock.mockResolvedValue(response({ id: 2 }));
    patchMock.mockResolvedValue(response({ id: 2 }));

    await brandApi.createBrand(input);
    await brandApi.updateBrand(2, input);
    await brandApi.deleteBrand(2);

    expect(postMock).toHaveBeenCalledWith('/admin/brands', input);
    expect(patchMock).toHaveBeenCalledWith('/admin/brands/2', input);
    expect(deleteMock).toHaveBeenCalledWith('/admin/brands/2');
  });

  it('gọi đúng API CRUD sản phẩm và phiên bản', async () => {
    const product: ProductInput = {
      categoryId: 1,
      name: 'Laptop DDTECH',
      sku: 'LAPTOP-DDTECH',
      price: 20_000_000,
    };
    const variant: ProductVariantInput = {
      sku: 'LAPTOP-DDTECH-16GB',
      variantName: '16GB RAM',
      price: 21_000_000,
    };
    postMock
      .mockResolvedValueOnce(response({ product: { id: 3 } }))
      .mockResolvedValueOnce(response({ variant: { id: 4 } }));
    patchMock
      .mockResolvedValueOnce(response({ product: { id: 3 } }))
      .mockResolvedValueOnce(response({ variant: { id: 4 } }));

    await productApi.createProduct(product);
    await productApi.updateProduct(3, product);
    await productApi.createVariant(3, variant);
    await productApi.updateVariant(4, variant);
    await productApi.deleteVariant(4);
    await productApi.deleteProduct(3);

    expect(postMock).toHaveBeenCalledWith('/admin/products', product);
    expect(patchMock).toHaveBeenCalledWith('/admin/products/3', product);
    expect(postMock).toHaveBeenCalledWith('/admin/products/3/variants', variant);
    expect(patchMock).toHaveBeenCalledWith('/admin/variants/4', variant);
    expect(deleteMock).toHaveBeenCalledWith('/admin/variants/4');
    expect(deleteMock).toHaveBeenCalledWith('/admin/products/3');
  });

  it('gọi đúng API điều chỉnh và nhập kho', async () => {
    const input = { productId: 3, variantId: null, quantity: 5, note: 'Kiểm kê' };
    postMock.mockResolvedValue(response({ transaction: {}, stock: {} }));

    await inventoryApi.adjustStock(input);
    await inventoryApi.importStock(input);

    expect(postMock).toHaveBeenCalledWith('/admin/inventory/adjust', input);
    expect(postMock).toHaveBeenCalledWith('/admin/inventory/import', input);
  });

  it('gọi đúng API cập nhật trạng thái đơn hàng', async () => {
    patchMock.mockResolvedValue(response({ order: { id: 5 } }));
    const input = { status: 'CONFIRMED' as const, note: 'Đã xác nhận' };

    await orderApi.updateOrderStatus(5, input);

    expect(patchMock).toHaveBeenCalledWith('/admin/orders/5/status', input);
  });

  it('gọi đúng API CRUD khuyến mãi', async () => {
    const input: PromotionInput = {
      code: 'DDTECH10',
      name: 'Giảm 10%',
      description: null,
      discountType: 'PERCENT',
      discountValue: 10,
      maxDiscount: 500_000,
      minOrderValue: 1_000_000,
      usageLimit: 100,
      usageLimitPerUser: 1,
      startDate: '2026-01-01T00:00:00.000Z',
      endDate: '2026-12-31T23:59:59.000Z',
      status: 'ACTIVE',
    };
    postMock.mockResolvedValue(response({ id: 6 }));
    patchMock.mockResolvedValue(response({ id: 6 }));

    await promotionApi.createPromotion(input);
    await promotionApi.updatePromotion(6, input);
    await promotionApi.deletePromotion(6);

    expect(postMock).toHaveBeenCalledWith('/admin/promotions', input);
    expect(patchMock).toHaveBeenCalledWith('/admin/promotions/6', input);
    expect(deleteMock).toHaveBeenCalledWith('/admin/promotions/6');
  });

  it('gọi đúng API duyệt và phản hồi đánh giá', async () => {
    patchMock.mockResolvedValue(response({ id: 7 }));
    postMock.mockResolvedValue(response({ id: 7 }));

    await reviewApi.updateReviewStatus(7, 'APPROVED');
    await reviewApi.replyReview(7, 'Cảm ơn bạn đã đánh giá.');

    expect(patchMock).toHaveBeenCalledWith('/admin/reviews/7/status', { status: 'APPROVED' });
    expect(postMock).toHaveBeenCalledWith('/admin/reviews/7/reply', {
      reply: 'Cảm ơn bạn đã đánh giá.',
    });
  });
});

