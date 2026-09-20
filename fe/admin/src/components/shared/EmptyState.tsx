import { Empty } from 'antd';
import type { ReactNode } from 'react';

interface EmptyStateProps {
  description?: ReactNode;
  compact?: boolean;
}

export function EmptyState({ description = 'Chưa có dữ liệu', compact = false }: EmptyStateProps) {
  return (
    <Empty
      className={compact ? 'shared-empty-state shared-empty-state--compact' : 'shared-empty-state'}
      image={Empty.PRESENTED_IMAGE_SIMPLE}
      description={description}
    />
  );
}
