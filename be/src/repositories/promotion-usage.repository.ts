import type { PoolConnection,ResultSetHeader } from 'mysql2/promise';
import { executeProcedure } from '../config/database';

export const createPromotionUsage = async (
  connection: PoolConnection,
  promotionId: number,
  userId: number,
  orderId: number,
  discountAmount: string,
): Promise<void> => {
  await executeProcedure(connection, 'sp_order_createpromotionusage_1', [promotionId, userId, orderId, discountAmount]);
  await executeProcedure(connection, 'sp_order_createpromotionusage_2', [promotionId]);
};

export const releasePromotionUsage = async (
  connection: PoolConnection,
  promotionId: number,
  orderId: number,
): Promise<void> => {
  const [result] = await executeProcedure<ResultSetHeader>(connection, 'sp_order_releasepromotionusage_1', [promotionId, orderId]);
  if (result.affectedRows > 0) {
    await executeProcedure(connection, 'sp_order_releasepromotionusage_2', [promotionId]);
  }
};
