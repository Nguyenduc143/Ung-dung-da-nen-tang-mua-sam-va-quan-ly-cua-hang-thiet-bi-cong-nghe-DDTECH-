import type { NavigatorScreenParams } from '@react-navigation/native';

export type CatalogFilterValue = number | string;

export interface ProductListParams {
  title?: string;
  search?: string;
  category?: CatalogFilterValue;
  brand?: CatalogFilterValue;
  minPrice?: number;
  maxPrice?: number;
  sort?: 'newest' | 'best_selling' | 'price_asc' | 'price_desc' | 'rating';
  featured?: boolean;
  isNew?: boolean;
}

export type AuthStackParamList = {
  Login: { registeredEmail?: string; passwordReset?: boolean } | undefined;
  Register: undefined;
  VerifyRegistration: { email: string; developmentCode?: string };
  ForgotPassword: undefined;
  ResetPassword: { email: string; developmentCode?: string };
};

export type MainTabParamList = {
  HomeTab: undefined;
  CategoriesTab: undefined;
  CartTab: undefined;
  OrdersTab: undefined;
  AccountTab: undefined;
};

export type CustomerStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabParamList> | undefined;
  ProductList: ProductListParams | undefined;
  ProductDetail: { productId: number };
  Search: { query?: string } | undefined;
  Favorites: undefined;
  AddressList: {
    selectionMode?: boolean;
    selectedAddressId?: number;
    cartItemIds?: number[];
  } | undefined;
  AddressForm: { addressId?: number } | undefined;
  Checkout: { addressId?: number; cartItemIds?: number[] } | undefined;
  OrderDetail: { orderId: number };
  OrderReviewProducts: { orderId: number; orderCode: string };
  Notifications: undefined;
  Reviews: { productId: number };
  WriteReview: {
    productId: number;
    orderId?: number;
    reviewId?: number;
    review?: {
      id: number;
      rating: number;
      comment: string | null;
      images: string[] | null;
    };
  };
  EditProfile: undefined;
  ChangePassword: undefined;
};

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList> | undefined;
  Customer: NavigatorScreenParams<CustomerStackParamList> | undefined;
};
