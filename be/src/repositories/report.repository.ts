import type { RowDataPacket } from 'mysql2/promise';

import { executeProcedure, pool } from '../config/database';

export interface RevenueReportRecord extends RowDataPacket {
  periodLabel: string;
  revenue: string | number;
  ordersCount: number;
  subtotal: string | number;
  shippingFee: string | number;
  discountAmount: string | number;
}

export interface OrderReportRecord extends RowDataPacket {
  id: number;
  orderCode: string;
  userId: number;
  customerName: string;
  customerEmail: string;
  receiverName: string;
  receiverPhone: string;
  subtotal: string | number;
  shippingFee: string | number;
  discountAmount: string | number;
  totalAmount: string | number;
  paymentMethod: 'COD' | 'VNPAY' | 'MOMO' | 'ZALOPAY';
  paymentStatus: 'UNPAID' | 'PAID' | 'FAILED' | 'REFUNDED';
  status: 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPING' | 'DELIVERED' | 'CANCELLED';
  createdAt: Date;
  deliveredAt: Date | null;
  totalRows: number;
}

export interface ProductReportRecord extends RowDataPacket {
  productId: number | null;
  productName: string;
  productSku: string;
  categoryName: string | null;
  brandName: string | null;
  quantitySold: string | number;
  grossRevenue: string | number;
  ordersCount: number;
  averagePrice: string | number;
}

export interface InventoryReportRecord extends RowDataPacket {
  id: number;
  productId: number;
  productName: string;
  productSku: string;
  variantId: number | null;
  variantName: string | null;
  variantSku: string | null;
  type: 'IMPORT' | 'SALE' | 'RETURN' | 'ADJUSTMENT' | 'CANCEL_ORDER';
  quantity: number;
  stockAfter: number;
  referenceType: string | null;
  referenceId: number | null;
  note: string | null;
  createdBy: number | null;
  createdByName: string | null;
  createdAt: Date;
  totalRows: number;
}

export const getRevenue = async (
  from: Date,
  to: Date,
  groupBy: 'DAY' | 'MONTH',
): Promise<RevenueReportRecord[]> => {
  const [rows] = await executeProcedure<RevenueReportRecord[]>(
    pool,
    'sp_report_getrevenue_1',
    [from, to, groupBy],
  );
  return rows;
};

export const getOrders = async (
  from: Date,
  to: Date,
  status: string | undefined,
  limit: number,
  offset: number,
): Promise<OrderReportRecord[]> => {
  const [rows] = await executeProcedure<OrderReportRecord[]>(
    pool,
    'sp_report_getorders_1',
    [from, to, status ?? null, limit, offset],
  );
  return rows;
};

export const getProducts = async (
  from: Date,
  to: Date,
  categoryId: number | undefined,
  brandId: number | undefined,
  limit: number,
): Promise<ProductReportRecord[]> => {
  const [rows] = await executeProcedure<ProductReportRecord[]>(
    pool,
    'sp_report_getproducts_1',
    [from, to, categoryId ?? null, brandId ?? null, limit],
  );
  return rows;
};

export const getInventory = async (
  from: Date,
  to: Date,
  type: string | undefined,
  productId: number | undefined,
  limit: number,
  offset: number,
): Promise<InventoryReportRecord[]> => {
  const [rows] = await executeProcedure<InventoryReportRecord[]>(
    pool,
    'sp_report_getinventory_1',
    [from, to, type ?? null, productId ?? null, limit, offset],
  );
  return rows;
};
