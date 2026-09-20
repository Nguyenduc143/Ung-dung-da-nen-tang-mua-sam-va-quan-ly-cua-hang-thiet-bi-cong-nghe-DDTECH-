import type { ReactNode } from 'react';
import { createElement } from 'react';
import {
  BellOutlined,
  CreditCardOutlined,
  GiftOutlined,
  ShoppingCartOutlined,
  StarOutlined,
} from '@ant-design/icons';

import type { AdminNotification, NotificationType } from '../types/notification';

export const notificationTypeLabels: Record<NotificationType, string> = {
  ORDER: 'Đơn hàng',
  PAYMENT: 'Thanh toán',
  PROMOTION: 'Khuyến mãi',
  REVIEW: 'Đánh giá',
  SYSTEM: 'Hệ thống',
};

export const notificationTypeColors: Record<NotificationType, string> = {
  ORDER: 'blue',
  PAYMENT: 'green',
  PROMOTION: 'purple',
  REVIEW: 'gold',
  SYSTEM: 'default',
};

export const notificationTypeIcons: Record<NotificationType, ReactNode> = {
  ORDER: createElement(ShoppingCartOutlined),
  PAYMENT: createElement(CreditCardOutlined),
  PROMOTION: createElement(GiftOutlined),
  REVIEW: createElement(StarOutlined),
  SYSTEM: createElement(BellOutlined),
};

export const getNotificationPath = (
  notification: Pick<AdminNotification, 'referenceType' | 'referenceId' | 'type'>,
): string | null => {
  const id = notification.referenceId;
  const referenceType = notification.referenceType?.toLocaleLowerCase();
  if ((referenceType === 'order' || notification.type === 'ORDER') && id) return `/orders/${id}`;
  if ((referenceType === 'promotion' || notification.type === 'PROMOTION') && id) return `/promotions/${id}/edit`;
  if (notification.type === 'REVIEW') return '/reviews';
  if (referenceType === 'product' && id) return `/products/${id}/edit`;
  if (notification.type === 'PAYMENT') return '/orders';
  return null;
};
