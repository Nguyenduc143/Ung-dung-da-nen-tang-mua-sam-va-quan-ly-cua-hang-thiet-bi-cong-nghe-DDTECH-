import * as dashboardRepository from '../repositories/dashboard.repository';
import * as inventoryService from './inventory.service';
import { AppError } from '../utils/app-error';
import type { RevenueQuery } from '../validators/dashboard.validator';

const ORDER_STATUSES = [
  'PENDING',
  'CONFIRMED',
  'PROCESSING',
  'SHIPPING',
  'DELIVERED',
  'CANCELLED',
] as const;

const pad = (value: number) => String(value).padStart(2, '0');

const formatDay = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const formatMonth = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;

const startOfDay = (date: Date) => {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
};

const endOfDay = (date: Date) => {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
};

const parseDate = (value: string): Date => {
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year!, month! - 1, day!);
  if (
    date.getFullYear() !== year
    || date.getMonth() !== month! - 1
    || date.getDate() !== day
  ) {
    throw new AppError(422, `Ngày ${value} không hợp lệ`);
  }
  return date;
};

interface RevenueRange {
  period: '7d' | '30d' | '12m' | 'custom';
  from: Date;
  to: Date;
  groupBy: 'DAY' | 'MONTH';
}

const resolveRevenueRange = (query: RevenueQuery): RevenueRange => {
  if (query.from && query.to) {
    const from = startOfDay(parseDate(query.from));
    const to = endOfDay(parseDate(query.to));
    if (from > to) throw new AppError(422, 'Ngày bắt đầu phải trước hoặc bằng ngày kết thúc');
    const days = Math.floor((startOfDay(to).getTime() - from.getTime()) / 86400000) + 1;
    if (days > 366) throw new AppError(422, 'Khoảng thống kê không được vượt quá 366 ngày');
    return { period: 'custom', from, to, groupBy: 'DAY' };
  }

  const period = query.period ?? '7d';
  const today = new Date();
  if (period === '12m') {
    const from = new Date(today.getFullYear(), today.getMonth() - 11, 1);
    const to = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
    return { period, from, to, groupBy: 'MONTH' };
  }

  const from = startOfDay(today);
  from.setDate(from.getDate() - (period === '30d' ? 29 : 6));
  return { period, from, to: endOfDay(today), groupBy: 'DAY' };
};

const buildLabels = (range: RevenueRange): string[] => {
  const labels: string[] = [];
  const cursor = new Date(range.from);
  if (range.groupBy === 'MONTH') {
    while (cursor <= range.to) {
      labels.push(formatMonth(cursor));
      cursor.setMonth(cursor.getMonth() + 1, 1);
    }
    return labels;
  }
  while (cursor <= range.to) {
    labels.push(formatDay(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return labels;
};

export const getSummary = async () => {
  const summary = await dashboardRepository.getSummary();
  return {
    revenueDefinition: 'DELIVERED',
    totalRevenue: Number(summary.totalRevenue),
    ordersCount: Number(summary.ordersCount),
    customerCount: Number(summary.customerCount),
    productCount: Number(summary.productCount),
    todayRevenue: Number(summary.todayRevenue),
    pendingOrders: Number(summary.pendingOrders),
  };
};

export const getRevenue = async (query: RevenueQuery) => {
  const range = resolveRevenueRange(query);
  const records = await dashboardRepository.getRevenue(range.from, range.to, range.groupBy);
  const values = new Map(records.map((record) => [record.label, record]));
  const points = buildLabels(range).map((label) => {
    const record = values.get(label);
    return {
      label,
      revenue: Number(record?.revenue ?? 0),
      ordersCount: Number(record?.ordersCount ?? 0),
    };
  });
  return {
    revenueDefinition: 'DELIVERED',
    period: range.period,
    from: formatDay(range.from),
    to: formatDay(range.to),
    groupBy: range.groupBy,
    totalRevenue: points.reduce((total, point) => total + point.revenue, 0),
    ordersCount: points.reduce((total, point) => total + point.ordersCount, 0),
    points,
  };
};

export const getOrdersByStatus = async () => {
  const records = await dashboardRepository.getOrdersByStatus();
  const counts = new Map(records.map((record) => [record.status, Number(record.ordersCount)]));
  const statuses = ORDER_STATUSES.map((status) => ({ status, ordersCount: counts.get(status) ?? 0 }));
  return {
    total: statuses.reduce((total, item) => total + item.ordersCount, 0),
    statuses,
  };
};

export const getTopProducts = async (limit: number) => ({
  revenueDefinition: 'DELIVERED',
  products: (await dashboardRepository.getTopProducts(limit)).map((product) => ({
    productId: product.productId,
    name: product.productName,
    sku: product.productSku,
    quantitySold: Number(product.quantitySold),
    revenue: Number(product.revenue),
    ordersCount: Number(product.ordersCount),
  })),
});

export const getRecentOrders = async (limit: number) => ({
  orders: (await dashboardRepository.getRecentOrders(limit)).map((order) => ({
    id: order.id,
    orderCode: order.orderCode,
    userId: order.userId,
    customerName: order.customerName,
    receiverName: order.receiverName,
    totalAmount: Number(order.totalAmount),
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    status: order.status,
    createdAt: order.createdAt,
  })),
});

export const getLowStock = (threshold: number) => inventoryService.listLowStock(threshold);
