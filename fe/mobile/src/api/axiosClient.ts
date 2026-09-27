import axios, {
  AxiosError,
  AxiosHeaders,
  type InternalAxiosRequestConfig,
} from 'axios';

import { API_BASE_URL, API_TIMEOUT_MS } from '@/constants';
import type {
  ApiErrorResponse,
  ApiResponse,
  ApiValidationErrors,
  TokenPair,
} from '@/types';
import {
  clearAuthSession,
  getAccessToken,
  getRefreshToken,
  saveTokenPair,
} from './authSession';

declare module 'axios' {
  interface AxiosRequestConfig {
    skipAuthRefresh?: boolean;
  }
}

interface RetriableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
  skipAuthRefresh?: boolean;
}

const defaultHeaders = {
  Accept: 'application/json',
  'Content-Type': 'application/json',
};

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT_MS,
  headers: defaultHeaders,
});

const refreshClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT_MS,
  headers: defaultHeaders,
});

let refreshRequest: Promise<TokenPair> | null = null;

const isFormData = (value: unknown): value is FormData => (
  typeof FormData !== 'undefined' && value instanceof FormData
);

const refreshAccessToken = async (): Promise<TokenPair> => {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) throw new Error('Không tìm thấy refresh token');

  const response = await refreshClient.post<ApiResponse<TokenPair>>(
    '/auth/refresh-token',
    { refreshToken },
  );
  await saveTokenPair(response.data.data);
  return response.data.data;
};

const getOrCreateRefreshRequest = (): Promise<TokenPair> => {
  refreshRequest ??= refreshAccessToken()
    .catch(async (error: unknown) => {
      await clearAuthSession('expired').catch(() => undefined);
      throw error;
    })
    .finally(() => {
      refreshRequest = null;
    });
  return refreshRequest;
};

export const refreshAuthSession = (): Promise<TokenPair> => getOrCreateRefreshRequest();

apiClient.interceptors.request.use(async (config) => {
  const headers = AxiosHeaders.from(config.headers);
  const accessToken = await getAccessToken();

  if (isFormData(config.data)) headers.delete('Content-Type');
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);

  config.headers = headers;
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorResponse>) => {
    const originalRequest = error.config as RetriableRequestConfig | undefined;
    const isUnauthorized = error.response?.status === 401;

    if (!isUnauthorized || !originalRequest || originalRequest.skipAuthRefresh) {
      return Promise.reject(error);
    }

    if (originalRequest._retry) {
      await clearAuthSession('invalid');
      return Promise.reject(error);
    }

    if (originalRequest.url?.includes('/auth/refresh-token')) {
      return Promise.reject(error);
    }

    const currentAccessToken = await getAccessToken();
    const requestHeaders = AxiosHeaders.from(originalRequest.headers);
    const requestAccessToken = requestHeaders.get('Authorization');

    // A different request may already have rotated the token while this 401 was in flight.
    if (
      currentAccessToken
      && typeof requestAccessToken === 'string'
      && requestAccessToken !== `Bearer ${currentAccessToken}`
    ) {
      originalRequest._retry = true;
      requestHeaders.set('Authorization', `Bearer ${currentAccessToken}`);
      originalRequest.headers = requestHeaders;
      return apiClient(originalRequest);
    }

    const refreshToken = await getRefreshToken();
    if (!refreshToken) return Promise.reject(error);

    originalRequest._retry = true;

    try {
      const { accessToken } = await getOrCreateRefreshRequest();
      const headers = AxiosHeaders.from(originalRequest.headers);
      headers.set('Authorization', `Bearer ${accessToken}`);
      originalRequest.headers = headers;
      return await apiClient(originalRequest);
    } catch (refreshError) {
      return Promise.reject(refreshError);
    }
  },
);

export const isApiError = (error: unknown): error is AxiosError<ApiErrorResponse> => (
  axios.isAxiosError<ApiErrorResponse>(error)
);

export const getApiErrorMessage = (
  error: unknown,
  fallback = 'Không thể kết nối đến máy chủ',
): string => {
  if (!isApiError(error)) return error instanceof Error ? error.message : fallback;
  if (error.code === AxiosError.ETIMEDOUT || error.code === AxiosError.ECONNABORTED) {
    return 'Kết nối quá thời gian. Vui lòng thử lại.';
  }
  if (!error.response) return 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra mạng.';
  return error.response.data?.message || error.message || fallback;
};

export const getApiValidationErrors = (error: unknown): ApiValidationErrors | undefined => {
  const errors = isApiError(error) ? error.response?.data?.errors : undefined;
  if (!errors || typeof errors !== 'object' || Array.isArray(errors)) return undefined;

  const validationErrors: ApiValidationErrors = {};
  for (const [field, messages] of Object.entries(errors)) {
    if (Array.isArray(messages) && messages.every((message) => typeof message === 'string')) {
      validationErrors[field] = messages;
    }
  }

  return Object.keys(validationErrors).length > 0 ? validationErrors : undefined;
};
