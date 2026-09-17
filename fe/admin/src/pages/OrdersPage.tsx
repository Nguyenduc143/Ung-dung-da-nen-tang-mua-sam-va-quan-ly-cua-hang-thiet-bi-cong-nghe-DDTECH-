import {
  EyeOutlined,
  ReloadOutlined,
  SearchOutlined,
  ShoppingCartOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  Input,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
  type TableColumnsType,
} from 'antd';
import dayjs from 'dayjs';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { getApiErrorMessage } from '../api/axiosClient';
import * as orderApi from '../api/orderApi';
import type {
  Order,
  OrderQuery,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from '../types/order';
import {
  formatMoney,
  orderStatusColors,
  orderStatusLabels,
  paymentMethodLabels,
  paymentStatusColors,
  paymentStatusLabels,
} from '../utils/orderPresentation';

const { Paragraph, Text, Title } = Typography;

export function OrdersPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [status, setStatus] = useState<OrderStatus>();
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [search]);

  const query = useMemo<OrderQuery>(() => ({
    page,
    limit: pageSize,
    search: debouncedSearch || undefined,
    status,
    paymentStatus,
    paymentMethod,
  }), [debouncedSearch, page, pageSize, paymentMethod, paymentStatus, status]);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await orderApi.listOrders(query);
      setOrders(data.orders);
      setTotal(data.pagination.total);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Không thể tải danh sách đơn hàng.'));
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => { void loadOrders(); }, [loadOrders]);

  const clearFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setStatus(undefined);
    setPaymentStatus(undefined);
    setPaymentMethod(undefined);
    setPage(1);
  };

  const columns: TableColumnsType<Order> = [
    {
      title: 'Mã đơn', dataIndex: 'orderCode', key: 'orderCode', width: 145,
      render: (value: string, record) => (
        <Button type="link" className="order-code-link" onClick={() => navigate(`/orders/${record.id}`)}>{value}</Button>
      ),
    },
    {
      title: 'Khách hàng', key: 'customer', width: 210,
      render: (_, record) => (
        <div className="table-primary-cell">
          <strong>{record.customer.fullName}</strong>
          <span>{record.customer.email}</span>
        </div>
      ),
    },
    {
      title: 'Người nhận', key: 'receiver', width: 185,
      render: (_, record) => (
        <div className="table-primary-cell"><strong>{record.receiverName}</strong><span>{record.receiverPhone}</span></div>
      ),
    },
    {
      title: 'Tổng tiền', dataIndex: 'totalAmount', key: 'totalAmount', width: 135, align: 'right',
      render: (value: number) => <strong className="order-total">{formatMoney.format(value)}</strong>,
    },
    {
      title: 'Thanh toán', key: 'payment', width: 160,
      render: (_, record) => (
        <div className="table-primary-cell">
          <strong>{record.paymentMethod}</strong>
          <span><Tag color={paymentStatusColors[record.paymentStatus]}>{paymentStatusLabels[record.paymentStatus]}</Tag></span>
        </div>
      ),
    },
    {
      title: 'Trạng thái', dataIndex: 'status', key: 'status', width: 125,
      render: (value: OrderStatus) => <Tag color={orderStatusColors[value]}>{orderStatusLabels[value]}</Tag>,
    },
    {
      title: 'Ngày đặt', dataIndex: 'createdAt', key: 'createdAt', width: 145,
      render: (value: string) => dayjs(value).format('DD/MM/YYYY HH:mm'),
    },
    {
      title: '', key: 'actions', width: 58, fixed: 'right',
      render: (_, record) => (
        <Tooltip title="Xem chi tiết"><Button type="text" icon={<EyeOutlined />} onClick={() => navigate(`/orders/${record.id}`)} /></Tooltip>
      ),
    },
  ];

  return (
    <section aria-labelledby="orders-title">
      <div className="page-heading">
        <Text className="eyebrow">VẬN HÀNH ĐƠN HÀNG</Text>
        <Title id="orders-title" level={2}>Quản lý đơn hàng</Title>
        <Paragraph>Theo dõi thanh toán, giao nhận và tiến độ xử lý đơn.</Paragraph>
      </div>

      {error && (
        <Alert className="content-alert" type="error" showIcon message={error}
          action={<Button size="small" icon={<ReloadOutlined />} onClick={() => void loadOrders()}>Thử lại</Button>} />
      )}

      <Card className="product-filter-card" bordered={false}>
        <div className="order-filter-grid">
          <Input allowClear value={search} prefix={<SearchOutlined />} placeholder="Mã đơn, người nhận hoặc số điện thoại" onChange={(event) => setSearch(event.target.value)} />
          <Select allowClear value={status} placeholder="Trạng thái đơn" options={Object.entries(orderStatusLabels).map(([value, label]) => ({ value, label }))} onChange={(value) => { setStatus(value); setPage(1); }} />
          <Select allowClear value={paymentStatus} placeholder="Trạng thái thanh toán" options={Object.entries(paymentStatusLabels).map(([value, label]) => ({ value, label }))} onChange={(value) => { setPaymentStatus(value); setPage(1); }} />
          <Select allowClear value={paymentMethod} placeholder="Phương thức thanh toán" options={Object.entries(paymentMethodLabels).map(([value, label]) => ({ value, label }))} onChange={(value) => { setPaymentMethod(value); setPage(1); }} />
          <Space>
            <Button onClick={clearFilters}>Xóa bộ lọc</Button>
            <Button icon={<ReloadOutlined />} onClick={() => void loadOrders()}>Làm mới</Button>
          </Space>
        </div>
      </Card>

      <Card className="management-card" bordered={false}>
        <div className="table-summary"><ShoppingCartOutlined /> {total} đơn hàng</div>
        <Table<Order>
          rowKey="id"
          columns={columns}
          dataSource={orders}
          loading={loading}
          scroll={{ x: 1180 }}
          onRow={(record) => ({ onDoubleClick: () => navigate(`/orders/${record.id}`) })}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            pageSizeOptions: [10, 20, 50, 100],
            showTotal: (count) => `Tổng ${count} đơn hàng`,
            onChange: (nextPage, nextPageSize) => {
              setPage(nextPageSize === pageSize ? nextPage : 1);
              setPageSize(nextPageSize);
            },
          }}
          locale={{ emptyText: error ? 'Không có dữ liệu để hiển thị' : 'Chưa có đơn hàng phù hợp' }}
        />
      </Card>
    </section>
  );
}
