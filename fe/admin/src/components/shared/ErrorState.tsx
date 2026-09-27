import { ReloadOutlined } from '@ant-design/icons';
import { Alert, Button } from 'antd';
import type { ReactNode } from 'react';

interface ErrorStateProps {
  message: ReactNode;
  description?: ReactNode;
  onRetry?: () => void;
  retrying?: boolean;
}

export function ErrorState({ message, description, onRetry, retrying }: ErrorStateProps) {
  return (
    <Alert
      className="content-alert"
      type="error"
      showIcon
      message={message}
      description={description}
      action={onRetry ? <Button size="small" icon={<ReloadOutlined />} loading={retrying} onClick={onRetry}>Thử lại</Button> : undefined}
    />
  );
}
