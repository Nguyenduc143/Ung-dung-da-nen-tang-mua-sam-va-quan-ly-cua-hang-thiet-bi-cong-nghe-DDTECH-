import type { ApiResponse, ProductListData, ProductQuery } from '@/types';
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
