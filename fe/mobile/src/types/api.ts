export interface ApiResponse<T> {
  success: true;
  message: string;
  data: T;
  errors?: unknown;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  data: null;
  errors?: unknown;
}

export type ApiValidationErrors = Record<string, string[]>;

export interface PaginatedData<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
