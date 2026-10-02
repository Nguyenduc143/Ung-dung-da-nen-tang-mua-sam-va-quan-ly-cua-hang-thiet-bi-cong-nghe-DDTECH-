import type { CatalogReference, ProductStatus } from './catalog';

export interface AddCartItemInput {
  productId: number;
  variantId?: number | null;
  quantity: number;
}

export interface UpdateCartItemInput {
  quantity: number;
}

export interface CartItem {
  id: number;
  quantity: number;
  product: {
    id: number;
    name: string;
    slug: string;
    sku: string;
    price: number;
    salePrice: number | null;
    stock: number;
    hasVariants: boolean;
    ratingAvg: number;
    reviewCount: number;
    status: ProductStatus;
  };
  variant: {
    id: number;
    variantName: string;
    sku: string;
    attributes: Record<string, unknown> | null;
    price: number;
    salePrice: number | null;
    stock: number;
    status: ProductStatus;
  } | null;
  imageUrl: string | null;
  currentPrice: number;
  lineTotal: number;
  availableStock: number;
  isAvailable: boolean;
  hasSufficientStock: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CartData {
  cart: {
    id: number;
    userId: number;
    createdAt: string;
    updatedAt: string;
  };
  items: CartItem[];
  summary: {
    totalItems: number;
    subtotal: number;
  };
}

export interface FavoriteProduct {
  id: number;
  name: string;
  slug: string;
  sku: string;
  shortDescription: string | null;
  price: number;
  salePrice: number | null;
  stock: number;
  hasVariants: boolean;
  ratingAvg: number;
  reviewCount: number;
  imageUrl: string | null;
  category: CatalogReference;
  brand: CatalogReference | null;
}

export interface FavoriteItem {
  id: number;
  createdAt: string;
  product: FavoriteProduct;
}

export interface FavoriteListData {
  favorites: FavoriteItem[];
}

export type PaymentMethod = 'COD' | 'VNPAY' | 'MOMO' | 'ZALOPAY';
export type PaymentStatus = 'UNPAID' | 'PAID' | 'FAILED' | 'REFUNDED';
export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'SHIPPING'
  | 'DELIVERED'
  | 'CANCELLED';

export interface ShippingMethod {
  id: number;
  code: string;
  name: string;
  description: string | null;
  baseFee: number;
  freeThreshold: number | null;
  estimatedDaysMin: number;
  estimatedDaysMax: number;
}

export interface PromotionValidationData {
  promotion: {
    id: number;
    code: string;
    name: string;
    description: string | null;
    discountType: 'PERCENT' | 'FIXED';
    discountValue: number;
    maxDiscount: number | null;
    minOrderValue: number;
  };
  subtotal: number;
  discountAmount: number;
  totalAfterDiscount: number;
}

export interface CheckoutInput {
  addressId: number;
  cartItemIds: number[];
  shippingMethodId: number;
  promotionCode?: string | null;
  paymentMethod: PaymentMethod;
  note?: string | null;
}

export interface CheckoutOrder {
  id: number;
  orderCode: string;
  subtotal: number;
  shippingFee: number;
  discountAmount: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
}

export interface CheckoutResult {
  order: CheckoutOrder;
  items: Array<{
    id: number;
    productId: number | null;
    productName: string;
    quantity: number;
    subtotal: number;
  }>;
}

export interface CustomerOrder {
  id: number;
  orderCode: string;
  userId: number;
  customer: { id: number; fullName: string; email: string; phone: string | null };
  receiverName: string;
  receiverPhone: string;
  shippingAddress: string;
  shippingMethod: { id: number; code: string | null; name: string | null } | null;
  promotionId: number | null;
  promotionCode: string | null;
  subtotal: number;
  shippingFee: number;
  discountAmount: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  note: string | null;
  cancelReason: string | null;
  confirmedAt: string | null;
  deliveredAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: number;
  productId: number | null;
  variantId: number | null;
  productName: string;
  productSku: string;
  productImage: string | null;
  variantName: string | null;
  originalPrice: number;
  price: number;
  quantity: number;
  subtotal: number;
  createdAt: string;
  reviewId?: number | null;
  isReviewed?: boolean;
}

export interface OrderListItem extends CustomerOrder {
  items: OrderItem[];
  previewItem: OrderItem | null;
  itemCount: number;
  totalQuantity: number;
}

export interface OrderPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface OrderListData {
  orders: CustomerOrder[];
  pagination: OrderPagination;
}

export interface OrderDetailData {
  order: CustomerOrder;
  items: OrderItem[];
  statusHistory: Array<{
    id: number;
    fromStatus: OrderStatus | null;
    toStatus: OrderStatus;
    changedBy: number | null;
    changedByName: string | null;
    note: string | null;
    createdAt: string;
  }>;
}

export interface CustomerOrderQuery {
  page?: number;
  limit?: number;
  status?: OrderStatus;
}

export interface CustomerOrderListData {
  orders: OrderListItem[];
  pagination: OrderPagination;
}

export interface PaymentRecord {
  id: number;
  orderId: number;
  method: PaymentMethod;
  status: PaymentStatus;
  amount: number;
  transactionCode: string | null;
  gatewayResponse: unknown;
  paidAt: string | null;
  refundedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePaymentData {
  payment: PaymentRecord;
  created: boolean;
  paymentUrl?: string;
  expiresAt?: string;
}

export interface PaymentDetailData {
  order: {
    id: number;
    orderCode: string;
    totalAmount: number;
    paymentMethod: PaymentMethod;
    paymentStatus: PaymentStatus;
    orderStatus: OrderStatus;
  };
  payment: PaymentRecord;
}
