import type {
  ApiResponse,
  Category,
  CategoryAttribute,
  CategoryDetail,
} from '@/types';
import { resolveMediaUrl } from '@/utils/mediaUrl';
import { apiClient } from './axiosClient';

type RawCategoryAttribute = Omit<CategoryAttribute, 'isFilterable' | 'options'> & {
  isFilterable: boolean | number;
  options: string[] | string | null;
};

type RawCategoryDetail = Omit<CategoryDetail, 'attributes'> & {
  attributes: RawCategoryAttribute[];
};

const normalizeAttribute = (attribute: RawCategoryAttribute): CategoryAttribute => {
  let options: string[] | null = null;
  if (Array.isArray(attribute.options)) options = attribute.options.map(String);
  else if (typeof attribute.options === 'string') {
    try {
      const parsed: unknown = JSON.parse(attribute.options);
      if (Array.isArray(parsed)) options = parsed.map(String);
    } catch {
      options = null;
    }
  }

  return { ...attribute, isFilterable: Boolean(attribute.isFilterable), options };
};

const normalizeCategory = <T extends Category>(category: T): T => ({
  ...category,
  imageUrl: resolveMediaUrl(category.imageUrl),
});

export const listCategories = async (): Promise<Category[]> => {
  const response = await apiClient.get<ApiResponse<Category[]>>('/categories');
  return response.data.data.map(normalizeCategory);
};

export const getCategoryBySlug = async (slug: string): Promise<CategoryDetail> => {
  const response = await apiClient.get<ApiResponse<RawCategoryDetail>>(
    `/categories/${encodeURIComponent(slug)}`,
  );
  return normalizeCategory({
    ...response.data.data,
    attributes: response.data.data.attributes.map(normalizeAttribute),
  });
};
