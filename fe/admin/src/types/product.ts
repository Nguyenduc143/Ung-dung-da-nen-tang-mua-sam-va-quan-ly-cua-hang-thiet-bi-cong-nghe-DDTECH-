export type ProductStatus = 'ACTIVE' | 'INACTIVE';
export type ProductSort = 'price_asc' | 'price_desc' | 'newest' | 'best_selling' | 'rating';

export interface ProductReference {
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
  category: ProductReference;
  brand: ProductReference | null;
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

export interface ProductDetailData {
  product: Product;
  category: ProductReference;
  brand: ProductReference | null;
  specifications: Record<string, unknown> | null;
  variants: ProductVariant[];
  images: ProductImage[];
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

export interface ProductVariantInput {
  sku: string;
  variantName: string;
  attributes?: Record<string, unknown> | null;
  price: number;
  salePrice?: number | null;
  stock?: number;
  imageUrl?: string | null;
  sortOrder?: number;
  status?: ProductStatus;
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

export interface ProductImageInput {
  variantId?: number | null;
  imageUrl: string;
  altText?: string | null;
  isPrimary?: boolean;
  sortOrder?: number;
}

export interface ProductQuery {
  search?: string;
  category?: number;
  brand?: number;
  status?: ProductStatus;
  minPrice?: number;
  maxPrice?: number;
  featured?: boolean;
  new?: boolean;
  sort?: ProductSort;
  page: number;
  limit: number;
}

export interface ProductInput {
  categoryId: number;
  brandId?: number | null;
  name: string;
  slug?: string;
  sku: string;
  shortDescription?: string | null;
  description?: string | null;
  specifications?: Record<string, unknown> | null;
  price: number;
  salePrice?: number | null;
  stock?: number;
  hasVariants?: boolean;
  warrantyMonths?: number;
  weightGram?: number | null;
  isFeatured?: boolean;
  isNew?: boolean;
  status?: ProductStatus;
}
