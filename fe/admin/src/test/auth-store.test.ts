import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { AuthUser, LoginData } from '../types/auth';

const authApiMocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
}));

const socketMocks = vi.hoisted(() => ({
  disconnectAdminSocket: vi.fn(),
}));

vi.mock('../api/authApi', () => authApiMocks);
vi.mock('../api/axiosClient', () => ({
  getApiErrorMessage: (_error: unknown, fallback: string) => fallback,
  isApiError: () => false,
}));
vi.mock('../services/socket', () => socketMocks);

import { clearAuthSession } from '../api/authSession';
import { useAuthStore } from '../stores/authStore';

const createUser = (role: AuthUser['role']): AuthUser => ({
  id: role === 'ADMIN' ? 1 : 2,
  fullName: role === 'ADMIN' ? 'DDTECH Admin' : 'Khách hàng',
  email: role === 'ADMIN' ? 'admin@ddtech.vn' : 'customer@ddtech.vn',
  phone: null,
  avatarUrl: null,
  role,
  status: 'ACTIVE',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
});

const loginData = (role: AuthUser['role']): LoginData => ({
  user: createUser(role),
  accessToken: `${role.toLowerCase()}-access`,
  refreshToken: `${role.toLowerCase()}-refresh`,
});

describe('auth store', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearAuthSession('invalid', false);
    useAuthStore.setState({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
      isSubmitting: false,
      isInitialized: true,
      error: null,
    });
  });

  it('cho phép tài khoản ADMIN đăng nhập', async () => {
    authApiMocks.login.mockResolvedValue(loginData('ADMIN'));

    await useAuthStore.getState().signIn({
      email: 'admin@ddtech.vn',
      password: 'Admin@123',
    });

    expect(useAuthStore.getState()).toMatchObject({
      isAuthenticated: true,
      accessToken: 'admin-access',
      user: { role: 'ADMIN' },
      error: null,
    });
  });

  it('chặn tài khoản CUSTOMER khỏi trang quản trị', async () => {
    authApiMocks.login.mockResolvedValue(loginData('CUSTOMER'));
    authApiMocks.logout.mockResolvedValue(undefined);

    await expect(useAuthStore.getState().signIn({
      email: 'customer@ddtech.vn',
      password: 'Customer@123',
    })).rejects.toThrow('không có quyền');

    expect(authApiMocks.logout).toHaveBeenCalledOnce();
    expect(useAuthStore.getState()).toMatchObject({
      isAuthenticated: false,
      user: null,
      accessToken: null,
    });
  });

  it('đăng xuất và xóa trạng thái phiên quản trị', async () => {
    authApiMocks.logout.mockResolvedValue(undefined);
    useAuthStore.setState({
      user: createUser('ADMIN'),
      accessToken: 'admin-access',
      isAuthenticated: true,
    });

    await useAuthStore.getState().signOut();

    expect(authApiMocks.logout).toHaveBeenCalledOnce();
    expect(socketMocks.disconnectAdminSocket).toHaveBeenCalledOnce();
    expect(useAuthStore.getState()).toMatchObject({
      isAuthenticated: false,
      user: null,
      accessToken: null,
    });
  });
});

