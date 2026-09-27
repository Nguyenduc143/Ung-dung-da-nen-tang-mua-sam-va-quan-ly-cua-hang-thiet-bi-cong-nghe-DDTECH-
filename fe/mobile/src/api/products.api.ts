import type { ApiResponse, ProductDetailData, ProductListData, ProductQuery } from '@/types';
import { resolveMediaUrl } from '@/utils/mediaUrl';
import { apiClient } from './axiosClient';

export const listProducts = async (query: ProductQuery = {}): Promise<ProductListData> => {
  const response = await apiClient.get<ApiResponse<ProductListData>>('/products', {
    params: query,
  });
  return {
    ...response.data.data,
    products: response.data.data.products.map((product) => ({
      ...product,
      primaryImageUrl: resolveMediaUrl(product.primaryImageUrl),
    })),
  };
};

export const getProduct = async (productId: number): Promise<ProductDetailData> => {
  const response = await apiClient.get<ApiResponse<ProductDetailData>>(`/products/${productId}`);
  const data = response.data.data;

  return {
    ...data,
    product: {
      ...data.product,
      primaryImageUrl: resolveMediaUrl(data.product.primaryImageUrl),
    },
    variants: data.variants.map((variant) => ({
      ...variant,
      imageUrl: resolveMediaUrl(variant.imageUrl),
    })),
    images: data.images.map((image) => ({
      ...image,
      imageUrl: resolveMediaUrl(image.imageUrl) ?? image.imageUrl,
    })),
  };
};
