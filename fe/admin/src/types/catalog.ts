export type CatalogStatus = 'ACTIVE' | 'HIDDEN';
export type AttributeInputType = 'TEXT' | 'NUMBER' | 'SELECT';

export interface Category {
  id: number;
  name: string;
  slug: string;
  parentId: number | null;
  description: string | null;
  imageUrl: string | null;
  sortOrder: number;
  status: CatalogStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryInput {
  name: string;
  slug?: string;
  parentId?: number | null;
  description?: string | null;
  imageUrl?: string | null;
  sortOrder?: number;
  status?: CatalogStatus;
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

export interface BrandInput {
  name: string;
  slug?: string;
  logoUrl?: string | null;
  description?: string | null;
  status?: CatalogStatus;
}

export interface CategoryAttribute {
  id: number;
  categoryId: number;
  attrKey: string;
  attrName: string;
  unit: string | null;
  inputType: AttributeInputType;
  options: string[] | null;
  isFilterable: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryAttributeInput {
  attrKey: string;
  attrName: string;
  unit?: string | null;
  inputType?: AttributeInputType;
  options?: string[] | null;
  isFilterable?: boolean;
  sortOrder?: number;
}
