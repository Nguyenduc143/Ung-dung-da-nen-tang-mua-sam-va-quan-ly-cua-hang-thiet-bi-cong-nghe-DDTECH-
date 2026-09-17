import {
  AppstoreOutlined,
  BellOutlined,
  DashboardOutlined,
  DatabaseOutlined,
  PercentageOutlined,
  ShoppingCartOutlined,
  ShoppingOutlined,
  StarOutlined,
  TagsOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import type { ReactNode } from 'react';

export interface AdminNavigationItem {
  path: string;
  label: string;
  icon: ReactNode;
}

export const adminNavigation: AdminNavigationItem[] = [
  { path: '/dashboard', label: 'Tổng quan', icon: <DashboardOutlined /> },
  { path: '/categories', label: 'Danh mục', icon: <AppstoreOutlined /> },
  { path: '/brands', label: 'Thương hiệu', icon: <TagsOutlined /> },
  { path: '/products', label: 'Sản phẩm', icon: <ShoppingOutlined /> },
  { path: '/inventory', label: 'Tồn kho', icon: <DatabaseOutlined /> },
  { path: '/orders', label: 'Đơn hàng', icon: <ShoppingCartOutlined /> },
  { path: '/users', label: 'Người dùng', icon: <TeamOutlined /> },
  { path: '/promotions', label: 'Khuyến mãi', icon: <PercentageOutlined /> },
  { path: '/reviews', label: 'Đánh giá', icon: <StarOutlined /> },
  { path: '/notifications', label: 'Thông báo', icon: <BellOutlined /> },
];

export const adminMenuItems: MenuProps['items'] = adminNavigation.map((item) => ({
  key: item.path,
  icon: item.icon,
  label: item.label,
}));

export const getRouteTitle = (pathname: string): string => (
  adminNavigation.find((item) => pathname === item.path || pathname.startsWith(`${item.path}/`))
    ?.label ?? 'Trang quản trị'
);
