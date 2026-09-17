import {
  BellOutlined,
  HomeOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
} from '@ant-design/icons';
import {
  Avatar,
  Badge,
  Breadcrumb,
  Button,
  Dropdown,
  Layout,
  Menu,
  Space,
  Typography,
  type MenuProps,
} from 'antd';
import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';

import { adminMenuItems, adminNavigation, getRouteTitle } from '../../config/adminNavigation';
import { useAuthStore } from '../../stores/authStore';

const { Header, Content, Sider } = Layout;
const { Text } = Typography;

export function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const user = useAuthStore((state) => state.user);
  const signOut = useAuthStore((state) => state.signOut);
  const isSubmitting = useAuthStore((state) => state.isSubmitting);
  const location = useLocation();
  const navigate = useNavigate();
  const pageTitle = getRouteTitle(location.pathname);
  const selectedMenuKey = adminNavigation.find((item) => (
    location.pathname === item.path || location.pathname.startsWith(`${item.path}/`)
  ))?.path;

  const handleLogout = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'identity',
      disabled: true,
      label: (
        <div className="user-menu-identity">
          <Text strong>{user?.fullName}</Text>
          <Text type="secondary">{user?.email}</Text>
        </div>
      ),
    },
    { type: 'divider' },
    {
      key: 'logout',
      danger: true,
      icon: <LogoutOutlined />,
      label: 'Đăng xuất',
      disabled: isSubmitting,
      onClick: () => void handleLogout(),
    },
  ];

  return (
    <Layout className="admin-layout">
      <Sider
        className="admin-sider"
        width={250}
        collapsedWidth={72}
        collapsible
        collapsed={collapsed}
        trigger={null}
        breakpoint="lg"
        onBreakpoint={(broken) => setCollapsed(broken)}
      >
        <Link className="admin-brand" to="/dashboard" aria-label="DDTech Admin - Tổng quan">
          <span className="admin-brand-mark">D</span>
          {!collapsed && <span className="admin-brand-name">DDTECH <b>ADMIN</b></span>}
        </Link>

        <Menu
          className="admin-menu"
          theme="dark"
          mode="inline"
          items={adminMenuItems}
          selectedKeys={selectedMenuKey ? [selectedMenuKey] : []}
          onClick={({ key }) => navigate(key)}
        />

        <div className="sider-footer">
          <div className="sider-user">
            <Avatar src={user?.avatarUrl} icon={<UserOutlined />} />
            {!collapsed && (
              <div>
                <Text>{user?.fullName}</Text>
                <Text>{user?.role}</Text>
              </div>
            )}
          </div>
        </div>
      </Sider>

      <Layout className="admin-main">
        <Header className="admin-header">
          <Space size={14}>
            <Button
              className="collapse-button"
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed((value) => !value)}
              aria-label={collapsed ? 'Mở rộng thanh điều hướng' : 'Thu gọn thanh điều hướng'}
            />
            <div className="header-title">
              <Text type="secondary">DDTech Admin</Text>
              <Text strong>{pageTitle}</Text>
            </div>
          </Space>

          <Space size={10}>
            <Link className="notification-button" to="/notifications" aria-label="Mở thông báo">
              <Badge dot={false}>
                <BellOutlined />
              </Badge>
            </Link>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" trigger={['click']}>
              <Button className="user-menu-button" type="text">
                <Avatar size={32} src={user?.avatarUrl} icon={<UserOutlined />} />
                <span className="header-user-name">{user?.fullName}</span>
              </Button>
            </Dropdown>
          </Space>
        </Header>

        <Content className="admin-content-shell">
          <Breadcrumb
            className="admin-breadcrumb"
            items={[
              { title: <Link to="/dashboard"><HomeOutlined /> Tổng quan</Link> },
              ...(location.pathname === '/dashboard' ? [] : [{ title: pageTitle }]),
            ]}
          />
          <div className="admin-content">
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}
