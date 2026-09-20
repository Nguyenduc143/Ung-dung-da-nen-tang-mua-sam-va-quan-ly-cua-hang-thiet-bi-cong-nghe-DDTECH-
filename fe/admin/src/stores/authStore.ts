import { create } from 'zustand';

import * as authApi from '../api/authApi';
import {
  clearAuthSession,
  getAccessToken,
  hasStoredSession,
  saveTokenPair,
} from '../api/authSession';
import { getApiErrorMessage, isApiError } from '../api/axiosClient';
import { disconnectAdminSocket } from '../services/socket';
import type { AuthUser, LoginInput } from '../types/auth';

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isSubmitting: boolean;
  isInitialized: boolean;
  error: string | null;
  initialize: () => Promise<void>;
  signIn: (input: LoginInput) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
  resetSession: () => void;
}

const isAllowedAdmin = (user: AuthUser): boolean => (
  user.role === 'ADMIN' && user.status === 'ACTIVE'
);

const accessDeniedMessage = (user: AuthUser): string => (
  user.status !== 'ACTIVE'
    ? 'Tài khoản quản trị đã bị khóa.'
    : 'Tài khoản này không có quyền truy cập trang quản trị.'
);

const resolveAuthError = (error: unknown): string => {
  if (isApiError(error)) {
    return getApiErrorMessage(error, 'Không thể xác thực tài khoản.');
  }
  return error instanceof Error ? error.message : 'Không thể xác thực tài khoản.';
};

let initializationRequest: Promise<void> | null = null;

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: getAccessToken(),
  isAuthenticated: false,
  isLoading: true,
  isSubmitting: false,
  isInitialized: false,
  error: null,

  initialize: async () => {
    if (get().isInitialized) return;
    if (initializationRequest) return initializationRequest;

    initializationRequest = (async () => {
      if (!hasStoredSession()) {
        set({ isLoading: false, isInitialized: true, accessToken: null });
        return;
      }

      set({ isLoading: true, error: null });
      try {
        const { user } = await authApi.getCurrentUser();
        if (!isAllowedAdmin(user)) {
          clearAuthSession('invalid');
          disconnectAdminSocket();
          set({
            user: null,
            accessToken: null,
            isAuthenticated: false,
            error: accessDeniedMessage(user),
          });
          return;
        }

        set({
          user,
          accessToken: getAccessToken(),
          isAuthenticated: true,
        });
      } catch {
        clearAuthSession('expired');
        disconnectAdminSocket();
        set({ user: null, accessToken: null, isAuthenticated: false });
      } finally {
        set({ isLoading: false, isInitialized: true });
      }
    })().finally(() => {
      initializationRequest = null;
    });

    return initializationRequest;
  },

  signIn: async (input) => {
    set({ isSubmitting: true, error: null });
    try {
      const data = await authApi.login(input);
      if (!isAllowedAdmin(data.user)) {
        const message = accessDeniedMessage(data.user);
        try {
          await authApi.logout();
        } catch {
          clearAuthSession('invalid');
        }
        throw new Error(message);
      }

      saveTokenPair(data);
      set({
        user: data.user,
        accessToken: data.accessToken,
        isAuthenticated: true,
        error: null,
      });
    } catch (error) {
      const message = resolveAuthError(error);
      set({ user: null, accessToken: null, isAuthenticated: false, error: message });
      throw error;
    } finally {
      set({ isSubmitting: false });
    }
  },

  signOut: async () => {
    set({ isSubmitting: true });
    try {
      await authApi.logout();
    } catch {
      clearAuthSession('logout');
    } finally {
      disconnectAdminSocket();
      set({
        user: null,
        accessToken: null,
        isAuthenticated: false,
        isSubmitting: false,
        error: null,
      });
    }
  },

  clearError: () => set({ error: null }),

  resetSession: () => {
    disconnectAdminSocket();
    set({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  },
}));
