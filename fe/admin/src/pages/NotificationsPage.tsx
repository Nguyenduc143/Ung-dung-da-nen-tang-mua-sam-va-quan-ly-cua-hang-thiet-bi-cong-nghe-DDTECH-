import {
  CheckOutlined,
  EyeOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import {
  App as AntApp,
  Button,
  Card,
  List,
  Select,
  Space,
  Tag,
  Typography,
} from 'antd';
import dayjs from 'dayjs';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { getApiErrorMessage } from '../api/axiosClient';
import * as notificationApi from '../api/notificationApi';
import { AppPagination, EmptyState, ErrorState, PageHeader } from '../components/shared';
import { useNotificationStore } from '../stores/notificationStore';
import type {
  AdminNotification,
  NotificationQuery,
  NotificationType,
} from '../types/notification';
import {
  getNotificationPath,
  notificationTypeColors,
  notificationTypeIcons,
  notificationTypeLabels,
} from '../utils/notificationPresentation';

const { Text } = Typography;

export function NotificationsPage() {
  const { message } = AntApp.useApp();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [type, setType] = useState<NotificationType>();
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [markingId, setMarkingId] = useState<number | null>(null);
  const [markingAll, setMarkingAll] = useState(false);
  const unreadCount = useNotificationStore((state) => state.unreadCount);
  const realtimeRevision = useNotificationStore((state) => state.realtimeRevision);
  const markRead = useNotificationStore((state) => state.markRead);
  const markAllRead = useNotificationStore((state) => state.markAllRead);

  const query = useMemo<NotificationQuery>(() => ({
    page,
    limit: pageSize,
    unreadOnly: unreadOnly || undefined,
    type,
  }), [page, pageSize, type, unreadOnly]);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await notificationApi.listNotifications(query);
      setNotifications(data.notifications);
      setTotal(data.pagination.total);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Không thể tải danh sách thông báo.'));
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => { void loadNotifications(); }, [loadNotifications, realtimeRevision]);

  const handleMarkRead = async (notification: AdminNotification) => {
    if (notification.isRead) return notification;
    setMarkingId(notification.id);
    try {
      const updatedNotification = await markRead(notification.id);
      if (unreadOnly) {
        setNotifications((current) => current.filter((item) => item.id !== notification.id));
        setTotal((current) => Math.max(0, current - 1));
      } else {
        setNotifications((current) => current.map((item) => item.id === notification.id ? updatedNotification : item));
      }
      return updatedNotification;
    } catch (requestError) {
      message.error(getApiErrorMessage(requestError, 'Không thể đánh dấu thông báo đã đọc.'));
      return null;
    } finally {
      setMarkingId(null);
    }
  };

  const openNotification = async (notification: AdminNotification) => {
    const updatedNotification = await handleMarkRead(notification);
    if (!updatedNotification) return;
    const path = getNotificationPath(notification);
    if (path) navigate(path);
  };

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      const updatedCount = await markAllRead();
      if (unreadOnly) {
        setNotifications([]);
        setTotal(0);
      } else {
        setNotifications((current) => current.map((item) => ({ ...item, isRead: true })));
      }
      message.success(updatedCount ? `Đã đánh dấu ${updatedCount} thông báo là đã đọc.` : 'Không còn thông báo chưa đọc.');
    } catch (requestError) {
      message.error(getApiErrorMessage(requestError, 'Không thể cập nhật thông báo.'));
    } finally {
      setMarkingAll(false);
    }
  };

  const clearFilters = () => {
    setType(undefined);
    setUnreadOnly(false);
    setPage(1);
  };

  return (
    <section aria-labelledby="notifications-title">
      <PageHeader
        titleId="notifications-title"
        eyebrow="TRUNG TÂM THÔNG BÁO"
        title="Thông báo"
        description="Theo dõi sự kiện vận hành và các công việc mới cần xử lý."
        actions={<Button icon={<CheckOutlined />} loading={markingAll} disabled={unreadCount === 0} onClick={() => void handleMarkAllRead()}>Đánh dấu tất cả đã đọc</Button>}
      />

      {error && <ErrorState message={error} onRetry={() => void loadNotifications()} retrying={loading} />}

      <Card className="product-filter-card" bordered={false}>
        <div className="notification-filter-grid">
          <Select<NotificationType>
            allowClear value={type} placeholder="Loại thông báo"
            options={Object.entries(notificationTypeLabels).map(([value, label]) => ({ value, label }))}
            onChange={(value) => { setType(value); setPage(1); }}
          />
          <Select<'ALL' | 'UNREAD'>
            value={unreadOnly ? 'UNREAD' : 'ALL'}
            options={[{ value: 'ALL', label: 'Tất cả thông báo' }, { value: 'UNREAD', label: 'Chưa đọc' }]}
            onChange={(value) => { setUnreadOnly(value === 'UNREAD'); setPage(1); }}
          />
          <Space><Button onClick={clearFilters}>Xóa bộ lọc</Button><Button icon={<ReloadOutlined />} onClick={() => void loadNotifications()}>Làm mới</Button></Space>
        </div>
      </Card>

      <Card className="management-card notification-list-card" bordered={false}>
        <List<AdminNotification>
          loading={loading}
          dataSource={notifications}
          locale={{ emptyText: <EmptyState compact description={error ? 'Không có dữ liệu để hiển thị' : 'Chưa có thông báo phù hợp'} /> }}
          renderItem={(notification) => {
            const path = getNotificationPath(notification);
            return (
              <List.Item
                className={notification.isRead ? '' : 'notification-list-item--unread'}
                actions={[
                  !notification.isRead && <Button key="read" type="link" loading={markingId === notification.id} onClick={() => void handleMarkRead(notification)}>Đánh dấu đã đọc</Button>,
                  path && <Button key="open" type="text" icon={<EyeOutlined />} onClick={() => void openNotification(notification)}>Mở</Button>,
                ].filter(Boolean)}
              >
                <List.Item.Meta
                  avatar={<span className={`notification-type-icon notification-type-icon--${notification.type.toLowerCase()}`}>{notificationTypeIcons[notification.type]}</span>}
                  title={<Space wrap><Text strong>{notification.title}</Text>{!notification.isRead && <BadgeDot />}<Tag color={notificationTypeColors[notification.type]}>{notificationTypeLabels[notification.type]}</Tag></Space>}
                  description={<div className="notification-description"><span>{notification.message}</span><time>{dayjs(notification.createdAt).format('HH:mm, DD/MM/YYYY')}</time></div>}
                />
              </List.Item>
            );
          }}
        />
        {total > 0 && (
          <div className="notification-pagination">
            <AppPagination
              current={page}
              pageSize={pageSize}
              total={total}
              itemLabel="thông báo"
              onChange={(nextPage, nextPageSize) => { setPage(nextPageSize === pageSize ? nextPage : 1); setPageSize(nextPageSize); }}
            />
          </div>
        )}
      </Card>
    </section>
  );
}

function BadgeDot() {
  return <span className="notification-unread-dot" aria-label="Chưa đọc" />;
}
