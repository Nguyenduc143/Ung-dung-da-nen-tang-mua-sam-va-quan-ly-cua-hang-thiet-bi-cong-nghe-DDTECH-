export type ReviewStatus = 'PENDING' | 'APPROVED' | 'HIDDEN';

export interface ReviewUser {
  id: number;
  fullName: string;
  avatarUrl: string | null;
}

export interface ReviewProduct {
  id: number;
  name: string;
}

export interface Review {
  id: number;
  user: ReviewUser;
  product: ReviewProduct;
  orderId: number | null;
  rating: number;
  comment: string | null;
  images: string[] | null;
  isVerifiedPurchase: boolean;
  adminReply: string | null;
  repliedAt: string | null;
  status: ReviewStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ReviewListData {
  reviews: Review[];
  pagination: ReviewPagination;
}

export interface ReviewQuery {
  page: number;
  limit: number;
  productId?: number;
  userId?: number;
  rating?: number;
  status?: ReviewStatus;
}
