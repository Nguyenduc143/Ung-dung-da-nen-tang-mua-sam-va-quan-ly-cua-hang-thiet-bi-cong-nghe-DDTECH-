import * as authApi from '@/api/auth.api';
import { getStoredTokenPair, subscribeToAuthSessionCleared } from '@/api/authSession';
import { useAuthStore } from '@/stores/authStore';
import { getAuthenticatedUserId } from '@/stores/authIdentity';
import type { AuthUser } from '@/types';

jest.mock('@/api/auth.api', () => ({
  login: jest.fn(), logout: jest.fn(), logoutAll: jest.fn(), getCurrentUser: jest.fn(),
}));
jest.mock('@/api/authSession', () => ({
  clearAuthSession: jest.fn().mockResolvedValue(undefined),
  saveTokenPair: jest.fn().mockResolvedValue(undefined),
  getStoredTokenPair: jest.fn(),
  subscribeToAuthSessionCleared: jest.fn(),
  subscribeToAuthTokensChanged: jest.fn(),
}));
jest.mock('@/api/axiosClient', () => ({ getApiErrorMessage: (error: Error) => error.message }));
jest.mock('@/stores/cartStore', () => ({ useCartStore: { getState: () => ({ resetCart: jest.fn() }) } }));
jest.mock('@/stores/badgeStore', () => ({ useBadgeStore: { getState: () => ({ resetBadges: jest.fn() }) } }));
jest.mock('@/stores/favoriteStore', () => ({ useFavoriteStore: { getState: () => ({ resetFavorites: jest.fn() }) } }));
jest.mock('@/stores/addressStore', () => ({ useAddressStore: { getState: () => ({ resetAddresses: jest.fn() }) } }));

const sessionCleared = (subscribeToAuthSessionCleared as jest.Mock).mock.calls[0][0];
const user = { id: 7, role: 'CUSTOMER', status: 'ACTIVE' } as AuthUser;
const tokens = { accessToken: 'access', refreshToken: 'refresh' };

beforeEach(() => {
  jest.clearAllMocks();
  useAuthStore.setState({ user: null, isAuthenticated: false, isInitialized: false,
    isSubmitting: false, accessToken: null, refreshToken: null });
  (getStoredTokenPair as jest.Mock).mockResolvedValue(null);
  (authApi.logout as jest.Mock).mockResolvedValue(undefined);
});

test('profile updates and direct state changes synchronize cart identity', () => {
  useAuthStore.getState().setUser(user);
  expect(getAuthenticatedUserId()).toBe(7);
  useAuthStore.setState({ user: { ...user, id: 8 } });
  expect(getAuthenticatedUserId()).toBe(8);
  useAuthStore.getState().setUser(null);
  expect(getAuthenticatedUserId()).toBe(0);
});

test('login synchronizes authenticated identity', async () => {
  (authApi.login as jest.Mock).mockResolvedValue({ ...tokens, user });
  await useAuthStore.getState().login({ email: 'customer@example.test', password: 'test' });
  expect(getAuthenticatedUserId()).toBe(7);
});

test('restoring a saved session synchronizes authenticated identity', async () => {
  (getStoredTokenPair as jest.Mock).mockResolvedValue(tokens);
  (authApi.getCurrentUser as jest.Mock).mockResolvedValue(user);
  await useAuthStore.getState().restoreSession();
  expect(getAuthenticatedUserId()).toBe(7);
});

test('logout resets identity to guest', async () => {
  useAuthStore.getState().setUser(user);
  await useAuthStore.getState().logout();
  expect(getAuthenticatedUserId()).toBe(0);
});

test('logout from all devices resets identity to guest', async () => {
  useAuthStore.getState().setUser(user);
  (authApi.logoutAll as jest.Mock).mockResolvedValue(2);
  await useAuthStore.getState().logoutAll();
  expect(getAuthenticatedUserId()).toBe(0);
});

test('expired session resets identity to guest', () => {
  useAuthStore.getState().setUser(user);
  sessionCleared('expired');
  expect(getAuthenticatedUserId()).toBe(0);
});
