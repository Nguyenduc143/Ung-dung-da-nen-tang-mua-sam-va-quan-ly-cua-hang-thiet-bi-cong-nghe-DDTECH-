import type { ApiResponse } from '../types/api';
import type { Brand, BrandInput } from '../types/catalog';
import { apiClient } from './axiosClient';

export const listBrands = async (): Promise<Brand[]> => {
  const response = await apiClient.get<ApiResponse<Brand[]>>('/admin/brands');
  return response.data.data;
};

export const createBrand = async (input: BrandInput): Promise<Brand> => {
  const response = await apiClient.post<ApiResponse<Brand>>('/admin/brands', input);
  return response.data.data;
};

export const updateBrand = async (id: number, input: BrandInput): Promise<Brand> => {
  const response = await apiClient.patch<ApiResponse<Brand>>(`/admin/brands/${id}`, input);
  return response.data.data;
};

export const deleteBrand = async (id: number): Promise<void> => {
  await apiClient.delete<ApiResponse<null>>(`/admin/brands/${id}`);
};
