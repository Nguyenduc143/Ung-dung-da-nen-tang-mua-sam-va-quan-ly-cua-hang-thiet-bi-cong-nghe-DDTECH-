import { ArrowDownOutlined, CustomerServiceOutlined, ReloadOutlined, SendOutlined, UserOutlined } from '@ant-design/icons';
import { Alert, Avatar, Badge, Button, Empty, Input, Pagination, Popconfirm, Select, Space, Spin, Tag, Typography } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useSupportChat } from '../hooks/useSupportChat';
import { chatContentLength } from '../utils/chat';
import { resolveMediaUrl } from '../utils/mediaUrl';
import './SupportChatPage.css';

const { Title, Text } = Typography;
export function SupportChatPage() {
  const chat = useSupportChat();
  const scroll = useRef<HTMLDivElement>(null);
  const anchor = useRef<number | null>(null);
  const [atBottom, setAtBottom] = useState(true);
  const [visible, setVisible] = useState(document.visibilityState !== 'hidden');
  const current = chat.conversation;
  const mine = current?.assignedAdminId === chat.user?.id;
  const writable = Boolean(current?.status === 'OPEN' && mine && !chat.loadingThread && !chat.threadError);
  const length = chatContentLength(chat.draft);

  useEffect(() => { setAtBottom(true); anchor.current = null; }, [chat.selectedId]);
  useEffect(() => {
    const listener = () => setVisible(document.visibilityState !== 'hidden');
    document.addEventListener('visibilitychange', listener);
    return () => document.removeEventListener('visibilitychange', listener);
  }, []);
  useLayoutEffect(() => {
    if (!scroll.current) return;
    if (anchor.current !== null && !chat.loadingOlder) {
      scroll.current.scrollTop = scroll.current.scrollHeight - anchor.current;
      anchor.current = null;
    } else if (atBottom && anchor.current === null) scroll.current.scrollTop = scroll.current.scrollHeight;
  }, [chat.messages, chat.loadingOlder, atBottom]);
  useEffect(() => {
    if (atBottom && visible && !chat.loadingThread && !chat.threadError) void chat.markVisibleRead();
  }, [atBottom, visible, chat.loadingThread, chat.threadError, chat.markVisibleRead]);
  const older = async () => {
    if (scroll.current) anchor.current = scroll.current.scrollHeight - scroll.current.scrollTop;
    setAtBottom(false); await chat.loadOlder();
  };

  return <div className="support-page">
    <div className="page-heading page-heading--actions">
      <div><Title level={2}><CustomerServiceOutlined /> Chăm sóc khách hàng</Title><Text type="secondary">Nhận hội thoại và tư vấn trực tiếp cho khách hàng.</Text></div>
      <Space><Tag color={chat.connected ? 'green' : 'orange'}>{chat.connected ? 'Realtime đã kết nối' : 'Realtime chưa kết nối'}</Tag><Button icon={<ReloadOutlined />} onClick={() => void chat.refresh()}>Làm mới</Button></Space>
    </div>
    {!chat.connected && <Alert type="warning" showIcon title="Realtime chưa kết nối. Dữ liệu vẫn được tải qua API; trang tự đồng bộ lại định kỳ." />}
    <div className="support-workspace">
      <aside className="support-inbox" aria-label="Danh sách hội thoại">
        <div className="support-inbox-heading"><Text strong>Hội thoại khách hàng</Text><Select<'OPEN' | 'CLOSED' | 'ALL'> aria-label="Trạng thái hội thoại" value={chat.status ?? 'ALL'} onChange={value => chat.changeStatus(value === 'ALL' ? undefined : value)} options={[{ value: 'OPEN', label: 'Đang mở' }, { value: 'CLOSED', label: 'Đã đóng' }, { value: 'ALL', label: 'Tất cả' }]} /></div>
        {chat.listError && <Alert type="error" showIcon title={chat.listError} action={<Button size="small" onClick={() => void chat.refresh()}>Thử lại</Button>} />}
        <Spin spinning={chat.loadingList}>
          <div className="support-conversation-list">
            {!chat.loadingList && !chat.listError && chat.inbox.conversations.length === 0 && <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có hội thoại" />}
            {chat.inbox.conversations.map(item => <button type="button" key={item.id} className={`support-conversation ${chat.selectedId === item.id ? 'is-selected' : ''}`} onClick={() => chat.select(item.id)} aria-pressed={chat.selectedId === item.id}>
              <Avatar src={resolveMediaUrl(item.customerAvatarUrl ?? undefined)} icon={<UserOutlined />} />
              <span className="support-conversation-info"><strong>{item.customerName}</strong><span>#{item.id} · {item.status === 'OPEN' ? 'Đang mở' : 'Đã đóng'}</span><small>{item.assignedAdminName ? `Phụ trách: ${item.assignedAdminName}` : 'Chưa có người phụ trách'}</small><small>{dayjs(item.lastMessageAt ?? item.createdAt).format('DD/MM HH:mm')}</small></span>
              <Badge count={item.unreadCount} overflowCount={99} />
            </button>)}
          </div>
        </Spin>
        <Pagination size="small" current={chat.page} total={chat.inbox.pagination.total} pageSize={20} showSizeChanger={false} onChange={chat.setPage} />
      </aside>
      <section className="support-thread" aria-label="Khung chat">
        {chat.selectedId === null ? <div className="support-thread-empty"><Empty description="Chọn một hội thoại để bắt đầu hỗ trợ" /></div> : <>
          <div className="support-thread-heading">
            <div><Text strong>{current?.customerName ?? `Hội thoại #${chat.selectedId}`}</Text><div><Text type="secondary">{current?.assignedAdminName ? `Phụ trách: ${current.assignedAdminName}` : 'Chưa có người phụ trách'}</Text></div></div>
            <Space wrap>
              {current && <Tag color={current.status === 'OPEN' ? 'blue' : 'default'}>{current.status === 'OPEN' ? 'Đang mở' : 'Đã đóng'}</Tag>}
              {current?.status === 'OPEN' && current.assignedAdminId === null && <Button type="primary" loading={chat.busy} onClick={() => void chat.claim()}>Nhận phụ trách</Button>}
              {current?.status === 'OPEN' && mine && <Popconfirm title="Đóng hội thoại này?" description="Khách có thể mở hội thoại mới, lịch sử cũ vẫn được giữ." onConfirm={chat.close} disabled={chat.busy}><Button danger disabled={chat.busy}>Đóng hội thoại</Button></Popconfirm>}
            </Space>
          </div>
          {chat.threadError && <Alert type="error" showIcon title={chat.threadError} action={<Button size="small" onClick={() => void chat.refresh()}>Thử lại</Button>} />}
          {chat.actionError && <Alert type="error" showIcon title={chat.actionError} />}
          {current?.status === 'OPEN' && !mine && <Alert type="info" showIcon title={current.assignedAdminId === null ? 'Nhận phụ trách để trả lời khách hàng.' : 'Nhân viên khác đang phụ trách. Bạn có thể xem lịch sử nhưng không gửi tin.'} />}
          <div className="support-messages" ref={scroll} role="log" aria-label="Lịch sử tin nhắn" onScroll={() => { const node = scroll.current; if (node) setAtBottom(node.scrollHeight - node.scrollTop - node.clientHeight < 48); }}>
            {chat.loadingThread ? <div className="support-thread-empty"><Spin tip="Đang tải lịch sử..." /></div> : <>
              {chat.olderSeq !== null && <div className="support-load-older"><Button loading={chat.loadingOlder} onClick={() => void older()}>Tải tin nhắn cũ hơn</Button></div>}
              {!chat.threadError && chat.messages.length === 0 && <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có tin nhắn" />}
              {chat.messages.map(item => {
                const fromCustomer = item.senderId === current?.customerId;
                return <div key={item.id} className={`support-message ${fromCustomer ? 'from-customer' : 'from-admin'}`}>
                  <div className="support-bubble"><small>{fromCustomer ? current?.customerName : item.senderId === chat.user?.id ? 'Bạn' : 'Nhân viên CSKH'}</small><p>{item.content}</p><small>{dayjs(item.createdAt).format('DD/MM/YYYY HH:mm')}{!fromCustomer && ` · ${item.messageSeq <= (current?.customerReadSeq ?? 0) ? 'Đã đọc' : 'Đã gửi'}`}</small></div>
                </div>;
              })}
            </>}
          </div>
          {!atBottom && <Button className="support-jump-latest" icon={<ArrowDownOutlined />} onClick={() => setAtBottom(true)}>Về tin mới nhất</Button>}
          <form className="support-composer" onSubmit={event => { event.preventDefault(); if (writable && !chat.busy && length > 0 && length <= 4000) { setAtBottom(true); void chat.send(); } }}>
            <Input.TextArea aria-label="Nội dung trả lời" placeholder={current?.status === 'CLOSED' ? 'Hội thoại đã đóng' : writable ? 'Nhập nội dung hỗ trợ...' : 'Nhận phụ trách trước khi trả lời'} autoSize={{ minRows: 2, maxRows: 5 }} value={chat.draft} onChange={event => chat.setDraft(event.target.value)} disabled={!writable || chat.busy} />
            <div className="support-composer-actions"><Text type={length > 4000 ? 'danger' : 'secondary'}>{length}/4000 ký tự · Tin nhắn văn bản</Text><Button aria-label="Gửi" type="primary" htmlType="submit" icon={<SendOutlined />} loading={chat.busy} disabled={!writable || length === 0 || length > 4000}>Gửi</Button></div>
          </form>
        </>}
      </section>
    </div>
  </div>;
}
