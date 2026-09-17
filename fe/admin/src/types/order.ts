export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'SHIPPING'
  | 'DELIVERED'
  | 'CANCELLED';

export type PaymentMethod = 'COD' | 'VNPAY' | 'MOMO' | 'ZALOPAY';
export type PaymentStatus = 'UNPAID' | 'PAID' | 'FAILED' | 'REFUNDED';

export interface OrderCustomer {
  id: number;
  fullName: string;
  email: string;
  phone: string | null;
}

export interface Order {
  id: number;
  orderCode: string;
  userId: number;
  customer: OrderCustomer;
  receiverName: string;
  receiverPhone: string;
  shippingAddress: string;
  shippingMethod: { id: number; code: string; name: string } | null;
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
}

export interface OrderStatusHistory {
  id: number;
  fromStatus: OrderStatus | null;
  toStatus: OrderStatus;
  changedBy: number | null;
  changedByName: string | null;
  note: string | null;
  createdAt: string;
}

export interface OrderDetailData {
  order: Order;
  items: OrderItem[];
  statusHistory: OrderStatusHistory[];
}

export interface OrderListData {
  orders: Order[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface OrderQuery {
  page: number;
  limit: number;
  search?: string;
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  paymentMethod?: PaymentMethod;
  userId?: number;
}

export interface UpdateOrderStatusInput {
  status: Exclude<OrderStatus, 'PENDING'>;
  note?: string | null;
}
