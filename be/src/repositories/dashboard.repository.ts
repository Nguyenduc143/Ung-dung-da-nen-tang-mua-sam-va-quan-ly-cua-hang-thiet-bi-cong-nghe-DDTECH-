import type { RowDataPacket } from 'mysql2/promise';

import { executeDynamicProcedure, executeProcedure, pool } from '../config/database';

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
  const [rows] = await executeProcedure<DashboardSummaryRecord[]>(pool, 'sp_dashboard_getsummary_1', []);
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
  const [rows] = await executeDynamicProcedure<RevenuePointRecord[]>(pool, 'sp_dynamic_dashboard_getrevenue_1', `SELECT ${labelExpression} AS label, COALESCE(SUM(total_amount), 0) AS revenue,
            COUNT(*) AS ordersCount
     FROM orders
     WHERE status = 'DELIVERED' AND delivered_at >= ? AND delivered_at <= ?
     GROUP BY ${labelExpression}
     ORDER BY label`, [from, to]);
  return rows;
};

export const getOrdersByStatus = async (): Promise<OrderStatusRecord[]> => {
  const [rows] = await executeProcedure<OrderStatusRecord[]>(pool, 'sp_dashboard_getordersbystatus_1', []);
  return rows;
};

export const getTopProducts = async (limit: number): Promise<TopProductRecord[]> => {
  const [rows] = await executeProcedure<TopProductRecord[]>(pool, 'sp_dashboard_gettopproducts_1', [limit]);
  return rows;
};

export const getRecentOrders = async (limit: number): Promise<RecentOrderRecord[]> => {
  const [rows] = await executeProcedure<RecentOrderRecord[]>(pool, 'sp_dashboard_getrecentorders_1', [limit]);
  return rows;
};
