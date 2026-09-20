import {
  ArrowLeftOutlined,
  LockOutlined,
  MailOutlined,
  PhoneOutlined,
  SafetyCertificateOutlined,
  UnlockOutlined,
  UserOutlined,
} from '@ant-design/icons';
import {
  App as AntApp,
  Avatar,
  Button,
  Card,
  Descriptions,
  Result,
  Space,
  Spin,
  Tag,
  Typography,
} from 'antd';
import dayjs from 'dayjs';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { getApiErrorMessage } from '../api/axiosClient';
import * as userApi from '../api/userApi';
import { useAuthStore } from '../stores/authStore';
import type { UserStatus } from '../types/auth';
import type { AdminUser, UserGender } from '../types/user';

const { Paragraph, Text, Title } = Typography;
const genderLabels: Record<UserGender, string> = { MALE: 'Nam', FEMALE: 'Nữ', OTHER: 'Khác' };

const initials = (name: string) => name.trim().split(/\s+/).slice(-2).map((part) => part[0]).join('').toUpperCase();

export function UserDetailPage() {
  const { message, modal } = AntApp.useApp();
  const navigate = useNavigate();
  const params = useParams<{ id: string }>();
  const userId = Number(params.id);
  const currentAdminId = useAuthStore((state) => state.user?.id);
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [changing, setChanging] = useState(false);

  const loadUser = useCallback(async () => {
    if (!Number.isInteger(userId) || userId <= 0) {
      setError('ID người dùng không hợp lệ.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await userApi.getUser(userId);
      setUser(data.user);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Không thể tải thông tin người dùng.'));
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { void loadUser(); }, [loadUser]);

  const changeStatus = async (nextStatus: UserStatus) => {
    setChanging(true);
    try {
      const data = await userApi.updateUserStatus(userId, nextStatus);
      setUser(data.user);
      message.success(nextStatus === 'LOCKED' ? 'Đã khóa tài khoản.' : 'Đã mở khóa tài khoản.');
    } catch (requestError) {
      message.error(getApiErrorMessage(requestError, 'Không thể cập nhật trạng thái tài khoản.'));
    } finally {
      setChanging(false);
    }
  };

  const requestStatusChange = () => {
    if (!user) return;
    if (user.status === 'LOCKED') {
      void changeStatus('ACTIVE');
      return;
    }
    modal.confirm({
      title: 'Khóa tài khoản này?',
      content: `${user.fullName} sẽ không thể đăng nhập; các phiên đăng nhập hiện tại cũng bị thu hồi.`,
      okText: 'Khóa tài khoản',
      cancelText: 'Hủy',
      okButtonProps: { danger: true },
      icon: <LockOutlined />,
      onOk: () => changeStatus('LOCKED'),
    });
  };

  if (loading) {
    return <div className="content-loading"><Spin size="large" /><Text>Đang tải thông tin người dùng...</Text></div>;
  }

  if (error || !user) {
    return (
      <Result
        status="error"
        title="Không thể hiển thị người dùng"
        subTitle={error ?? 'Không tìm thấy tài khoản.'}
        extra={[
          <Button key="back" onClick={() => navigate('/users')}>Về danh sách</Button>,
          <Button key="retry" type="primary" onClick={() => void loadUser()}>Thử lại</Button>,
        ]}
      />
    );
  }

  const isSelf = user.id === currentAdminId;

  return (
    <section aria-labelledby="user-detail-title">
      <div className="page-heading page-heading--actions">
        <div>
          <Text className="eyebrow">CHI TIẾT TÀI KHOẢN</Text>
          <Title id="user-detail-title" level={2}>{user.fullName}</Title>
          <Paragraph>Thông tin hồ sơ và trạng thái truy cập hệ thống.</Paragraph>
        </div>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/users')}>Danh sách người dùng</Button>
      </div>

      <div className="user-detail-grid">
        <Card className="form-section-card user-profile-card" bordered={false}>
          <div className="user-profile-header">
            <Avatar size={92} src={user.avatarUrl || undefined} icon={!user.fullName ? <UserOutlined /> : undefined}>{user.fullName ? initials(user.fullName) : null}</Avatar>
            <div>
              <Title level={3}>{user.fullName}</Title>
              <Space wrap>
                <Tag color={user.role === 'ADMIN' ? 'blue' : 'default'}>{user.role === 'ADMIN' ? 'Quản trị viên' : 'Khách hàng'}</Tag>
                <Tag color={user.status === 'ACTIVE' ? 'success' : 'error'}>{user.status === 'ACTIVE' ? 'Đang hoạt động' : 'Đã khóa'}</Tag>
              </Space>
            </div>
          </div>
          <div className="user-contact-list">
            <span><MailOutlined /> {user.email}</span>
            <span><PhoneOutlined /> {user.phone || 'Chưa có số điện thoại'}</span>
          </div>
        </Card>

        <Card className="form-section-card" bordered={false} title="Thông tin hồ sơ">
          <Descriptions column={{ xs: 1, sm: 2 }} bordered size="small">
            <Descriptions.Item label="ID">#{user.id}</Descriptions.Item>
            <Descriptions.Item label="Giới tính">{user.gender ? genderLabels[user.gender] : 'Chưa cập nhật'}</Descriptions.Item>
            <Descriptions.Item label="Ngày sinh">{user.dateOfBirth ? dayjs(user.dateOfBirth).format('DD/MM/YYYY') : 'Chưa cập nhật'}</Descriptions.Item>
            <Descriptions.Item label="Đăng nhập cuối">{user.lastLoginAt ? dayjs(user.lastLoginAt).format('HH:mm, DD/MM/YYYY') : 'Chưa đăng nhập'}</Descriptions.Item>
            <Descriptions.Item label="Ngày tạo">{dayjs(user.createdAt).format('HH:mm, DD/MM/YYYY')}</Descriptions.Item>
            <Descriptions.Item label="Cập nhật cuối">{dayjs(user.updatedAt).format('HH:mm, DD/MM/YYYY')}</Descriptions.Item>
          </Descriptions>
        </Card>

        <Card className="form-section-card user-access-card" bordered={false} title={<span><SafetyCertificateOutlined /> Quyền truy cập</span>}>
          <div>
            <Text strong>{user.status === 'ACTIVE' ? 'Tài khoản đang được phép đăng nhập' : 'Tài khoản đang bị khóa'}</Text>
            <Paragraph>{user.status === 'ACTIVE' ? 'Khóa tài khoản sẽ thu hồi các phiên đăng nhập hiện tại.' : 'Mở khóa để người dùng có thể đăng nhập trở lại.'}</Paragraph>
          </div>
          <Button
            danger={user.status === 'ACTIVE'}
            type={user.status === 'LOCKED' ? 'primary' : 'default'}
            icon={user.status === 'ACTIVE' ? <LockOutlined /> : <UnlockOutlined />}
            loading={changing}
            disabled={isSelf && user.status === 'ACTIVE'}
            onClick={requestStatusChange}
          >
            {isSelf && user.status === 'ACTIVE' ? 'Không thể tự khóa' : user.status === 'ACTIVE' ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
          </Button>
        </Card>
      </div>
    </section>
  );
}
