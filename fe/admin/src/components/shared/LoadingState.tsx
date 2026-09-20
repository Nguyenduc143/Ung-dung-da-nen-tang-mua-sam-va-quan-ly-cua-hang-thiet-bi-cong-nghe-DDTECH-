import { Spin, Typography } from 'antd';

const { Text } = Typography;

interface LoadingStateProps {
  message?: string;
  compact?: boolean;
}

export function LoadingState({ message = 'Đang tải dữ liệu...', compact = false }: LoadingStateProps) {
  return (
    <div className={`content-loading shared-loading-state ${compact ? 'shared-loading-state--compact' : ''}`} role="status" aria-live="polite">
      <Spin size={compact ? 'default' : 'large'} />
      <Text>{message}</Text>
    </div>
  );
}
