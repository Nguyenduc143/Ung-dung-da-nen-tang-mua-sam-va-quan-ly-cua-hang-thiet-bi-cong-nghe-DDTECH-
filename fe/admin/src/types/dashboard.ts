import type { LowStockData } from './inventory';
import type { OrderStatus, PaymentMethod, PaymentStatus } from './order';

export interface DashboardSummary {
  revenueDefinition: 'DELIVERED';
  totalRevenue: number;
  ordersCount: number;
  customerCount: number;
  productCount: number;
  todayRevenue: number;
  pendingOrders: number;
}

export type RevenuePeriod = '7d' | '30d' | '12m';

export interface RevenueQuery {
  period?: RevenuePeriod;
  from?: string;
  to?: string;
}

export interface RevenuePoint {
  label: string;
  revenue: number;
  ordersCount: number;
}

export interface DashboardRevenue {
  revenueDefinition: 'DELIVERED';
  period: RevenuePeriod | 'custom';
  from: string;
  to: string;
  groupBy: 'DAY' | 'MONTH';
  totalRevenue: number;
  ordersCount: number;
  points: RevenuePoint[];
}

export interface DashboardOrderStatusItem {
  status: OrderStatus;
  ordersCount: number;
}

export interface DashboardOrdersByStatus {
  total: number;
  statuses: DashboardOrderStatusItem[];
}

export interface DashboardTopProduct {
  productId: number | null;
  name: string;
  sku: string;
  quantitySold: number;
  revenue: number;
  ordersCount: number;
}

export interface DashboardTopProducts {
  revenueDefinition: 'DELIVERED';
  products: DashboardTopProduct[];
}

export interface DashboardRecentOrder {
  id: number;
  orderCode: string;
  userId: number;
  customerName: string;
  receiverName: string;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  createdAt: string;
}

export interface DashboardRecentOrders {
  orders: DashboardRecentOrder[];
}

export type DashboardLowStock = LowStockData;
