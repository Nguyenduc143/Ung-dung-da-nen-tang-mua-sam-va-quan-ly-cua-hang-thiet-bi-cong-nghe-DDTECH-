import {
  EyeOutlined,
  LockOutlined,
  ReloadOutlined,
  SearchOutlined,
  TeamOutlined,
  UnlockOutlined,
  UserOutlined,
} from '@ant-design/icons';
import {
  Alert,
  App as AntApp,
  Avatar,
  Button,
  Card,
  Input,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
  type TableColumnsType,
} from 'antd';
import dayjs from 'dayjs';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { getApiErrorMessage } from '../api/axiosClient';
import * as userApi from '../api/userApi';
import { useAuthStore } from '../stores/authStore';
import type { UserRole, UserStatus } from '../types/auth';
import type { AdminUser, UserQuery } from '../types/user';

const { Paragraph, Text, Title } = Typography;

const roleLabels: Record<UserRole, string> = { ADMIN: 'Quản trị viên', CUSTOMER: 'Khách hàng' };
const statusLabels: Record<UserStatus, string> = { ACTIVE: 'Đang hoạt động', LOCKED: 'Đã khóa' };

const initials = (name: string) => name.trim().split(/\s+/).slice(-2).map((part) => part[0]).join('').toUpperCase();

export function UsersPage() {
  const { message, modal } = AntApp.useApp();
  const navigate = useNavigate();
  const currentAdminId = useAuthStore((state) => state.user?.id);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [role, setRole] = useState<UserRole>();
  const [status, setStatus] = useState<UserStatus>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [changingId, setChangingId] = useState<number | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [search]);

  const query = useMemo<UserQuery>(() => ({
    page,
    limit: pageSize,
    search: debouncedSearch || undefined,
    role,
    status,
  }), [debouncedSearch, page, pageSize, role, status]);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await userApi.listUsers(query);
      setUsers(data.users);
      setTotal(data.pagination.total);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Không thể tải danh sách người dùng.'));
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => { void loadUsers(); }, [loadUsers]);

  const changeStatus = async (user: AdminUser, nextStatus: UserStatus) => {
    setChangingId(user.id);
    try {
      const data = await userApi.updateUserStatus(user.id, nextStatus);
      setUsers((current) => current.map((item) => item.id === user.id ? data.user : item));
      message.success(nextStatus === 'LOCKED' ? 'Đã khóa tài khoản.' : 'Đã mở khóa tài khoản.');
    } catch (requestError) {
      message.error(getApiErrorMessage(requestError, 'Không thể cập nhật trạng thái tài khoản.'));
    } finally {
      setChangingId(null);
    }
  };

  const requestStatusChange = (user: AdminUser) => {
    if (user.status === 'LOCKED') {
      void changeStatus(user, 'ACTIVE');
      return;
    }
    modal.confirm({
      title: 'Khóa tài khoản này?',
      content: `${user.fullName} sẽ không thể đăng nhập; các phiên đăng nhập hiện tại cũng bị thu hồi.`,
      okText: 'Khóa tài khoản',
      cancelText: 'Hủy',
      okButtonProps: { danger: true },
      icon: <LockOutlined />,
      onOk: () => changeStatus(user, 'LOCKED'),
    });
  };

  const clearFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setRole(undefined);
    setStatus(undefined);
    setPage(1);
  };

  const columns: TableColumnsType<AdminUser> = [
    {
      title: 'Người dùng', key: 'user', width: 290,
      render: (_, record) => (
        <div className="user-identity-cell">
          <Avatar size={46} src={record.avatarUrl || undefined} icon={!record.fullName ? <UserOutlined /> : undefined}>{record.fullName ? initials(record.fullName) : null}</Avatar>
          <div className="table-primary-cell"><strong>{record.fullName}</strong><span>{record.email}</span></div>
        </div>
      ),
    },
    { title: 'Điện thoại', dataIndex: 'phone', key: 'phone', width: 135, render: (value: string | null) => value || <Text type="secondary">—</Text> },
    { title: 'Vai trò', dataIndex: 'role', key: 'role', width: 125, render: (value: UserRole) => <Tag color={value === 'ADMIN' ? 'blue' : 'default'}>{roleLabels[value]}</Tag> },
    { title: 'Trạng thái', dataIndex: 'status', key: 'status', width: 135, render: (value: UserStatus) => <Tag color={value === 'ACTIVE' ? 'success' : 'error'}>{statusLabels[value]}</Tag> },
    { title: 'Đăng nhập cuối', dataIndex: 'lastLoginAt', key: 'lastLoginAt', width: 155, render: (value: string | null) => value ? dayjs(value).format('DD/MM/YYYY HH:mm') : <Text type="secondary">Chưa đăng nhập</Text> },
    { title: 'Ngày tạo', dataIndex: 'createdAt', key: 'createdAt', width: 145, render: (value: string) => dayjs(value).format('DD/MM/YYYY HH:mm') },
    {
      title: 'Thao tác', key: 'actions', width: 105, fixed: 'right',
      render: (_, record) => {
        const isSelf = record.id === currentAdminId;
        return (
          <Space size={2}>
            <Tooltip title="Xem chi tiết"><Button type="text" icon={<EyeOutlined />} onClick={() => navigate(`/users/${record.id}`)} /></Tooltip>
            <Tooltip title={isSelf ? 'Bạn không thể tự khóa tài khoản của mình' : record.status === 'ACTIVE' ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}>
              <Button
                type="text"
                danger={record.status === 'ACTIVE'}
                disabled={isSelf && record.status === 'ACTIVE'}
                loading={changingId === record.id}
                icon={record.status === 'ACTIVE' ? <LockOutlined /> : <UnlockOutlined />}
                onClick={() => requestStatusChange(record)}
              />
            </Tooltip>
          </Space>
        );
      },
    },
  ];

  return (
    <section aria-labelledby="users-title">
      <div className="page-heading">
        <Text className="eyebrow">TÀI KHOẢN HỆ THỐNG</Text>
        <Title id="users-title" level={2}>Quản lý người dùng</Title>
        <Paragraph>Tra cứu tài khoản và kiểm soát quyền truy cập hệ thống.</Paragraph>
      </div>

      {error && <Alert className="content-alert" type="error" showIcon message={error} action={<Button size="small" icon={<ReloadOutlined />} onClick={() => void loadUsers()}>Thử lại</Button>} />}

      <Card className="product-filter-card" bordered={false}>
        <div className="user-filter-grid">
          <Input allowClear value={search} prefix={<SearchOutlined />} placeholder="Tên, email hoặc số điện thoại" onChange={(event) => setSearch(event.target.value)} />
          <Select allowClear value={role} placeholder="Vai trò" options={Object.entries(roleLabels).map(([value, label]) => ({ value, label }))} onChange={(value) => { setRole(value); setPage(1); }} />
          <Select allowClear value={status} placeholder="Trạng thái" options={Object.entries(statusLabels).map(([value, label]) => ({ value, label }))} onChange={(value) => { setStatus(value); setPage(1); }} />
          <Space><Button onClick={clearFilters}>Xóa bộ lọc</Button><Button icon={<ReloadOutlined />} onClick={() => void loadUsers()}>Làm mới</Button></Space>
        </div>
      </Card>

      <Card className="management-card" bordered={false}>
        <div className="table-summary"><TeamOutlined /> {total} người dùng</div>
        <Table<AdminUser>
          rowKey="id" columns={columns} dataSource={users} loading={loading} scroll={{ x: 1150 }}
          onRow={(record) => ({ onDoubleClick: () => navigate(`/users/${record.id}`) })}
          pagination={{
            current: page, pageSize, total, showSizeChanger: true, pageSizeOptions: [10, 20, 50, 100],
            showTotal: (count) => `Tổng ${count} người dùng`,
            onChange: (nextPage, nextPageSize) => { setPage(nextPageSize === pageSize ? nextPage : 1); setPageSize(nextPageSize); },
          }}
          locale={{ emptyText: error ? 'Không có dữ liệu để hiển thị' : 'Chưa có người dùng phù hợp' }}
        />
      </Card>
    </section>
  );
}
