import type {
  ApiResponse,
  AuthUser,
  CurrentUserData,
  LoginData,
  LoginInput,
  LogoutAllData,
  RegisterData,
  RegisterInput,
  TokenPair,
} from '@/types';
import { apiClient, refreshAuthSession } from './axiosClient';

export const login = async (input: LoginInput): Promise<LoginData> => {
  const response = await apiClient.post<ApiResponse<LoginData>>('/auth/login', input, {
    skipAuthRefresh: true,
  });
  return response.data.data;
};

export const register = async (input: RegisterInput): Promise<AuthUser> => {
  const response = await apiClient.post<ApiResponse<RegisterData>>('/auth/register', input, {
    skipAuthRefresh: true,
  });
  return response.data.data.user;
};

export const getCurrentUser = async (): Promise<AuthUser> => {
  const response = await apiClient.get<ApiResponse<CurrentUserData>>('/auth/me');
  return response.data.data.user;
};

export const refreshToken = (): Promise<TokenPair> => refreshAuthSession();

export const logout = async (refreshToken: string): Promise<void> => {
  await apiClient.post<ApiResponse<null>>(
    '/auth/logout',
    { refreshToken },
    { skipAuthRefresh: true },
  );
};

export const logoutAll = async (): Promise<number> => {
  const response = await apiClient.post<ApiResponse<LogoutAllData>>('/auth/logout-all');
  return response.data.data.revokedCount;
};
