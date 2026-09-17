import type { ApiResponse } from '../types/api';
import type {
  ProductDetailData,
  ProductInput,
  ProductImage,
  ProductImageInput,
  ProductListData,
  ProductQuery,
  ProductVariant,
  ProductVariantInput,
} from '../types/product';
import { apiClient } from './axiosClient';

export const listProducts = async (query: ProductQuery): Promise<ProductListData> => {
  const response = await apiClient.get<ApiResponse<ProductListData>>('/admin/products', {
    params: query,
  });
  return response.data.data;
};

export const getProduct = async (id: number): Promise<ProductDetailData> => {
  const response = await apiClient.get<ApiResponse<ProductDetailData>>(`/admin/products/${id}`);
  return response.data.data;
};

export const createProduct = async (input: ProductInput): Promise<ProductDetailData> => {
  const response = await apiClient.post<ApiResponse<ProductDetailData>>('/admin/products', input);
  return response.data.data;
};

export const updateProduct = async (
  id: number,
  input: Omit<ProductInput, 'stock'>,
): Promise<ProductDetailData> => {
  const response = await apiClient.patch<ApiResponse<ProductDetailData>>(
    `/admin/products/${id}`,
    input,
  );
  return response.data.data;
};

export const deleteProduct = async (id: number): Promise<void> => {
  await apiClient.delete<ApiResponse<null>>(`/admin/products/${id}`);
};

export const createVariant = async (
  productId: number,
  input: ProductVariantInput,
): Promise<ProductVariant> => {
  const response = await apiClient.post<ApiResponse<{ variant: ProductVariant }>>(
    `/admin/products/${productId}/variants`,
    input,
  );
  return response.data.data.variant;
};

export const updateVariant = async (
  id: number,
  input: Omit<ProductVariantInput, 'stock'>,
): Promise<ProductVariant> => {
  const response = await apiClient.patch<ApiResponse<{ variant: ProductVariant }>>(
    `/admin/variants/${id}`,
    input,
  );
  return response.data.data.variant;
};

export const deleteVariant = async (id: number): Promise<void> => {
  await apiClient.delete<ApiResponse<null>>(`/admin/variants/${id}`);
};

export const createImage = async (
  productId: number,
  input: ProductImageInput,
): Promise<ProductImage> => {
  const response = await apiClient.post<ApiResponse<{ image: ProductImage }>>(
    `/admin/products/${productId}/images`,
    input,
  );
  return response.data.data.image;
};

export const deleteImage = async (id: number): Promise<void> => {
  await apiClient.delete<ApiResponse<null>>(`/admin/product-images/${id}`);
};

export const setPrimaryImage = async (id: number): Promise<ProductImage> => {
  const response = await apiClient.patch<ApiResponse<{ image: ProductImage }>>(
    `/admin/product-images/${id}/primary`,
  );
  return response.data.data.image;
};
