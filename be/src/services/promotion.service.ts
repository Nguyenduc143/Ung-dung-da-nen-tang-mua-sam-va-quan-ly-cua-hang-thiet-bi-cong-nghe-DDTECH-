import type { PoolConnection } from 'mysql2/promise';

import { withTransaction } from '../config/database';
import * as cartRepository from '../repositories/cart.repository';
import * as promotionRepository from '../repositories/promotion.repository';
import { AppError } from '../utils/app-error';
import type {
  CreatePromotionInput,
  UpdatePromotionInput,
} from '../validators/promotion.validator';

const MAX_MONEY_CENTS = 999999999999999n;

const moneyToCents = (value: string | number): bigint => {
  const [whole, fraction = ''] = String(value).split('.');
  return BigInt(whole) * 100n + BigInt(`${fraction}00`.slice(0, 2));
};

const centsToNumber = (value: bigint): number => Number(value) / 100;

const toPromotionResponse = (promotion: promotionRepository.PromotionRecord) => ({
  id: promotion.id,
  code: promotion.code,
  name: promotion.name,
  description: promotion.description,
  discountType: promotion.discountType,
  discountValue: Number(promotion.discountValue),
  maxDiscount: promotion.maxDiscount === null ? null : Number(promotion.maxDiscount),
  minOrderValue: Number(promotion.minOrderValue),
  usageLimit: promotion.usageLimit,
  usageLimitPerUser: promotion.usageLimitPerUser,
  usedCount: promotion.usedCount,
  startDate: promotion.startDate,
  endDate: promotion.endDate,
  status: promotion.status,
  createdAt: promotion.createdAt,
  updatedAt: promotion.updatedAt,
});

const calculateDiscountCents = (
  promotion: promotionRepository.PromotionRecord,
  subtotalCents: bigint,
): bigint => {
  let discountCents: bigint;
  if (promotion.discountType === 'PERCENT') {
    const percentageBasisPoints = moneyToCents(promotion.discountValue);
    discountCents = subtotalCents * percentageBasisPoints / 10000n;
    if (promotion.maxDiscount !== null) {
      const maxDiscountCents = moneyToCents(promotion.maxDiscount);
      if (discountCents > maxDiscountCents) discountCents = maxDiscountCents;
    }
  } else {
    discountCents = moneyToCents(promotion.discountValue);
  }
  return discountCents > subtotalCents ? subtotalCents : discountCents;
};

const ensurePromotionCanBeUsed = async (
  promotion: promotionRepository.PromotionRecord | null,
  userId: number,
  subtotalCents: bigint,
  executor?: PoolConnection,
): Promise<{ promotion: promotionRepository.PromotionRecord; discountCents: bigint }> => {
  if (!promotion) throw new AppError(404, 'Mã khuyến mãi không tồn tại');

  const now = Date.now();
  if (promotion.status !== 'ACTIVE') {
    throw new AppError(409, 'Mã khuyến mãi không hoạt động');
  }
  if (promotion.startDate.getTime() > now) {
    throw new AppError(409, 'Mã khuyến mãi chưa bắt đầu');
  }
  if (promotion.endDate.getTime() < now) {
    throw new AppError(409, 'Mã khuyến mãi đã hết hạn');
  }
  if (promotion.usageLimit !== null && promotion.usedCount >= promotion.usageLimit) {
    throw new AppError(409, 'Mã khuyến mãi đã hết lượt sử dụng');
  }
  if (subtotalCents < moneyToCents(promotion.minOrderValue)) {
    throw new AppError(409, 'Đơn hàng chưa đạt giá trị tối thiểu của mã khuyến mãi');
  }

  const userUsageCount = await promotionRepository.countUserUsages(
    promotion.id,
    userId,
    executor,
  );
  if (userUsageCount >= promotion.usageLimitPerUser) {
    throw new AppError(409, 'Bạn đã sử dụng hết lượt của mã khuyến mãi');
  }
  return { promotion, discountCents: calculateDiscountCents(promotion, subtotalCents) };
};

export const validateForCheckout = async (
  connection: PoolConnection,
  userId: number,
  code: string,
  subtotalCents: bigint,
) => ensurePromotionCanBeUsed(
  await promotionRepository.findByCode(code, connection, true),
  userId,
  subtotalCents,
  connection,
);

const getCartSubtotalCents = async (userId: number): Promise<bigint> => {
  const cart = await cartRepository.findCartByUser(userId);
  if (!cart) throw new AppError(409, 'Giỏ hàng đang trống');
  const items = await cartRepository.listCartItems(cart.id);
  if (items.length === 0) throw new AppError(409, 'Giỏ hàng đang trống');

  let subtotalCents = 0n;
  for (const item of items) {
    const productAvailable = item.productStatus === 'ACTIVE' && item.productDeletedAt === null;
    const selectionAvailable = item.hasVariants === 1
      ? item.variantId !== null && item.variantStatus === 'ACTIVE'
      : item.variantId === null;
    if (!productAvailable || !selectionAvailable) {
      throw new AppError(409, `${item.productName} hiện không khả dụng`);
    }
    if (item.quantity > item.availableStock) {
      throw new AppError(409, `${item.productName} không đủ tồn kho`);
    }
    subtotalCents += moneyToCents(item.currentPrice) * BigInt(item.quantity);
    if (subtotalCents > MAX_MONEY_CENTS) {
      throw new AppError(422, 'Giá trị giỏ hàng vượt quá giới hạn cho phép');
    }
  }
  return subtotalCents;
};

export const validateCartPromotion = async (userId: number, code: string) => {
  const subtotalCents = await getCartSubtotalCents(userId);
  const result = await ensurePromotionCanBeUsed(
    await promotionRepository.findByCode(code),
    userId,
    subtotalCents,
  );
  return {
    promotion: toPromotionResponse(result.promotion),
    subtotal: centsToNumber(subtotalCents),
    discountAmount: centsToNumber(result.discountCents),
    totalAfterDiscount: centsToNumber(subtotalCents - result.discountCents),
  };
};

export const listPromotions = async () => ({
  promotions: (await promotionRepository.listPromotions()).map(toPromotionResponse),
});

const ensureAdminRules = (promotion: {
  discountType: 'PERCENT' | 'FIXED';
  discountValue: string | number;
  maxDiscount: string | number | null;
  usageLimit: number | null;
  usedCount: number;
  startDate: Date;
  endDate: Date;
}): void => {
  if (promotion.discountType === 'PERCENT' && Number(promotion.discountValue) > 100) {
    throw new AppError(422, 'Phần trăm giảm giá không được vượt quá 100');
  }
  if (promotion.discountType === 'FIXED' && promotion.maxDiscount !== null) {
    throw new AppError(422, 'maxDiscount chỉ áp dụng cho khuyến mãi phần trăm');
  }
  if (promotion.endDate <= promotion.startDate) {
    throw new AppError(422, 'Thời gian kết thúc phải sau thời gian bắt đầu');
  }
  if (promotion.usageLimit !== null && promotion.usageLimit < promotion.usedCount) {
    throw new AppError(422, 'Giới hạn sử dụng không được nhỏ hơn số lượt đã dùng');
  }
};

const isDuplicateEntryError = (error: unknown): boolean =>
  typeof error === 'object' && error !== null && 'code' in error && error.code === 'ER_DUP_ENTRY';

export const createPromotion = async (input: CreatePromotionInput) => {
  try {
    const promotionId = await withTransaction(async (connection) => {
      ensureAdminRules({
        ...input,
        maxDiscount: input.maxDiscount ?? null,
        usageLimit: input.usageLimit ?? null,
        usedCount: 0,
      });
      return promotionRepository.savePromotion(input, undefined, connection);
    });
    const promotion = await promotionRepository.findById(promotionId);
    if (!promotion) throw new Error('Newly created promotion could not be loaded');
    return toPromotionResponse(promotion);
  } catch (error) {
    if (isDuplicateEntryError(error)) throw new AppError(409, 'Mã khuyến mãi đã tồn tại');
    throw error;
  }
};

export const updatePromotion = async (promotionId: number, input: UpdatePromotionInput) => {
  try {
    await withTransaction(async (connection) => {
      const existing = await promotionRepository.findById(promotionId, connection, true);
      if (!existing) throw new AppError(404, 'Không tìm thấy mã khuyến mãi');
      const changes: UpdatePromotionInput = { ...input };
      if (input.discountType === 'FIXED' && input.maxDiscount === undefined) {
        changes.maxDiscount = null;
      }
      const merged = { ...existing, ...changes };
      ensureAdminRules(merged);
      await promotionRepository.savePromotion(changes, promotionId, connection);
    });
    const promotion = await promotionRepository.findById(promotionId);
    if (!promotion) throw new Error('Updated promotion could not be loaded');
    return toPromotionResponse(promotion);
  } catch (error) {
    if (isDuplicateEntryError(error)) throw new AppError(409, 'Mã khuyến mãi đã tồn tại');
    throw error;
  }
};

export const deletePromotion = async (promotionId: number): Promise<void> => {
  await withTransaction(async (connection) => {
    const promotion = await promotionRepository.findById(promotionId, connection, true);
    if (!promotion) throw new AppError(404, 'Không tìm thấy mã khuyến mãi');
    await promotionRepository.deactivatePromotion(promotionId, connection);
  });
};
