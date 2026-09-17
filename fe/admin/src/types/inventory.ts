import type { ProductStatus } from './product';

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface InventoryVariant {
  id: number;
  productId: number;
  sku: string;
  variantName: string;
  stock: number;
  soldCount: number;
  status: ProductStatus;
  updatedAt: string;
}

export interface InventoryProduct {
  id: number;
  name: string;
  slug: string;
  sku: string;
  stock: number;
  soldCount: number;
  hasVariants: boolean;
  status: ProductStatus;
  variants: InventoryVariant[];
  updatedAt: string;
}

export interface InventoryListData {
  products: InventoryProduct[];
  pagination: Pagination;
}

export interface InventoryQuery {
  page: number;
  limit: number;
  search?: string;
  status?: ProductStatus;
}

export interface InventoryReference {
  id: number;
  name: string;
  sku: string;
}

export interface LowStockItem {
  product: InventoryReference;
  variant: InventoryReference | null;
  stock: number;
}

export interface LowStockData {
  threshold: number;
  items: LowStockItem[];
}

export type InventoryTransactionType =
  | 'IMPORT'
  | 'SALE'
  | 'RETURN'
  | 'ADJUSTMENT'
  | 'CANCEL_ORDER';

export interface InventoryTransaction {
  id: number;
  product: InventoryReference;
  variant: InventoryReference | null;
  type: InventoryTransactionType;
  quantity: number;
  stockAfter: number;
  referenceType: string | null;
  referenceId: number | null;
  note: string | null;
  createdBy: { id: number; fullName: string | null } | null;
  createdAt: string;
}

export interface InventoryTransactionData {
  transactions: InventoryTransaction[];
  pagination: Pagination;
}

export interface InventoryTransactionQuery {
  page: number;
  limit: number;
  productId?: number;
  variantId?: number;
  createdBy?: number;
  type?: InventoryTransactionType;
  dateFrom?: string;
  dateTo?: string;
}

export interface InventoryChangeInput {
  productId: number;
  variantId?: number | null;
  quantity: number;
  note?: string | null;
}

export interface InventoryChangeResult {
  transaction: InventoryTransaction;
  stock: {
    productId: number;
    variantId: number | null;
    productStock: number;
    variantStock: number | null;
  };
}
