import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  EditOutlined,
  FileTextOutlined,
  ShoppingOutlined,
  UserOutlined,
} from '@ant-design/icons';
import {
  Alert,
  App as AntApp,
  Avatar,
  Button,
  Card,
  Descriptions,
  Empty,
  Result,
  Space,
  Spin,
  Table,
  Tag,
  Timeline,
  Typography,
  type TableColumnsType,
} from 'antd';
import dayjs from 'dayjs';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { getApiErrorMessage } from '../api/axiosClient';
import * as orderApi from '../api/orderApi';
import { OrderStatusModal } from '../components/orders/OrderStatusModal';
import type { OrderDetailData, OrderItem, UpdateOrderStatusInput } from '../types/order';
import {
  formatMoney,
  nextOrderStatuses,
  orderStatusColors,
  orderStatusLabels,
  paymentMethodLabels,
  paymentStatusColors,
  paymentStatusLabels,
} from '../utils/orderPresentation';

const { Paragraph, Text, Title } = Typography;

export function OrderDetailPage() {
  const { message } = AntApp.useApp();
  const navigate = useNavigate();
  const params = useParams<{ id: string }>();
  const orderId = Number(params.id);
  const [detail, setDetail] = useState<OrderDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loadOrder = useCallback(async () => {
    if (!Number.isInteger(orderId) || orderId <= 0) {
      setError('Mã đơn hàng không hợp lệ.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setDetail(await orderApi.getOrder(orderId));
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Không thể tải chi tiết đơn hàng.'));
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => { void loadOrder(); }, [loadOrder]);

  const handleStatusUpdate = async (input: UpdateOrderStatusInput) => {
    setSubmitting(true);
    try {
      const updated = await orderApi.updateOrderStatus(orderId, input);
      setDetail(updated);
      setStatusModalOpen(false);
      message.success('Đã cập nhật trạng thái đơn hàng.');
    } catch (requestError) {
      message.error(getApiErrorMessage(requestError, 'Không thể cập nhật trạng thái đơn hàng.'));
    } finally {
      setSubmitting(false);
    }
  };

  const itemColumns: TableColumnsType<OrderItem> = [
    {
      title: 'Sản phẩm', key: 'product',
      render: (_, item) => (
        <div className="order-item-product">
          <Avatar shape="square" size={52} src={item.productImage || undefined} icon={<ShoppingOutlined />} />
          <div className="table-primary-cell">
            <strong>{item.productName}</strong>
            <span>{item.variantName ? `${item.variantName} · ${item.productSku}` : item.productSku}</span>
          </div>
        </div>
      ),
    },
    { title: 'Đơn giá', dataIndex: 'price', key: 'price', width: 140, align: 'right', render: (value: number) => formatMoney.format(value) },
    { title: 'Số lượng', dataIndex: 'quantity', key: 'quantity', width: 100, align: 'center' },
    { title: 'Thành tiền', dataIndex: 'subtotal', key: 'subtotal', width: 150, align: 'right', render: (value: number) => <strong>{formatMoney.format(value)}</strong> },
  ];

  if (loading) {
    return <div className="content-loading"><Spin size="large" /><Text>Đang tải chi tiết đơn hàng...</Text></div>;
  }

  if (error || !detail) {
    return (
      <Result
        status="error"
        title="Không thể hiển thị đơn hàng"
        subTitle={error ?? 'Không tìm thấy dữ liệu đơn hàng.'}
        extra={[
          <Button key="back" onClick={() => navigate('/orders')}>Về danh sách</Button>,
          <Button key="retry" type="primary" onClick={() => void loadOrder()}>Thử lại</Button>,
        ]}
      />
    );
  }

  const { order, items, statusHistory } = detail;
  const canUpdateStatus = nextOrderStatuses[order.status].length > 0;

  return (
    <section aria-labelledby="order-detail-title">
      <div className="page-heading page-heading--actions">
        <div>
          <Text className="eyebrow">CHI TIẾT ĐƠN HÀNG</Text>
          <Space align="center" wrap>
            <Title id="order-detail-title" level={2}>{order.orderCode}</Title>
            <Tag color={orderStatusColors[order.status]}>{orderStatusLabels[order.status]}</Tag>
          </Space>
          <Paragraph>Đặt lúc {dayjs(order.createdAt).format('HH:mm, DD/MM/YYYY')}</Paragraph>
        </div>
        <Space wrap>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/orders')}>Danh sách đơn</Button>
          {canUpdateStatus && <Button type="primary" icon={<EditOutlined />} onClick={() => setStatusModalOpen(true)}>Cập nhật trạng thái</Button>}
        </Space>
      </div>

      {order.status === 'CANCELLED' && (
        <Alert className="content-alert" type="error" showIcon message="Đơn hàng đã bị hủy" description={order.cancelReason || 'Không có lý do hủy.'} />
      )}
      {order.note && <Alert className="content-alert" type="info" showIcon icon={<FileTextOutlined />} message="Ghi chú của khách hàng" description={order.note} />}

      <div className="order-detail-grid">
        <div className="order-detail-main">
          <Card className="form-section-card" bordered={false} title="Sản phẩm trong đơn">
            <Table<OrderItem>
              rowKey="id"
              columns={itemColumns}
              dataSource={items}
              pagination={false}
              scroll={{ x: 680 }}
              locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Đơn hàng chưa có sản phẩm" /> }}
            />
          </Card>

          <Card className="form-section-card" bordered={false} title="Lịch sử trạng thái">
            {statusHistory.length ? (
              <Timeline
                items={statusHistory.map((history) => ({
                  color: history.toStatus === 'CANCELLED' ? 'red' : history.toStatus === 'DELIVERED' ? 'green' : 'blue',
                  dot: history.toStatus === 'DELIVERED' ? <CheckCircleOutlined /> : <ClockCircleOutlined />,
                  children: (
                    <div className="order-timeline-item">
                      <Space wrap>
                        <Tag color={orderStatusColors[history.toStatus]}>{orderStatusLabels[history.toStatus]}</Tag>
                        <Text type="secondary">{dayjs(history.createdAt).format('HH:mm, DD/MM/YYYY')}</Text>
                      </Space>
                      <Text>{history.changedByName || 'Hệ thống'}</Text>
                      {history.note && <Paragraph>{history.note}</Paragraph>}
                    </div>
                  ),
                }))}
              />
            ) : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có lịch sử trạng thái" />}
          </Card>
        </div>

        <aside className="order-detail-aside">
          <Card className="form-section-card" bordered={false} title={<span><UserOutlined /> Khách hàng</span>}>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Họ tên">{order.customer.fullName}</Descriptions.Item>
              <Descriptions.Item label="Email">{order.customer.email}</Descriptions.Item>
              <Descriptions.Item label="Điện thoại">{order.customer.phone || '—'}</Descriptions.Item>
            </Descriptions>
          </Card>

          <Card className="form-section-card" bordered={false} title="Giao nhận">
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Người nhận">{order.receiverName}</Descriptions.Item>
              <Descriptions.Item label="Điện thoại">{order.receiverPhone}</Descriptions.Item>
              <Descriptions.Item label="Địa chỉ">{order.shippingAddress}</Descriptions.Item>
              <Descriptions.Item label="Vận chuyển">{order.shippingMethod?.name ?? 'Chưa xác định'}</Descriptions.Item>
            </Descriptions>
          </Card>

          <Card className="form-section-card" bordered={false} title="Thanh toán">
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Phương thức">{paymentMethodLabels[order.paymentMethod]}</Descriptions.Item>
              <Descriptions.Item label="Trạng thái"><Tag color={paymentStatusColors[order.paymentStatus]}>{paymentStatusLabels[order.paymentStatus]}</Tag></Descriptions.Item>
              <Descriptions.Item label="Mã khuyến mãi">{order.promotionCode || 'Không sử dụng'}</Descriptions.Item>
            </Descriptions>
          </Card>

          <Card className="form-section-card order-totals-card" bordered={false} title="Tổng thanh toán">
            <div><Text type="secondary">Tạm tính</Text><span>{formatMoney.format(order.subtotal)}</span></div>
            <div><Text type="secondary">Phí vận chuyển</Text><span>{formatMoney.format(order.shippingFee)}</span></div>
            <div><Text type="secondary">Giảm giá</Text><span className="stock-positive">−{formatMoney.format(order.discountAmount)}</span></div>
            <div className="order-grand-total"><strong>Tổng cộng</strong><strong>{formatMoney.format(order.totalAmount)}</strong></div>
          </Card>
        </aside>
      </div>

      <OrderStatusModal
        order={order}
        open={statusModalOpen}
        submitting={submitting}
        onCancel={() => setStatusModalOpen(false)}
        onSubmit={handleStatusUpdate}
      />
    </section>
  );
}
