import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { getApiErrorMessage } from '@/api/axiosClient';
import { listProducts } from '@/api/products.api';
import type {
  ProductListItem,
  ProductPagination,
  ProductQuery,
} from '@/types';

const PAGE_SIZE = 10;

const initialPagination: ProductPagination = {
  page: 1,
  limit: PAGE_SIZE,
  total: 0,
  totalPages: 0,
};

type LoadMode = 'initial' | 'refresh' | 'more';

interface ProductListState {
  products: ProductListItem[];
  pagination: ProductPagination;
  error: string | null;
  loadMoreError: string | null;
  isLoading: boolean;
  isRefreshing: boolean;
  isLoadingMore: boolean;
  hasNextPage: boolean;
  loadMore: () => Promise<void>;
  reload: () => Promise<void>;
  refresh: () => Promise<void>;
}

const mergeUniqueProducts = (
  current: ProductListItem[],
  incoming: ProductListItem[],
): ProductListItem[] => {
  const products = new Map(current.map((product) => [product.id, product]));
  incoming.forEach((product) => products.set(product.id, product));
  return [...products.values()];
};

export function useProductList(filters: Omit<ProductQuery, 'limit' | 'page'>): ProductListState {
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [pagination, setPagination] = useState<ProductPagination>(initialPagination);
  const [error, setError] = useState<string | null>(null);
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loadedPagesRef = useRef(new Set<number>());
  const loadingMoreRef = useRef(false);
  const requestIdRef = useRef(0);

  const queryKey = useMemo(() => JSON.stringify(filters), [filters]);
  const queryKeyRef = useRef(queryKey);

  const loadPage = useCallback(async (page: number, mode: LoadMode) => {
    if (mode === 'more') {
      if (loadingMoreRef.current || loadedPagesRef.current.has(page)) return;
      loadingMoreRef.current = true;
      setIsLoadingMore(true);
      setLoadMoreError(null);
    } else if (mode === 'refresh') {
      setIsRefreshing(true);
      setError(null);
    } else {
      setIsLoading(true);
      setError(null);
    }

    const requestId = ++requestIdRef.current;
    const requestQueryKey = queryKey;

    try {
      const data = await listProducts({ ...filters, limit: PAGE_SIZE, page });
      if (requestId !== requestIdRef.current || requestQueryKey !== queryKeyRef.current) return;

      loadedPagesRef.current.add(page);
      setPagination(data.pagination);
      setProducts((current) => (
        page === 1 ? data.products : mergeUniqueProducts(current, data.products)
      ));
      setError(null);
      setLoadMoreError(null);
    } catch (requestError) {
      if (requestId !== requestIdRef.current || requestQueryKey !== queryKeyRef.current) return;
      const message = getApiErrorMessage(requestError, 'Không thể tải danh sách sản phẩm.');
      if (mode === 'more') setLoadMoreError(message);
      else setError(message);
    } finally {
      if (requestId === requestIdRef.current && requestQueryKey === queryKeyRef.current) {
        setIsLoading(false);
        setIsRefreshing(false);
        setIsLoadingMore(false);
        loadingMoreRef.current = false;
      }
    }
  }, [filters, queryKey]);

  useEffect(() => {
    queryKeyRef.current = queryKey;
    requestIdRef.current += 1;
    loadedPagesRef.current.clear();
    loadingMoreRef.current = false;
    setProducts([]);
    setPagination(initialPagination);
    setLoadMoreError(null);
    void loadPage(1, 'initial');

    return () => {
      requestIdRef.current += 1;
    };
  }, [loadPage, queryKey]);

  const hasNextPage = pagination.page < pagination.totalPages;

  return {
    products,
    pagination,
    error,
    loadMoreError,
    isLoading,
    isRefreshing,
    isLoadingMore,
    hasNextPage,
    loadMore: async () => {
      if (!hasNextPage) return;
      await loadPage(pagination.page + 1, 'more');
    },
    reload: () => loadPage(1, 'initial'),
    refresh: async () => {
      loadedPagesRef.current.clear();
      await loadPage(1, 'refresh');
    },
  };
}
