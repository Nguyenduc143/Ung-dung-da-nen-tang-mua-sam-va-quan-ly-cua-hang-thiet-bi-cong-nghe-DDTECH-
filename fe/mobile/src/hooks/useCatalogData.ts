import { useCallback, useEffect, useRef, useState } from 'react';

import { listBrands } from '@/api/brands.api';
import { listCategories } from '@/api/categories.api';
import { getApiErrorMessage } from '@/api/axiosClient';
import type { Brand, Category } from '@/types';

interface CatalogDataState {
  brands: Brand[];
  categories: Category[];
  error: string | null;
  isLoading: boolean;
  isRefreshing: boolean;
  reload: () => Promise<void>;
  refresh: () => Promise<void>;
}

export function useCatalogData(): CatalogDataState {
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const requestIdRef = useRef(0);

  const load = useCallback(async (refreshing: boolean) => {
    const requestId = ++requestIdRef.current;
    if (refreshing) setIsRefreshing(true);
    else setIsLoading(true);
    setError(null);

    try {
      const [categoryData, brandData] = await Promise.all([
        listCategories(),
        listBrands(),
      ]);
      if (requestId !== requestIdRef.current) return;
      setCategories(categoryData);
      setBrands(brandData);
    } catch (requestError) {
      if (requestId !== requestIdRef.current) return;
      setError(getApiErrorMessage(requestError, 'Không thể tải danh mục và thương hiệu.'));
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    void load(false);
    return () => {
      requestIdRef.current += 1;
    };
  }, [load]);

  return {
    brands,
    categories,
    error,
    isLoading,
    isRefreshing,
    reload: () => load(false),
    refresh: () => load(true),
  };
}
