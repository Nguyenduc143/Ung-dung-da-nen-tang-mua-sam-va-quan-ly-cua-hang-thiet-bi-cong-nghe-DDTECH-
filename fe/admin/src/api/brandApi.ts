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

const toBrandFormData = (input: BrandInput, file: File): FormData => {
  const formData = new FormData();
  formData.append('image', file);
  formData.append('name', input.name);
  if (input.slug) formData.append('slug', input.slug);
  formData.append('description', input.description ?? '');
  formData.append('status', input.status ?? 'ACTIVE');
  return formData;
};

export const createBrandWithImage = async (
  input: BrandInput,
  file: File,
): Promise<Brand> => {
  const response = await apiClient.post<ApiResponse<Brand>>(
    '/admin/brands/upload',
    toBrandFormData(input, file),
  );
  return response.data.data;
};

export const updateBrandWithImage = async (
  id: number,
  input: BrandInput,
  file: File,
): Promise<Brand> => {
  const response = await apiClient.patch<ApiResponse<Brand>>(
    `/admin/brands/${id}/upload`,
    toBrandFormData(input, file),
  );
  return response.data.data;
};

export const deleteBrand = async (id: number): Promise<void> => {
  await apiClient.delete<ApiResponse<null>>(`/admin/brands/${id}`);
};
