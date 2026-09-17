import type { PoolConnection } from 'mysql2/promise';
import { executeDynamicProcedure,executeProcedure,pool } from '../config/database';
import type {
AdminReviewQuery
} from '../validators/review.validator';
import { ReviewRecord } from './review.repository';
import { CountRecord,REVIEW_COLUMNS } from './review.shared';

export const listAdminReviews = async (query: AdminReviewQuery) => {
  const conditions: string[] = [];
  const values: Array<number | string> = [];
  if (query.productId !== undefined) {
    conditions.push('r.product_id = ?');
    values.push(query.productId);
  }
  if (query.userId !== undefined) {
    conditions.push('r.user_id = ?');
    values.push(query.userId);
  }
  if (query.rating !== undefined) {
    conditions.push('r.rating = ?');
    values.push(query.rating);
  }
  if (query.status !== undefined) {
    conditions.push('r.status = ?');
    values.push(query.status);
  }
  const where = conditions.length === 0 ? '1 = 1' : conditions.join(' AND ');
  const offset = (query.page - 1) * query.limit;
  const [reviews] = await executeDynamicProcedure<ReviewRecord[]>(pool, 'sp_dynamic_review_listadminreviews_1', `SELECT ${REVIEW_COLUMNS}
     FROM reviews r
     INNER JOIN users u ON u.id = r.user_id
     INNER JOIN products p ON p.id = r.product_id
     WHERE ${where}
     ORDER BY r.created_at DESC, r.id DESC
     LIMIT ? OFFSET ?`, [...values, query.limit, offset]);
  const [countRows] = await executeDynamicProcedure<CountRecord[]>(pool, 'sp_dynamic_review_listadminreviews_2', `SELECT COUNT(*) AS total FROM reviews r WHERE ${where}`, values);
  return { reviews, total: countRows[0]?.total ?? 0 };
};

export const updateStatus = async (
  reviewId: number,
  status: ReviewRecord['status'],
  connection: PoolConnection,
): Promise<void> => {
  await executeProcedure(connection, 'sp_review_updatestatus_1', [status, reviewId]);
};

export const replyReview = async (
  reviewId: number,
  reply: string,
  connection: PoolConnection,
): Promise<void> => {
  await executeProcedure(connection, 'sp_review_replyreview_1', [reply, reviewId]);
};
