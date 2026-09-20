import { Tag } from 'antd';

interface StatusBadgeProps<T extends string> {
  status: T;
  labels: Record<T, string>;
  colors: Record<T, string>;
}

export function StatusBadge<T extends string>({ status, labels, colors }: StatusBadgeProps<T>) {
  return <Tag color={colors[status]}>{labels[status]}</Tag>;
}
