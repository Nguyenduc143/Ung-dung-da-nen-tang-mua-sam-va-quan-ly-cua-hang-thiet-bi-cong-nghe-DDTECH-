export type PromotionDiscountType = 'PERCENT' | 'FIXED';
export type PromotionStatus = 'ACTIVE' | 'INACTIVE';

export interface Promotion {
  id: number;
  code: string;
  name: string;
  description: string | null;
  discountType: PromotionDiscountType;
  discountValue: number;
  maxDiscount: number | null;
  minOrderValue: number;
  usageLimit: number | null;
  usageLimitPerUser: number;
  usedCount: number;
  startDate: string;
  endDate: string;
  status: PromotionStatus;
  createdAt: string;
  updatedAt: string;
}

export interface PromotionInput {
  code: string;
  name: string;
  description: string | null;
  discountType: PromotionDiscountType;
  discountValue: number;
  maxDiscount: number | null;
  minOrderValue: number;
  usageLimit: number | null;
  usageLimitPerUser: number;
  startDate: string;
  endDate: string;
  status: PromotionStatus;
}

export interface PromotionListData {
  promotions: Promotion[];
}
