import type { ApiResponse, Brand } from '@/types';
import { resolveMediaUrl } from '@/utils/mediaUrl';
import { apiClient } from './axiosClient';

const normalizeBrand = (brand: Brand): Brand => ({
  ...brand,
  logoUrl: resolveMediaUrl(brand.logoUrl),
});

export const listBrands = async (): Promise<Brand[]> => {
  const response = await apiClient.get<ApiResponse<Brand[]>>('/brands');
  return response.data.data.map(normalizeBrand);
};

export const getBrandBySlug = async (slug: string): Promise<Brand> => {
  const response = await apiClient.get<ApiResponse<Brand>>(
    `/brands/${encodeURIComponent(slug)}`,
  );
  return normalizeBrand(response.data.data);
};
