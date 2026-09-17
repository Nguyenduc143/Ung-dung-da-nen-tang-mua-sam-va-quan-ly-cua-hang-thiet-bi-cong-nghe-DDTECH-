import type { ApiResponse } from '../types/api';
import type {
  Category,
  CategoryAttribute,
  CategoryAttributeInput,
  CategoryInput,
} from '../types/catalog';
import { apiClient } from './axiosClient';

type RawCategoryAttribute = Omit<CategoryAttribute, 'isFilterable' | 'options'> & {
  isFilterable: boolean | number;
  options: string[] | string | null;
};

const normalizeAttribute = (attribute: RawCategoryAttribute): CategoryAttribute => {
  let normalizedOptions: string[] | null = null;

  if (Array.isArray(attribute.options)) {
    normalizedOptions = attribute.options.map(String);
  } else if (typeof attribute.options === 'string') {
    try {
      const options: unknown = JSON.parse(attribute.options);
      normalizedOptions = Array.isArray(options) ? options.map(String) : null;
    } catch {
      normalizedOptions = null;
    }
  }

  return {
    ...attribute,
    isFilterable: Boolean(attribute.isFilterable),
    options: normalizedOptions,
  };
};

export const listCategories = async (): Promise<Category[]> => {
  const response = await apiClient.get<ApiResponse<Category[]>>('/admin/categories');
  return response.data.data;
};

export const createCategory = async (input: CategoryInput): Promise<Category> => {
  const response = await apiClient.post<ApiResponse<Category>>('/admin/categories', input);
  return response.data.data;
};

export const updateCategory = async (id: number, input: CategoryInput): Promise<Category> => {
  const response = await apiClient.patch<ApiResponse<Category>>(`/admin/categories/${id}`, input);
  return response.data.data;
};

export const deleteCategory = async (id: number): Promise<void> => {
  await apiClient.delete<ApiResponse<null>>(`/admin/categories/${id}`);
};

export const listCategoryAttributes = async (categoryId: number): Promise<CategoryAttribute[]> => {
  const response = await apiClient.get<ApiResponse<RawCategoryAttribute[]>>(
    `/admin/categories/${categoryId}/attributes`,
  );
  return response.data.data.map(normalizeAttribute);
};

export const createCategoryAttribute = async (
  categoryId: number,
  input: CategoryAttributeInput,
): Promise<CategoryAttribute> => {
  const response = await apiClient.post<ApiResponse<RawCategoryAttribute>>(
    `/admin/categories/${categoryId}/attributes`,
    input,
  );
  return normalizeAttribute(response.data.data);
};

export const updateCategoryAttribute = async (
  id: number,
  input: CategoryAttributeInput,
): Promise<CategoryAttribute> => {
  const response = await apiClient.patch<ApiResponse<RawCategoryAttribute>>(
    `/admin/category-attributes/${id}`,
    input,
  );
  return normalizeAttribute(response.data.data);
};

export const deleteCategoryAttribute = async (id: number): Promise<void> => {
  await apiClient.delete<ApiResponse<null>>(`/admin/category-attributes/${id}`);
};
