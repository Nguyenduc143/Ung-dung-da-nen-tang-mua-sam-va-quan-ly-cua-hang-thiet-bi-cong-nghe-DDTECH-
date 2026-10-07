import type {
  ApiResponse,
  AuthUser,
  CurrentUserData,
  ForgotPasswordData,
  ForgotPasswordInput,
  LoginData,
  LoginInput,
  LogoutAllData,
  RegisterData,
  RegistrationEmailData,
  RegisterInput,
  RegistrationEmailInput,
  ResetPasswordInput,
  TokenPair,
  VerifyRegistrationInput,
} from '@/types';
import { apiClient, refreshAuthSession } from './axiosClient';

export const login = async (input: LoginInput): Promise<LoginData> => {
  const response = await apiClient.post<ApiResponse<LoginData>>('/auth/login', input, {
    skipAuthRefresh: true,
  });
  return response.data.data;
};

export const register = async (input: RegisterInput): Promise<RegisterData> => {
  const response = await apiClient.post<ApiResponse<RegisterData>>('/auth/register', input, {
    skipAuthRefresh: true,
  });
  return response.data.data;
};

export const resendRegistrationCode = async (
  input: RegistrationEmailInput,
): Promise<RegistrationEmailData> => {
  const response = await apiClient.post<ApiResponse<RegistrationEmailData>>(
    '/auth/resend-registration-code',
    input,
    { skipAuthRefresh: true },
  );
  return response.data.data;
};

export const verifyRegistration = async (input: VerifyRegistrationInput): Promise<void> => {
  await apiClient.post<ApiResponse<null>>('/auth/verify-registration', input, {
    skipAuthRefresh: true,
  });
};

export const forgotPassword = async (
  input: ForgotPasswordInput,
): Promise<ForgotPasswordData> => {
  const response = await apiClient.post<ApiResponse<ForgotPasswordData>>(
    '/auth/forgot-password',
    input,
    { skipAuthRefresh: true },
  );
  return response.data.data;
};

export const resetPassword = async (input: ResetPasswordInput): Promise<void> => {
  await apiClient.post<ApiResponse<null>>('/auth/reset-password', input, {
    skipAuthRefresh: true,
  });
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
