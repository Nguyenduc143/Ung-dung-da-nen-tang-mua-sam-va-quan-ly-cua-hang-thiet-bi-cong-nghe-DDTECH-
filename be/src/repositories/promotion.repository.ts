import type { PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import type { ExecuteValues } from 'mysql2';

import { executeDynamicProcedure, executeProcedure, pool } from '../config/database';
import type {
  CreatePromotionInput,
  UpdatePromotionInput,
} from '../validators/promotion.validator';

type Executor = typeof pool | PoolConnection;

export interface PromotionRecord extends RowDataPacket {
  id: number;
  code: string;
  name: string;
  description: string | null;
  discountType: 'PERCENT' | 'FIXED';
  discountValue: string | number;
  maxDiscount: string | number | null;
  minOrderValue: string | number;
  usageLimit: number | null;
  usageLimitPerUser: number;
  usedCount: number;
  startDate: Date;
  endDate: Date;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: Date;
  updatedAt: Date;
}

interface CountRecord extends RowDataPacket {
  total: number;
}

const PROMOTION_COLUMNS = `id, code, name, description,
  discount_type AS discountType, discount_value AS discountValue,
  max_discount AS maxDiscount, min_order_value AS minOrderValue,
  usage_limit AS usageLimit, usage_limit_per_user AS usageLimitPerUser,
  used_count AS usedCount, start_date AS startDate, end_date AS endDate,
  status, created_at AS createdAt, updated_at AS updatedAt`;

const fieldMap = {
  code: 'code',
  name: 'name',
  description: 'description',
  discountType: 'discount_type',
  discountValue: 'discount_value',
  maxDiscount: 'max_discount',
  minOrderValue: 'min_order_value',
  usageLimit: 'usage_limit',
  usageLimitPerUser: 'usage_limit_per_user',
  startDate: 'start_date',
  endDate: 'end_date',
  status: 'status',
} as const;

export const listPromotions = async (): Promise<PromotionRecord[]> => {
  const [rows] = await executeProcedure<PromotionRecord[]>(pool, 'sp_promotion_listpromotions_1', []);
  return rows;
};

export const findById = async (
  promotionId: number,
  executor: Executor = pool,
  forUpdate = false,
): Promise<PromotionRecord | null> => {
  const [rows] = await executeDynamicProcedure<PromotionRecord[]>(executor, 'sp_dynamic_promotion_findbyid_1', `SELECT ${PROMOTION_COLUMNS} FROM promotions
     WHERE id = ? LIMIT 1${forUpdate ? ' FOR UPDATE' : ''}`, [promotionId]);
  return rows[0] ?? null;
};

export const findByCode = async (
  code: string,
  executor: Executor = pool,
  forUpdate = false,
): Promise<PromotionRecord | null> => {
  const [rows] = await executeDynamicProcedure<PromotionRecord[]>(executor, 'sp_dynamic_promotion_findbycode_1', `SELECT ${PROMOTION_COLUMNS} FROM promotions
     WHERE code = ? LIMIT 1${forUpdate ? ' FOR UPDATE' : ''}`, [code]);
  return rows[0] ?? null;
};

export const countUserUsages = async (
  promotionId: number,
  userId: number,
  executor: Executor = pool,
): Promise<number> => {
  const [rows] = await executeProcedure<CountRecord[]>(executor, 'sp_promotion_countuserusages_1', [promotionId, userId]);
  return rows[0]?.total ?? 0;
};

export const savePromotion = async (
  input: CreatePromotionInput | UpdatePromotionInput,
  promotionId: number | undefined,
  connection: PoolConnection,
): Promise<number> => {
  const entries = Object.entries(input).filter(
    ([key, value]) => key in fieldMap && value !== undefined,
  ) as Array<[keyof typeof fieldMap, unknown]>;
  const values = entries.map(([, value]) => value) as ExecuteValues[];
  if (promotionId === undefined) {
    const [result] = await executeDynamicProcedure<ResultSetHeader>(connection, 'sp_dynamic_promotion_savepromotion_1', `INSERT INTO promotions (${entries.map(([key]) => fieldMap[key]).join(', ')})
       VALUES (${entries.map(() => '?').join(', ')})`, values);
    return result.insertId;
  }
  await executeDynamicProcedure(connection, 'sp_dynamic_promotion_savepromotion_2', `UPDATE promotions SET ${entries.map(([key]) => `${fieldMap[key]} = ?`).join(', ')}
     WHERE id = ?`, [...values, promotionId]);
  return promotionId;
};

export const deactivatePromotion = async (
  promotionId: number,
  connection: PoolConnection,
): Promise<void> => {
  await executeProcedure(connection, 'sp_promotion_deactivatepromotion_1', [promotionId]);
};
