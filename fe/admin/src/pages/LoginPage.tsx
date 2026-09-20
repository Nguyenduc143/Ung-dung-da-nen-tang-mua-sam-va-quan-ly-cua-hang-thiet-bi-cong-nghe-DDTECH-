import {
  LockOutlined,
  MailOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import { Alert, Button, Card, Form, Input, Space, Typography } from 'antd';
import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { useAuthStore } from '../stores/authStore';
import type { LoginInput } from '../types/auth';

const { Paragraph, Text, Title } = Typography;

interface LoginLocationState {
  from?: string;
}

export function LoginPage() {
  const signIn = useAuthStore((state) => state.signIn);
  const isSubmitting = useAuthStore((state) => state.isSubmitting);
  const error = useAuthStore((state) => state.error);
  const clearError = useAuthStore((state) => state.clearError);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => clearError, [clearError]);

  const handleSubmit = async (values: LoginInput) => {
    try {
      await signIn({ email: values.email.trim().toLowerCase(), password: values.password });
      const requestedPath = (location.state as LoginLocationState | null)?.from;
      navigate(requestedPath?.startsWith('/') ? requestedPath : '/dashboard', { replace: true });
    } catch {
      // Store exposes a safe, user-facing error message.
    }
  };

  return (
    <main className="login-page">
      <section className="login-intro" aria-labelledby="login-title">
        <div className="brand-lockup">
          <div className="brand-mark">D</div>
          <div>
            <Text className="eyebrow">DDTECH ADMIN</Text>
            <Title id="login-title" level={1}>Điều hành cửa hàng trong một nơi.</Title>
          </div>
        </div>
        <Paragraph>
          Khu vực dành riêng cho quản trị viên DDTech. Đăng nhập để quản lý sản phẩm,
          đơn hàng, tồn kho và vận hành hệ thống.
        </Paragraph>
        <div className="security-note">
          <SafetyCertificateOutlined />
          <span>Phiên làm việc được xác minh bằng tài khoản quản trị đang hoạt động.</span>
        </div>
      </section>

      <Card className="login-card" bordered={false}>
        <Space direction="vertical" size={4} className="login-heading">
          <Text className="eyebrow">ĐĂNG NHẬP AN TOÀN</Text>
          <Title level={2}>Chào mừng trở lại</Title>
          <Paragraph>Sử dụng email và mật khẩu quản trị của bạn.</Paragraph>
        </Space>

        {error && (
          <Alert
            className="login-alert"
            type="error"
            showIcon
            message={error}
            closable
            onClose={clearError}
          />
        )}

        <Form<LoginInput>
          layout="vertical"
          requiredMark={false}
          onFinish={handleSubmit}
          disabled={isSubmitting}
          autoComplete="on"
        >
          <Form.Item
            label="Email"
            name="email"
            normalize={(value: string) => value.trim()}
            rules={[
              { required: true, message: 'Vui lòng nhập email.' },
              { type: 'email', message: 'Email không đúng định dạng.' },
              { max: 191, message: 'Email không được vượt quá 191 ký tự.' },
            ]}
          >
            <Input
              size="large"
              prefix={<MailOutlined />}
              placeholder="admin@ddtech.vn"
              autoComplete="email"
              autoFocus
            />
          </Form.Item>

          <Form.Item
            label="Mật khẩu"
            name="password"
            rules={[
              { required: true, message: 'Vui lòng nhập mật khẩu.' },
              { max: 72, message: 'Mật khẩu không được vượt quá 72 ký tự.' },
            ]}
          >
            <Input.Password
              size="large"
              prefix={<LockOutlined />}
              placeholder="Nhập mật khẩu"
              autoComplete="current-password"
            />
          </Form.Item>

          <Button
            type="primary"
            htmlType="submit"
            size="large"
            block
            loading={isSubmitting}
          >
            {isSubmitting ? 'Đang xác minh...' : 'Đăng nhập'}
          </Button>
        </Form>
      </Card>
    </main>
  );
}
