import { beforeEach, describe, expect, it, vi } from 'vitest';

const apiClientMocks = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
}));

vi.mock('../api/axiosClient', () => ({ apiClient: apiClientMocks }));

import { logout, refreshTokens } from '../api/authApi';
import {
  getAccessToken,
  getRefreshToken,
  hasStoredSession,
  saveTokenPair,
} from '../api/authSession';

describe('auth API session', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('làm mới và lưu cặp token mới', async () => {
    saveTokenPair({ accessToken: 'old-access', refreshToken: 'old-refresh' });
    apiClientMocks.post.mockResolvedValue({
      data: {
        data: { accessToken: 'new-access', refreshToken: 'new-refresh' },
      },
    });

    await expect(refreshTokens()).resolves.toEqual({
      accessToken: 'new-access',
      refreshToken: 'new-refresh',
    });
    expect(apiClientMocks.post).toHaveBeenCalledWith(
      '/auth/refresh-token',
      { refreshToken: 'old-refresh' },
      { skipAuthRefresh: true },
    );
    expect(getAccessToken()).toBe('new-access');
    expect(getRefreshToken()).toBe('new-refresh');
  });

  it('gửi refresh token khi logout rồi xóa session local', async () => {
    saveTokenPair({ accessToken: 'access', refreshToken: 'refresh' });
    apiClientMocks.post.mockResolvedValue({ data: { data: null } });

    await logout();

    expect(apiClientMocks.post).toHaveBeenCalledWith(
      '/auth/logout',
      { refreshToken: 'refresh' },
      { skipAuthRefresh: true },
    );
    expect(hasStoredSession()).toBe(false);
  });
});

