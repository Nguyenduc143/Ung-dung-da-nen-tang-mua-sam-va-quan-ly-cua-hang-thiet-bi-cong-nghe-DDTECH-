import { Spin, Typography } from 'antd';

const { Text } = Typography;

export function AuthLoadingScreen() {
  return (
    <main className="auth-loading" aria-live="polite" aria-busy="true">
      <div className="brand-mark brand-mark--small">D</div>
      <Spin size="large" />
      <Text>Đang xác minh phiên đăng nhập...</Text>
    </main>
  );
}
