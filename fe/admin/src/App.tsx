import { Button, Result, Spin, Typography } from 'antd';
import { lazy, Suspense } from 'react';
import { Link, Navigate, Route, Routes } from 'react-router-dom';

import { GuestRoute } from './components/auth/GuestRoute';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AdminLayout } from './components/layout/AdminLayout';
import { useAuthBootstrap } from './hooks/useAuthBootstrap';

const DashboardPage = lazy(() => import('./pages/DashboardPage').then((module) => ({ default: module.DashboardPage })));
const CategoriesPage = lazy(() => import('./pages/CategoriesPage').then((module) => ({ default: module.CategoriesPage })));
const BrandsPage = lazy(() => import('./pages/BrandsPage').then((module) => ({ default: module.BrandsPage })));
const ProductFormPage = lazy(() => import('./pages/ProductFormPage').then((module) => ({ default: module.ProductFormPage })));
const ProductsPage = lazy(() => import('./pages/ProductsPage').then((module) => ({ default: module.ProductsPage })));
const InventoryPage = lazy(() => import('./pages/InventoryPage').then((module) => ({ default: module.InventoryPage })));
const OrdersPage = lazy(() => import('./pages/OrdersPage').then((module) => ({ default: module.OrdersPage })));
const OrderDetailPage = lazy(() => import('./pages/OrderDetailPage').then((module) => ({ default: module.OrderDetailPage })));
const UsersPage = lazy(() => import('./pages/UsersPage').then((module) => ({ default: module.UsersPage })));
const UserDetailPage = lazy(() => import('./pages/UserDetailPage').then((module) => ({ default: module.UserDetailPage })));
const PromotionFormPage = lazy(() => import('./pages/PromotionFormPage').then((module) => ({ default: module.PromotionFormPage })));
const PromotionsPage = lazy(() => import('./pages/PromotionsPage').then((module) => ({ default: module.PromotionsPage })));
const ReviewsPage = lazy(() => import('./pages/ReviewsPage').then((module) => ({ default: module.ReviewsPage })));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage').then((module) => ({ default: module.NotificationsPage })));
const LoginPage = lazy(() => import('./pages/LoginPage').then((module) => ({ default: module.LoginPage })));

const { Text } = Typography;

function RouteLoadingScreen() {
  return (
    <main className="auth-loading" aria-live="polite" aria-busy="true">
      <Spin size="large" />
      <Text>Đang tải trang...</Text>
    </main>
  );
}

function NotFoundPage() {
  return (
    <Result
      status="404"
      title="Không tìm thấy trang"
      subTitle="Đường dẫn bạn truy cập chưa được cấu hình."
      extra={<Button type="primary"><Link to="/dashboard">Về trang quản trị</Link></Button>}
    />
  );
}

export default function App() {
  useAuthBootstrap();

  return (
    <Suspense fallback={<RouteLoadingScreen />}>
      <Routes>
        <Route element={<GuestRoute />}>
          <Route path="/login" element={<LoginPage />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<AdminLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/categories" element={<CategoriesPage />} />
            <Route path="/brands" element={<BrandsPage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/products/create" element={<ProductFormPage />} />
            <Route path="/products/:id/edit" element={<ProductFormPage />} />
            <Route path="/inventory" element={<InventoryPage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/orders/:id" element={<OrderDetailPage />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/users/:id" element={<UserDetailPage />} />
            <Route path="/promotions" element={<PromotionsPage />} />
            <Route path="/promotions/create" element={<PromotionFormPage />} />
            <Route path="/promotions/:id/edit" element={<PromotionFormPage />} />
            <Route path="/reviews" element={<ReviewsPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Route>
      </Routes>
    </Suspense>
  );
}
