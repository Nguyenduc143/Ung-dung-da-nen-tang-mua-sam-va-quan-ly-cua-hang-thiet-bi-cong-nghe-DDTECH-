import type { RowDataPacket } from 'mysql2/promise';

import { pool } from '../config/database';

export interface DashboardSummaryRecord extends RowDataPacket {
  totalRevenue: string | number;
  ordersCount: number;
  customerCount: number;
  productCount: number;
  todayRevenue: string | number;
  pendingOrders: number;
}

export interface RevenuePointRecord extends RowDataPacket {
  label: string;
  revenue: string | number;
  ordersCount: number;
}

export interface OrderStatusRecord extends RowDataPacket {
  status: 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPING' | 'DELIVERED' | 'CANCELLED';
  ordersCount: number;
}

export interface TopProductRecord extends RowDataPacket {
  productId: number | null;
  productName: string;
  productSku: string;
  quantitySold: string | number;
  revenue: string | number;
  ordersCount: number;
}

export interface RecentOrderRecord extends RowDataPacket {
  id: number;
  orderCode: string;
  userId: number;
  customerName: string;
  receiverName: string;
  totalAmount: string | number;
  paymentMethod: 'COD' | 'VNPAY' | 'MOMO' | 'ZALOPAY';
  paymentStatus: 'UNPAID' | 'PAID' | 'FAILED' | 'REFUNDED';
  status: 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPING' | 'DELIVERED' | 'CANCELLED';
  createdAt: Date;
}

export const getSummary = async (): Promise<DashboardSummaryRecord> => {
  const [rows] = await pool.execute<DashboardSummaryRecord[]>(
    `SELECT
       (SELECT COALESCE(SUM(total_amount), 0) FROM orders
        WHERE status = 'DELIVERED') AS totalRevenue,
       (SELECT COUNT(*) FROM orders) AS ordersCount,
       (SELECT COUNT(*) FROM users
        WHERE role = 'CUSTOMER' AND deleted_at IS NULL) AS customerCount,
       (SELECT COUNT(*) FROM products
        WHERE deleted_at IS NULL) AS productCount,
       (SELECT COALESCE(SUM(total_amount), 0) FROM orders
        WHERE status = 'DELIVERED' AND delivered_at >= CURDATE()
          AND delivered_at < CURDATE() + INTERVAL 1 DAY) AS todayRevenue,
       (SELECT COUNT(*) FROM orders WHERE status = 'PENDING') AS pendingOrders`,
  );
  return rows[0]!;
};

export const getRevenue = async (
  from: Date,
  to: Date,
  group: 'DAY' | 'MONTH',
): Promise<RevenuePointRecord[]> => {
  const labelExpression = group === 'MONTH'
    ? "DATE_FORMAT(delivered_at, '%Y-%m')"
    : "DATE_FORMAT(delivered_at, '%Y-%m-%d')";
  const [rows] = await pool.execute<RevenuePointRecord[]>(
    `SELECT ${labelExpression} AS label, COALESCE(SUM(total_amount), 0) AS revenue,
            COUNT(*) AS ordersCount
     FROM orders
     WHERE status = 'DELIVERED' AND delivered_at >= ? AND delivered_at <= ?
     GROUP BY ${labelExpression}
     ORDER BY label`,
    [from, to],
  );
  return rows;
};

export const getOrdersByStatus = async (): Promise<OrderStatusRecord[]> => {
  const [rows] = await pool.execute<OrderStatusRecord[]>(
    `SELECT status, COUNT(*) AS ordersCount
     FROM orders GROUP BY status ORDER BY status`,
  );
  return rows;
};

export const getTopProducts = async (limit: number): Promise<TopProductRecord[]> => {
  const [rows] = await pool.execute<TopProductRecord[]>(
    `SELECT MAX(oi.product_id) AS productId, MAX(oi.product_name) AS productName,
            MAX(oi.product_sku) AS productSku, SUM(oi.quantity) AS quantitySold,
            SUM(oi.subtotal) AS revenue, COUNT(DISTINCT oi.order_id) AS ordersCount
     FROM order_items oi
     INNER JOIN orders o ON o.id = oi.order_id
     WHERE o.status = 'DELIVERED'
     GROUP BY COALESCE(CONCAT('id:', oi.product_id), CONCAT('sku:', oi.product_sku))
     ORDER BY quantitySold DESC, revenue DESC, productSku
     LIMIT ?`,
    [limit],
  );
  return rows;
};

export const getRecentOrders = async (limit: number): Promise<RecentOrderRecord[]> => {
  const [rows] = await pool.execute<RecentOrderRecord[]>(
    `SELECT o.id, o.order_code AS orderCode, o.user_id AS userId,
            u.full_name AS customerName, o.receiver_name AS receiverName,
            o.total_amount AS totalAmount, o.payment_method AS paymentMethod,
            o.payment_status AS paymentStatus, o.status, o.created_at AS createdAt
     FROM orders o
     INNER JOIN users u ON u.id = o.user_id
     ORDER BY o.created_at DESC, o.id DESC
     LIMIT ?`,
    [limit],
  );
  return rows;
};
