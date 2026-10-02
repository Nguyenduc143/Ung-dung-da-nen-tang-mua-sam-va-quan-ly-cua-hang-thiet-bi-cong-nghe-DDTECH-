import { ApiOutlined, LockOutlined, MailOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { Alert, Button, Checkbox, Form, Input, Typography } from 'antd';
import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { useAuthStore } from '../stores/authStore';
import type { LoginInput } from '../types/auth';
import '../login.css';

const { Text } = Typography;

interface LoginLocationState { from?: string }

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
      await signIn({
        email: values.email.trim().toLowerCase(),
        password: values.password,
        remember: values.remember,
      });
      const requestedPath = (location.state as LoginLocationState | null)?.from;
      navigate(requestedPath?.startsWith('/') ? requestedPath : '/dashboard', { replace: true });
    } catch {
      // Store exposes a safe, user-facing error message.
    }
  };

  return (
    <main className="login-page">
      <div className="login-page-glow" aria-hidden="true" />
      <div className="login-shell">
        <section className="login-intro" aria-labelledby="login-title">
          <div className="login-brand">
            <div className="login-brand-symbol" aria-hidden="true">
              <span className="brand-petal brand-petal--left" />
              <span className="brand-petal brand-petal--center" />
              <span className="brand-petal brand-petal--right" />
              <ApiOutlined />
            </div>
            <h1 id="login-title">DDTECH ADMIN PANEL</h1>
            <p>Quản lý cửa hàng công nghệ của bạn</p>
          </div>
          <p className="login-intro-footer">Hệ thống quản trị và bán hàng kỹ thuật số</p>
        </section>

        <section className="login-form-panel" aria-label="Đăng nhập quản trị">
          <div className="circuit circuit--top" aria-hidden="true" />
          <div className="circuit circuit--bottom" aria-hidden="true" />
          <div className="login-form-content">
            <div className="login-form-heading">
              <Text>TRUY CẬP HỆ THỐNG</Text>
              <h2>Đăng nhập quản trị</h2>
            </div>

            {error && (
              <Alert className="login-alert" type="error" showIcon message={error} closable onClose={clearError} />
            )}

            <Form<LoginInput>
              layout="vertical"
              requiredMark={false}
              onFinish={handleSubmit}
              disabled={isSubmitting}
              autoComplete="on"
              initialValues={{ remember: true }}
            >
              <Form.Item
                label="Tài khoản"
                name="email"
                normalize={(value: string) => value.trim()}
                rules={[
                  { required: true, message: 'Vui lòng nhập email.' },
                  { type: 'email', message: 'Email không đúng định dạng.' },
                  { max: 191, message: 'Email không được vượt quá 191 ký tự.' },
                ]}
              >
                <Input size="large" prefix={<MailOutlined />} placeholder="admin@ddtech.vn" autoComplete="email" autoFocus />
              </Form.Item>

              <Form.Item
                label="Mật khẩu"
                name="password"
                rules={[
                  { required: true, message: 'Vui lòng nhập mật khẩu.' },
                  { max: 72, message: 'Mật khẩu không được vượt quá 72 ký tự.' },
                ]}
              >
                <Input.Password size="large" prefix={<LockOutlined />} placeholder="Nhập mật khẩu" autoComplete="current-password" />
              </Form.Item>

              <div className="login-options">
                <Form.Item name="remember" valuePropName="checked" noStyle>
                  <Checkbox>Ghi nhớ tôi</Checkbox>
                </Form.Item>
              </div>

              <Button className="login-submit" type="primary" htmlType="submit" size="large" block loading={isSubmitting}>
                {isSubmitting ? 'Đang xác minh...' : 'Đăng nhập'}
              </Button>
            </Form>

            <div className="login-security">
              <SafetyCertificateOutlined />
              Kết nối được bảo vệ và chỉ dành cho quản trị viên
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
