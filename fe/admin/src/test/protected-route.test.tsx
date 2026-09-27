import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

interface RouteAuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
}

const routeAuth = vi.hoisted(() => ({
  current: { isAuthenticated: false, isLoading: false } as RouteAuthState,
}));

vi.mock('../stores/authStore', () => ({
  useAuthStore: (selector: (state: RouteAuthState) => unknown) => selector(routeAuth.current),
}));

import { ProtectedRoute } from '../components/auth/ProtectedRoute';

const renderRoutes = () => render(
  <MemoryRouter initialEntries={['/dashboard']}>
    <Routes>
      <Route path="/login" element={<div>Trang đăng nhập</div>} />
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<div>Trang quản trị</div>} />
      </Route>
    </Routes>
  </MemoryRouter>,
);

describe('ProtectedRoute', () => {
  beforeEach(() => {
    routeAuth.current = { isAuthenticated: false, isLoading: false };
  });

  it('chuyển guest về trang đăng nhập', () => {
    renderRoutes();
    expect(screen.getByText('Trang đăng nhập')).toBeInTheDocument();
    expect(screen.queryByText('Trang quản trị')).not.toBeInTheDocument();
  });

  it('cho phiên ADMIN đã xác thực vào trang quản trị', () => {
    routeAuth.current = { isAuthenticated: true, isLoading: false };
    renderRoutes();
    expect(screen.getByText('Trang quản trị')).toBeInTheDocument();
  });
});

