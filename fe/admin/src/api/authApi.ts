import type { ApiResponse } from '../types/api';
import type {
  CurrentUserData,
  LoginData,
  LoginInput,
  TokenPair,
} from '../types/auth';
import { clearAuthSession, getRefreshToken, saveTokenPair } from './authSession';
import { apiClient } from './axiosClient';

export const login = async (input: LoginInput): Promise<LoginData> => {
  const response = await apiClient.post<ApiResponse<LoginData>>(
    '/auth/login',
    input,
    { skipAuthRefresh: true },
  );
  saveTokenPair(response.data.data);
  return response.data.data;
};

export const getCurrentUser = async (): Promise<CurrentUserData> => {
  const response = await apiClient.get<ApiResponse<CurrentUserData>>('/auth/me');
  return response.data.data;
};

export const refreshTokens = async (): Promise<TokenPair> => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) throw new Error('Không có refresh token');

  const response = await apiClient.post<ApiResponse<TokenPair>>(
    '/auth/refresh-token',
    { refreshToken },
    { skipAuthRefresh: true },
  );
  saveTokenPair(response.data.data);
  return response.data.data;
};

export const logout = async (): Promise<void> => {
  const refreshToken = getRefreshToken();
  try {
    if (refreshToken) {
      await apiClient.post<ApiResponse<null>>(
        '/auth/logout',
        { refreshToken },
        { skipAuthRefresh: true },
      );
    }
  } finally {
    clearAuthSession('logout');
  }
};

export const logoutAll = async (): Promise<void> => {
  try {
    await apiClient.post<ApiResponse<{ revokedCount: number }>>('/auth/logout-all');
  } finally {
    clearAuthSession('logout');
  }
};
