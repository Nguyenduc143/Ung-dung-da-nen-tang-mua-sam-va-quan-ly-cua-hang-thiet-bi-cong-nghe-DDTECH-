import { create } from 'zustand';

import * as authApi from '@/api/auth.api';
import {
  clearAuthSession,
  getStoredTokenPair,
  saveTokenPair,
  subscribeToAuthSessionCleared,
  subscribeToAuthTokensChanged,
} from '@/api/authSession';
import { getApiErrorMessage } from '@/api/axiosClient';
import type { AuthUser, LoginInput, RegisterInput, TokenPair } from '@/types';
import { useBadgeStore } from './badgeStore';
import { useFavoriteStore } from './favoriteStore';
import { useCartStore } from './cartStore';
import { useAddressStore } from './addressStore';

export interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<AuthUser>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<number>;
  restoreSession: () => Promise<void>;
  refreshSession: () => Promise<TokenPair>;
  setUser: (user: AuthUser | null) => void;
  clearError: () => void;
}

const expiredSessionMessage = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';

const isAllowedCustomer = (user: AuthUser): boolean => (
  user.role === 'CUSTOMER' && user.status === 'ACTIVE'
);

const getAccessDeniedMessage = (user: AuthUser): string => {
  if (user.status !== 'ACTIVE') return 'Tài khoản đã bị khóa hoặc ngừng hoạt động.';
  return 'Tài khoản quản trị không thể đăng nhập vào ứng dụng khách hàng.';
};

const toTokenState = (tokens: TokenPair | null) => ({
  accessToken: tokens?.accessToken ?? null,
  refreshToken: tokens?.refreshToken ?? null,
});

let restoreRequest: Promise<void> | null = null;

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isInitialized: false,
  isLoading: true,
  isSubmitting: false,
  error: null,

  login: async (input) => {
    if (get().isSubmitting) return;
    set({ isSubmitting: true, error: null });

    try {
      const data = await authApi.login(input);
      if (!isAllowedCustomer(data.user)) {
        await authApi.logout(data.refreshToken).catch(() => undefined);
        throw new Error(getAccessDeniedMessage(data.user));
      }

      await saveTokenPair(data);
      set({
        user: data.user,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        isAuthenticated: true,
        isInitialized: true,
        error: null,
      });
    } catch (error) {
      const message = getApiErrorMessage(error, 'Không thể đăng nhập. Vui lòng thử lại.');
      set({ user: null, isAuthenticated: false, error: message });
      throw error;
    } finally {
      set({ isSubmitting: false });
    }
  },

  register: async (input) => {
    if (get().isSubmitting) throw new Error('Yêu cầu đăng ký đang được xử lý');
    set({ isSubmitting: true, error: null });

    try {
      const user = await authApi.register(input);
      if (!isAllowedCustomer(user)) throw new Error(getAccessDeniedMessage(user));
      return user;
    } catch (error) {
      const message = getApiErrorMessage(error, 'Không thể đăng ký. Vui lòng thử lại.');
      set({ error: message });
      throw error;
    } finally {
      set({ isSubmitting: false });
    }
  },

  logout: async () => {
    if (get().isSubmitting) return;
    set({ isSubmitting: true, error: null });

    const storedTokens = await getStoredTokenPair();
    try {
      if (storedTokens?.refreshToken) await authApi.logout(storedTokens.refreshToken);
    } catch {
      // Local logout must still succeed when the token is already invalid or the network is unavailable.
    } finally {
      await clearAuthSession('logout', false).catch(() => undefined);
      useBadgeStore.getState().resetBadges();
      useFavoriteStore.getState().resetFavorites();
      useCartStore.getState().resetCart();
      useAddressStore.getState().resetAddresses();
      set({
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
        isInitialized: true,
        isLoading: false,
        isSubmitting: false,
        error: null,
      });
    }
  },

  logoutAll: async () => {
    if (get().isSubmitting) throw new Error('Yêu cầu đăng xuất đang được xử lý');
    set({ isSubmitting: true, error: null });

    try {
      const revokedCount = await authApi.logoutAll();
      await clearAuthSession('logout', false);
      useBadgeStore.getState().resetBadges();
      useFavoriteStore.getState().resetFavorites();
      useCartStore.getState().resetCart();
      useAddressStore.getState().resetAddresses();
      set({
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
        isInitialized: true,
        isLoading: false,
        error: null,
      });
      return revokedCount;
    } catch (error) {
      const message = getApiErrorMessage(error, 'Không thể đăng xuất khỏi các thiết bị.');
      set({ error: message });
      throw error;
    } finally {
      set({ isSubmitting: false });
    }
  },

  restoreSession: async () => {
    const currentState = get();
    if (
      currentState.isInitialized
      && (currentState.isAuthenticated || !currentState.accessToken)
    ) return;
    if (restoreRequest) return restoreRequest;

    restoreRequest = (async () => {
      set({ isLoading: true, error: null });
      const tokens = await getStoredTokenPair();

      if (!tokens) {
        set({ isLoading: false, isInitialized: true });
        return;
      }

      set(toTokenState(tokens));

      try {
        const user = await authApi.getCurrentUser();
        if (!isAllowedCustomer(user)) {
          await clearAuthSession('invalid', false);
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            error: getAccessDeniedMessage(user),
          });
          return;
        }

        const currentTokens = await getStoredTokenPair();
        set({
          user,
          ...toTokenState(currentTokens),
          isAuthenticated: true,
          error: null,
        });
      } catch (error) {
        set({
          user: null,
          isAuthenticated: false,
          error: getApiErrorMessage(error, 'Không thể khôi phục phiên đăng nhập.'),
        });
      } finally {
        set({ isLoading: false, isInitialized: true });
      }
    })().finally(() => {
      restoreRequest = null;
    });

    return restoreRequest;
  },

  refreshSession: async () => {
    set({ isLoading: true, error: null });
    try {
      const tokens = await authApi.refreshToken();
      set({ ...toTokenState(tokens), error: null });
      return tokens;
    } catch (error) {
      const message = getApiErrorMessage(error, expiredSessionMessage);
      set({ error: message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  setUser: (user) => set({ user, isAuthenticated: Boolean(user) }),
  clearError: () => set({ error: null }),
}));

subscribeToAuthTokensChanged((tokens) => {
  useAuthStore.setState(toTokenState(tokens));
});

subscribeToAuthSessionCleared((reason) => {
  useBadgeStore.getState().resetBadges();
  useFavoriteStore.getState().resetFavorites();
  useCartStore.getState().resetCart();
  useAddressStore.getState().resetAddresses();
  useAuthStore.setState({
    user: null,
    accessToken: null,
    refreshToken: null,
    isAuthenticated: false,
    isInitialized: true,
    isLoading: false,
    isSubmitting: false,
    error: reason === 'expired' ? expiredSessionMessage : null,
  });
});
