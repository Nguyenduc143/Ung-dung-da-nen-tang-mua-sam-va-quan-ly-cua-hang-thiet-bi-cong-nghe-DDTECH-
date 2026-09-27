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
  paymentStatus: 'UNPAID' | 'PAID' | 'FAILED' | 'REFUNDED';
  status: 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPING' | 'DELIVERED' | 'CANCELLED';
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
