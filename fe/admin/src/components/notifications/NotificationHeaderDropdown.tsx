import {
  BellOutlined,
  CheckOutlined,
  RightOutlined,
} from '@ant-design/icons';
import {
  App as AntApp,
  Badge,
  Button,
  Empty,
  Popover,
  Skeleton,
  Tag,
  Typography,
} from 'antd';
import dayjs from 'dayjs';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { getApiErrorMessage } from '../../api/axiosClient';
import { useNotificationStore } from '../../stores/notificationStore';
import type { AdminNotification } from '../../types/notification';
import {
  getNotificationPath,
  notificationTypeColors,
  notificationTypeIcons,
  notificationTypeLabels,
} from '../../utils/notificationPresentation';

const { Text } = Typography;

export function NotificationHeaderDropdown() {
  const { message } = AntApp.useApp();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const latest = useNotificationStore((state) => state.latest);
  const unreadCount = useNotificationStore((state) => state.unreadCount);
  const loading = useNotificationStore((state) => state.loading);
  const error = useNotificationStore((state) => state.error);
  const socketConnected = useNotificationStore((state) => state.socketConnected);
  const markRead = useNotificationStore((state) => state.markRead);
  const markAllRead = useNotificationStore((state) => state.markAllRead);

  const openNotification = async (notification: AdminNotification) => {
    try {
      if (!notification.isRead) await markRead(notification.id);
      const path = getNotificationPath(notification);
      setOpen(false);
      navigate(path ?? '/notifications');
    } catch (requestError) {
      message.error(getApiErrorMessage(requestError, 'Không thể mở thông báo.'));
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllRead();
      message.success('Đã đánh dấu tất cả thông báo là đã đọc.');
    } catch (requestError) {
      message.error(getApiErrorMessage(requestError, 'Không thể cập nhật thông báo.'));
    }
  };

  const content = (
    <div className="notification-popover">
      <div className="notification-popover-header">
        <div>
          <Text strong>Thông báo</Text>
          <span className={`socket-status ${socketConnected ? 'socket-status--online' : ''}`} title={socketConnected ? 'Realtime đã kết nối' : 'Realtime đang ngắt kết nối'} />
        </div>
        <Button type="link" size="small" disabled={unreadCount === 0} icon={<CheckOutlined />} onClick={() => void handleMarkAllRead()}>Đọc tất cả</Button>
      </div>

      <div className="notification-popover-list">
        {loading ? <Skeleton active paragraph={{ rows: 4 }} /> : error ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={error} />
        ) : latest.length ? latest.map((notification) => (
          <button
            key={notification.id}
            type="button"
            className={`notification-popover-item ${notification.isRead ? '' : 'notification-popover-item--unread'}`}
            onClick={() => void openNotification(notification)}
          >
            <span className={`notification-type-icon notification-type-icon--${notification.type.toLowerCase()}`}>
              {notificationTypeIcons[notification.type]}
            </span>
            <span className="notification-popover-main">
              <span><strong>{notification.title}</strong>{!notification.isRead && <i />}</span>
              <small>{notification.message}</small>
              <span>
                <Tag color={notificationTypeColors[notification.type]}>{notificationTypeLabels[notification.type]}</Tag>
                <time>{dayjs(notification.createdAt).format('DD/MM HH:mm')}</time>
              </span>
            </span>
          </button>
        )) : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có thông báo" />}
      </div>

      <Button className="notification-popover-footer" type="text" onClick={() => { setOpen(false); navigate('/notifications'); }}>
        Xem tất cả thông báo <RightOutlined />
      </Button>
    </div>
  );

  return (
    <Popover open={open} content={content} trigger="click" placement="bottomRight" arrow={false} onOpenChange={setOpen}>
      <Badge count={unreadCount} overflowCount={99} size="small">
        <Button className="notification-button" type="text" icon={<BellOutlined />} aria-label={`Mở thông báo, ${unreadCount} chưa đọc`} />
      </Badge>
    </Popover>
  );
}
