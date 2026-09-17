import axios, {
  AxiosError,
  AxiosHeaders,
  type InternalAxiosRequestConfig,
} from 'axios';

import type { ApiErrorResponse, ApiResponse } from '../types/api';
import type { TokenPair } from '../types/auth';
import {
  clearAuthSession,
  getAccessToken,
  getRefreshToken,
  saveTokenPair,
} from './authSession';

interface RetriableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
  skipAuthRefresh?: boolean;
}

const apiUrl = import.meta.env.VITE_API_URL?.replace(/\/+$/, '');

if (!apiUrl) {
  throw new Error('Thiếu biến môi trường VITE_API_URL');
}

export const apiClient = axios.create({
  baseURL: apiUrl,
  timeout: 15_000,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

const refreshClient = axios.create({
  baseURL: apiUrl,
  timeout: 15_000,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

let refreshRequest: Promise<string> | null = null;

const refreshAccessToken = async (): Promise<string> => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) throw new Error('Không có refresh token');

  const response = await refreshClient.post<ApiResponse<TokenPair>>(
    '/auth/refresh-token',
    { refreshToken },
  );
  saveTokenPair(response.data.data);
  return response.data.data.accessToken;
};

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    const headers = AxiosHeaders.from(config.headers);
    headers.set('Authorization', `Bearer ${token}`);
    config.headers = headers;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorResponse>) => {
    const originalRequest = error.config as RetriableRequestConfig | undefined;
    const canRefresh = error.response?.status === 401
      && originalRequest
      && !originalRequest._retry
      && !originalRequest.skipAuthRefresh
      && !originalRequest.url?.includes('/auth/refresh-token')
      && Boolean(getRefreshToken());

    if (!canRefresh || !originalRequest) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      refreshRequest ??= refreshAccessToken().finally(() => {
        refreshRequest = null;
      });
      const accessToken = await refreshRequest;
      const headers = AxiosHeaders.from(originalRequest.headers);
      headers.set('Authorization', `Bearer ${accessToken}`);
      originalRequest.headers = headers;
      return await apiClient(originalRequest);
    } catch (refreshError) {
      clearAuthSession('expired');
      return Promise.reject(refreshError);
    }
  },
);

export const getApiErrorMessage = (
  error: unknown,
  fallback = 'Không thể kết nối đến máy chủ',
): string => {
  if (!axios.isAxiosError<ApiErrorResponse>(error)) return fallback;
  return error.response?.data?.message || error.message || fallback;
};

export const isApiError = (error: unknown): error is AxiosError<ApiErrorResponse> => (
  axios.isAxiosError<ApiErrorResponse>(error)
);
