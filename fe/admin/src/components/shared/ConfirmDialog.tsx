import { Popconfirm, type PopconfirmProps } from 'antd';
import type { ReactElement } from 'react';

interface ConfirmDialogProps extends Omit<PopconfirmProps, 'children'> {
  children: ReactElement;
}

export function ConfirmDialog({ children, ...props }: ConfirmDialogProps) {
  return <Popconfirm {...props}>{children}</Popconfirm>;
}
