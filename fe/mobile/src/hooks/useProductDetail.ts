import { useCallback, useEffect, useRef, useState } from 'react';

import { getApiErrorMessage } from '@/api/axiosClient';
import { getProduct } from '@/api/products.api';
import { listProductReviews } from '@/api/reviews.api';
import type { ProductDetailData, ProductReviewData } from '@/types';

interface ProductDetailState {
  detail: ProductDetailData | null;
  reviews: ProductReviewData | null;
  error: string | null;
  isLoading: boolean;
  isRefreshing: boolean;
  reload: () => Promise<void>;
  refresh: () => Promise<void>;
}

export function useProductDetail(productId: number): ProductDetailState {
  const [detail, setDetail] = useState<ProductDetailData | null>(null);
  const [reviews, setReviews] = useState<ProductReviewData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const requestIdRef = useRef(0);

  const load = useCallback(async (refreshing = false) => {
    const requestId = ++requestIdRef.current;
    if (refreshing) setIsRefreshing(true);
    else setIsLoading(true);
    setError(null);

    try {
      const [productData, reviewData] = await Promise.all([
        getProduct(productId),
        listProductReviews(productId),
      ]);
      if (requestId !== requestIdRef.current) return;

      setDetail(productData);
      setReviews(reviewData);
    } catch (loadError) {
      if (requestId === requestIdRef.current) {
        setError(getApiErrorMessage(loadError, 'Không thể tải chi tiết sản phẩm.'));
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, [productId]);

  useEffect(() => {
    setDetail(null);
    setReviews(null);
    void load();
    return () => {
      requestIdRef.current += 1;
    };
  }, [load]);

  return {
    detail,
    reviews,
    error,
    isLoading,
    isRefreshing,
    reload: () => load(false),
    refresh: () => load(true),
  };
}
