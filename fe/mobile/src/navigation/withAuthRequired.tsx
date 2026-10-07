import type { ComponentType } from 'react';

import { EmptyState } from '@/components';
import { useAuthStore } from '@/stores';
import { requireLogin } from './authNavigation';

/** Private screens and their effects only mount after login. */
export function withAuthRequired<Props extends object>(Screen: ComponentType<Props>) {
  function AuthRequiredScreen(props: Props) {
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    if (!isAuthenticated) {
      return (
        <EmptyState
          actionLabel="Đăng nhập"
          description="Đăng nhập để mua hàng và quản lý thông tin của bạn. Bạn vẫn có thể xem sản phẩm mà không cần tài khoản."
          icon="person-circle-outline"
          onAction={() => { requireLogin(); }}
          style={{ flex: 1 }}
          title="Bạn chưa đăng nhập"
        />
      );
    }
    return <Screen {...props} />;
  }
  AuthRequiredScreen.displayName = `AuthRequired(${Screen.displayName ?? Screen.name})`;
  return AuthRequiredScreen;
}
