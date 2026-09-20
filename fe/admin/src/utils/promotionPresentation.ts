import dayjs from 'dayjs';

import type { Promotion } from '../types/promotion';
import { formatCurrency } from './formatters';

export type PromotionViewState = 'ONGOING' | 'UPCOMING' | 'EXPIRED' | 'EXHAUSTED' | 'INACTIVE';

export const promotionStateLabels: Record<PromotionViewState, string> = {
  ONGOING: 'Đang diễn ra',
  UPCOMING: 'Sắp diễn ra',
  EXPIRED: 'Đã hết hạn',
  EXHAUSTED: 'Hết lượt dùng',
  INACTIVE: 'Ngừng hoạt động',
};

export const promotionStateColors: Record<PromotionViewState, string> = {
  ONGOING: 'success',
  UPCOMING: 'processing',
  EXPIRED: 'default',
  EXHAUSTED: 'warning',
  INACTIVE: 'error',
};

export const getPromotionViewState = (promotion: Promotion): PromotionViewState => {
  if (promotion.status === 'INACTIVE') return 'INACTIVE';
  if (promotion.usageLimit !== null && promotion.usedCount >= promotion.usageLimit) {
    return 'EXHAUSTED';
  }

  const now = dayjs();
  if (dayjs(promotion.startDate).isAfter(now)) return 'UPCOMING';
  if (dayjs(promotion.endDate).isBefore(now)) return 'EXPIRED';
  return 'ONGOING';
};

export const formatPromotionDiscount = (promotion: Promotion): string => (
  promotion.discountType === 'PERCENT'
    ? `${promotion.discountValue}%`
    : formatCurrency(promotion.discountValue)
);
