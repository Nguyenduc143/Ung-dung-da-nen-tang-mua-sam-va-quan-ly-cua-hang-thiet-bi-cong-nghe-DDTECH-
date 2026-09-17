import type { RowDataPacket } from 'mysql2/promise';

export interface CountRecord extends RowDataPacket {
  total: number;
}

export const REVIEW_COLUMNS = `r.id, r.user_id AS userId, r.product_id AS productId,
  r.order_id AS orderId, r.rating, r.comment, r.images,
  r.is_verified_purchase AS isVerifiedPurchase, r.admin_reply AS adminReply,
  r.replied_at AS repliedAt, r.status, r.created_at AS createdAt,
  r.updated_at AS updatedAt, u.full_name AS userName,
  u.avatar_url AS userAvatarUrl, p.name AS productName`;
