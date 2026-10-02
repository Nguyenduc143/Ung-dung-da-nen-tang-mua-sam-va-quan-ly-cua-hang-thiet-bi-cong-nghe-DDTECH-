import type { InventoryTransactionType } from './inventory';
import type { OrderStatus, PaymentMethod, PaymentStatus } from './order';

export interface ReportRange { from: string; to: string }
export interface ReportPagination { page: number; limit: number; total: number; totalPages: number }
export type ReportGroupBy = 'DAY' | 'MONTH';
export type ReportKind = 'revenue' | 'orders' | 'products' | 'inventory';
export type ReportFormat = 'csv' | 'xlsx';

export interface RevenueReportPoint {
  period: string;
  revenue: number;
  ordersCount: number;
  subtotal: number;
  shippingFee: number;
  discountAmount: number;
}

export interface RevenueReportData {
  revenueDefinition: 'DELIVERED';
  range: ReportRange;
  groupBy: ReportGroupBy;
  summary: {
    revenue: number;
    ordersCount: number;
    subtotal: number;
    shippingFee: number;
    discountAmount: number;
  };
  points: RevenueReportPoint[];
}

export interface OrderReportItem {
  id: number;
  orderCode: string;
  userId: number;
  customerName: string;
  customerEmail: string;
  receiverName: string;
  receiverPhone: string;
  subtotal: number;
  shippingFee: number;
  discountAmount: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  createdAt: string;
  deliveredAt: string | null;
}

export interface OrderReportData {
  range: ReportRange;
  orders: OrderReportItem[];
  pagination: ReportPagination;
}

export interface ProductReportItem {
  productId: number | null;
  productName: string;
  productSku: string;
  categoryName: string | null;
  brandName: string | null;
  quantitySold: number;
  grossRevenue: number;
  ordersCount: number;
  averagePrice: number;
}

export interface ProductReportData {
  revenueDefinition: 'DELIVERED_ITEM_GROSS';
  range: ReportRange;
  products: ProductReportItem[];
}

export interface InventoryReportItem {
  id: number;
  productId: number;
  productName: string;
  productSku: string;
  variantId: number | null;
  variantName: string | null;
  variantSku: string | null;
  type: InventoryTransactionType;
  quantity: number;
  stockAfter: number;
  referenceType: string | null;
  referenceId: number | null;
  note: string | null;
  createdBy: number | null;
  createdByName: string | null;
  createdAt: string;
}

export interface InventoryReportData {
  range: ReportRange;
  transactions: InventoryReportItem[];
  pagination: ReportPagination;
}

export interface ReportDateQuery { from: string; to: string }
export interface ReportExportFile { blob: Blob; fileName: string }
