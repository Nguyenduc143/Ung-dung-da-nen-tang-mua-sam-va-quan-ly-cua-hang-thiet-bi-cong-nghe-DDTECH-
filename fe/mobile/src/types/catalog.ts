export type CatalogStatus = 'ACTIVE' | 'HIDDEN';
export type ProductStatus = 'ACTIVE' | 'INACTIVE';
export type ProductSort = 'price_asc' | 'price_desc' | 'newest' | 'best_selling' | 'rating';

export interface Category {
  id: number;
  parentId: number | null;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  sortOrder: number;
  status: CatalogStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryAttribute {
  id: number;
  categoryId: number;
  attrKey: string;
  attrName: string;
  unit: string | null;
  inputType: 'TEXT' | 'NUMBER' | 'SELECT';
  options: string[] | null;
  isFilterable: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryDetail extends Category {
  attributes: CategoryAttribute[];
}

export interface Brand {
  id: number;
  name: string;
  slug: string;
  logoUrl: string | null;
  description: string | null;
  status: CatalogStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CatalogReference {
  id: number;
  name: string;
  slug: string;
}

export interface Product {
  id: number;
  categoryId: number;
  brandId: number | null;
  name: string;
  slug: string;
  sku: string;
  shortDescription: string | null;
  description: string | null;
  specifications: Record<string, unknown> | null;
  price: number;
  salePrice: number | null;
  stock: number;
  soldCount: number;
  hasVariants: boolean;
  warrantyMonths: number;
  weightGram: number | null;
  ratingAvg: number;
  reviewCount: number;
  viewCount: number;
  isFeatured: boolean;
  isNew: boolean;
  status: ProductStatus;
  primaryImageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProductListItem extends Product {
  category: CatalogReference;
  brand: CatalogReference | null;
}

export interface ProductVariant {
  id: number;
  productId: number;
  sku: string;
  variantName: string;
  attributes: Record<string, unknown> | null;
  price: number;
  salePrice: number | null;
  stock: number;
  soldCount: number;
  imageUrl: string | null;
  sortOrder: number;
  status: ProductStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ProductImage {
  id: number;
  productId: number;
  variantId: number | null;
  imageUrl: string;
  altText: string | null;
  isPrimary: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface ProductDetailData {
  product: Product;
  category: CatalogReference;
  brand: CatalogReference | null;
  specifications: Record<string, unknown> | null;
  variants: ProductVariant[];
  images: ProductImage[];
}

export interface ProductReview {
  id: number;
  user: {
    id: number;
    fullName: string;
    avatarUrl: string | null;
  };
  product: {
    id: number;
    name: string;
  };
  orderId: number;
  rating: number;
  comment: string | null;
  images: string[] | null;
  isVerifiedPurchase: boolean;
  adminReply: string | null;
  repliedAt: string | null;
  status: 'PENDING' | 'APPROVED' | 'HIDDEN';
  createdAt: string;
  updatedAt: string;
}

export interface ProductReviewData {
  reviews: ProductReview[];
  pagination: ProductPagination;
}

export interface CreateReviewInput {
  rating: number;
  comment?: string | null;
  images?: string[] | null;
}

export interface UpdateReviewInput {
  rating?: number;
  comment?: string | null;
  images?: string[] | null;
}

export interface ProductPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ProductListData {
  products: ProductListItem[];
  pagination: ProductPagination;
}

export interface ProductQuery {
  search?: string;
  category?: number | string;
  includeDescendants?: boolean;
  brand?: number | string;
  minPrice?: number;
  maxPrice?: number;
  sort?: ProductSort;
  featured?: boolean;
  new?: boolean;
  page?: number;
  limit?: number;
}
