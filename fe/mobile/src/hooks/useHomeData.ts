import { useCallback, useEffect, useRef, useState } from 'react';

import { listCategories } from '@/api/categories.api';
import { getApiErrorMessage } from '@/api/axiosClient';
import { listProducts } from '@/api/products.api';
import type { Category, ProductListItem } from '@/types';

interface HomeData {
  categories: Category[];
  featuredProducts: ProductListItem[];
  newProducts: ProductListItem[];
  bestSellingProducts: ProductListItem[];
}

interface HomeDataState extends HomeData {
  error: string | null;
  isLoading: boolean;
  isRefreshing: boolean;
  reload: () => Promise<void>;
  refresh: () => Promise<void>;
}

const initialData: HomeData = {
  categories: [],
  featuredProducts: [],
  newProducts: [],
  bestSellingProducts: [],
};

const HOME_PRODUCT_LIMIT = 8;

export function useHomeData(): HomeDataState {
  const [data, setData] = useState<HomeData>(initialData);
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
      const [categories, featured, newest, bestSelling] = await Promise.all([
        listCategories(),
        listProducts({ featured: true, limit: HOME_PRODUCT_LIMIT }),
        listProducts({ new: true, sort: 'newest', limit: HOME_PRODUCT_LIMIT }),
        listProducts({ sort: 'best_selling', limit: HOME_PRODUCT_LIMIT }),
      ]);

      if (requestId !== requestIdRef.current) return;
      setData({
        categories,
        featuredProducts: featured.products,
        newProducts: newest.products,
        bestSellingProducts: bestSelling.products,
      });
    } catch (requestError) {
      if (requestId !== requestIdRef.current) return;
      setError(getApiErrorMessage(requestError, 'Không thể tải dữ liệu trang chủ.'));
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
    ...data,
    error,
    isLoading,
    isRefreshing,
    reload: () => load(false),
    refresh: () => load(true),
  };
}
