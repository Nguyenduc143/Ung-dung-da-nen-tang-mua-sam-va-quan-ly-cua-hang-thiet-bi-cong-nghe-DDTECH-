import type { ExecuteValues } from 'mysql2';
import type { PoolConnection,ResultSetHeader,RowDataPacket } from 'mysql2/promise';
import { executeDynamicProcedure,executeProcedure,pool } from '../config/database';
import type {
CreateReviewInput,
ProductReviewQuery,
UpdateReviewInput
} from '../validators/review.validator';
import { CountRecord,REVIEW_COLUMNS } from './review.shared';

export type Executor = typeof pool | PoolConnection;

export interface ReviewRecord extends RowDataPacket {
  id: number;
  userId: number;
  productId: number;
  orderId: number | null;
  rating: number;
  comment: string | null;
  images: unknown;
  isVerifiedPurchase: number;
  adminReply: string | null;
  repliedAt: Date | null;
  status: 'PENDING' | 'APPROVED' | 'HIDDEN';
  createdAt: Date;
  updatedAt: Date;
  userName: string;
  userAvatarUrl: string | null;
  productName: string;
}

export interface OrderReferenceRecord extends RowDataPacket {
  id: number;
}

export const listProductReviews = async (
  productId: number,
  query: ProductReviewQuery,
) => {
  const ratingFilter = query.rating === undefined ? '' : ' AND r.rating = ?';
  const values = query.rating === undefined ? [productId] : [productId, query.rating];
  const offset = (query.page - 1) * query.limit;
  const [reviews] = await executeDynamicProcedure<ReviewRecord[]>(pool, 'sp_dynamic_review_listproductreviews_1', `SELECT ${REVIEW_COLUMNS}
     FROM reviews r
     INNER JOIN users u ON u.id = r.user_id
     INNER JOIN products p ON p.id = r.product_id
     WHERE r.product_id = ? AND r.status = 'APPROVED'${ratingFilter}
     ORDER BY r.created_at DESC, r.id DESC
     LIMIT ? OFFSET ?`, [...values, query.limit, offset]);
  const [countRows] = await executeDynamicProcedure<CountRecord[]>(pool, 'sp_dynamic_review_listproductreviews_2', `SELECT COUNT(*) AS total FROM reviews r
     WHERE r.product_id = ? AND r.status = 'APPROVED'${ratingFilter}`, values);
  return { reviews, total: countRows[0]?.total ?? 0 };
};

export const findReview = async (
  reviewId: number,
  userId?: number,
  executor: Executor = pool,
  forUpdate = false,
): Promise<ReviewRecord | null> => {
  const ownerFilter = userId === undefined ? '' : ' AND r.user_id = ?';
  const values = userId === undefined ? [reviewId] : [reviewId, userId];
  const [rows] = await executeDynamicProcedure<ReviewRecord[]>(executor, 'sp_dynamic_review_findreview_1', `SELECT ${REVIEW_COLUMNS}
     FROM reviews r
     INNER JOIN users u ON u.id = r.user_id
     INNER JOIN products p ON p.id = r.product_id
     WHERE r.id = ?${ownerFilter} LIMIT 1${forUpdate ? ' FOR UPDATE' : ''}`, values);
  return rows[0] ?? null;
};

export const findDeliveredPurchase = async (
  userId: number,
  productId: number,
  connection: PoolConnection,
): Promise<number | null> => {
  const [rows] = await executeProcedure<OrderReferenceRecord[]>(connection, 'sp_review_finddeliveredpurchase_1', [userId, productId]);
  return rows[0]?.id ?? null;
};

export const createReview = async (
  userId: number,
  productId: number,
  orderId: number | null,
  input: CreateReviewInput,
  connection: PoolConnection,
): Promise<number> => {
  const [result] = await executeProcedure<ResultSetHeader>(connection, 'sp_review_createreview_1', [
      userId,
      productId,
      orderId,
      input.rating,
      input.comment ?? null,
      input.images === undefined || input.images === null ? null : JSON.stringify(input.images),
      orderId === null ? 0 : 1,
    ]);
  return result.insertId;
};

export const updateReview = async (
  reviewId: number,
  input: UpdateReviewInput,
  connection: PoolConnection,
): Promise<void> => {
  const fieldMap: Record<keyof UpdateReviewInput, string> = {
    rating: 'rating',
    comment: 'comment',
    images: 'images',
  };
  const entries = Object.entries(input) as Array<[keyof UpdateReviewInput, unknown]>;
  const values = entries.map(([key, value]) => (
    key === 'images' && value !== null ? JSON.stringify(value) : value
  )) as ExecuteValues[];
  await executeDynamicProcedure(connection, 'sp_dynamic_review_updatereview_1', `UPDATE reviews SET ${entries.map(([key]) => `${fieldMap[key]} = ?`).join(', ')}
     WHERE id = ?`, [...values, reviewId]);
};

export const deleteReview = async (
  reviewId: number,
  connection: PoolConnection,
): Promise<void> => {
  await executeProcedure(connection, 'sp_review_deletereview_1', [reviewId]);
};

export const syncProductRating = async (
  productId: number,
  connection: PoolConnection,
): Promise<void> => {
  await executeProcedure(connection, 'sp_review_syncproductrating_1', [productId]);
};
