import { Navigate, Outlet } from 'react-router-dom';

import { useAuthStore } from '../../stores/authStore';
import { AuthLoadingScreen } from './AuthLoadingScreen';

export function GuestRoute() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);

  if (isLoading) return <AuthLoadingScreen />;
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Outlet />;
}
