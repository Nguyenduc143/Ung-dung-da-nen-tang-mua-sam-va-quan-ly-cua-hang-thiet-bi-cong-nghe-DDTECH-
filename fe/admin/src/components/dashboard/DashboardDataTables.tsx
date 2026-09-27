import {
  EyeOutlined,
  InboxOutlined,
  ShoppingOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { Button, Card, Table, Tag, Tooltip, type TableColumnsType } from 'antd';
import dayjs from 'dayjs';

import type {
  DashboardRecentOrder,
  DashboardTopProduct,
} from '../../types/dashboard';
import type { LowStockItem } from '../../types/inventory';
import {
  orderStatusColors,
  orderStatusLabels,
  paymentStatusColors,
  paymentStatusLabels,
} from '../../utils/orderPresentation';
import { CurrencyText } from '../shared';

interface DashboardDataTablesProps {
  topProducts: DashboardTopProduct[];
  recentOrders: DashboardRecentOrder[];
  lowStockItems: LowStockItem[];
  loading: boolean;
  onNavigate: (path: string) => void;
}

export function DashboardDataTables({
  topProducts,
  recentOrders,
  lowStockItems,
  loading,
  onNavigate,
}: DashboardDataTablesProps) {
  const productColumns: TableColumnsType<DashboardTopProduct> = [
    {
      title: 'Sản phẩm', key: 'product',
      render: (_, record) => (
        <div className="table-primary-cell"><strong>{record.name}</strong><span>{record.sku}</span></div>
      ),
    },
    { title: 'Đã bán', dataIndex: 'quantitySold', key: 'quantitySold', width: 85, align: 'center' },
    { title: 'Doanh thu', dataIndex: 'revenue', key: 'revenue', width: 145, align: 'right', render: (value: number) => <CurrencyText strong value={value} /> },
    {
      title: '', key: 'action', width: 48,
      render: (_, record) => (
        <Tooltip title={record.productId ? 'Mở sản phẩm' : 'Sản phẩm không còn tồn tại'}>
          <Button type="text" disabled={record.productId === null} icon={<EyeOutlined />} onClick={() => { if (record.productId) onNavigate(`/products/${record.productId}/edit`); }} />
        </Tooltip>
      ),
    },
  ];

  const orderColumns: TableColumnsType<DashboardRecentOrder> = [
    {
      title: 'Đơn hàng', key: 'order', width: 145,
      render: (_, record) => <Button className="order-code-link" type="link" onClick={() => onNavigate(`/orders/${record.id}`)}>{record.orderCode}</Button>,
    },
    {
      title: 'Khách hàng', key: 'customer',
      render: (_, record) => <div className="table-primary-cell"><strong>{record.customerName}</strong><span>{dayjs(record.createdAt).format('DD/MM/YYYY HH:mm')}</span></div>,
    },
    { title: 'Tổng tiền', dataIndex: 'totalAmount', key: 'totalAmount', width: 135, align: 'right', render: (value: number) => <CurrencyText strong value={value} /> },
    { title: 'Trạng thái', key: 'status', width: 135, render: (_, record) => <Tag color={orderStatusColors[record.status]}>{orderStatusLabels[record.status]}</Tag> },
    { title: 'Thanh toán', key: 'payment', width: 135, render: (_, record) => <Tag color={paymentStatusColors[record.paymentStatus]}>{paymentStatusLabels[record.paymentStatus]}</Tag> },
  ];

  const lowStockColumns: TableColumnsType<LowStockItem> = [
    {
      title: 'Sản phẩm', key: 'product',
      render: (_, record) => (
        <div className="table-primary-cell"><strong>{record.product.name}</strong><span>{record.variant ? `${record.variant.name} · ${record.variant.sku}` : record.product.sku}</span></div>
      ),
    },
    { title: 'Tồn kho', dataIndex: 'stock', key: 'stock', width: 90, align: 'center', render: (value: number) => <Tag color={value === 0 ? 'error' : 'warning'}>{value}</Tag> },
    { title: '', key: 'action', width: 48, render: () => <Tooltip title="Quản lý tồn kho"><Button type="text" icon={<EyeOutlined />} onClick={() => onNavigate('/inventory')} /></Tooltip> },
  ];

  return (
    <div className="dashboard-tables-grid">
      <Card className="dashboard-panel dashboard-table-card" bordered={false} title={<span><ShoppingOutlined /> Sản phẩm bán chạy</span>} extra={<Button type="link" onClick={() => onNavigate('/products')}>Xem sản phẩm</Button>}>
        <Table<DashboardTopProduct>
          rowKey={(record) => `${record.productId ?? 'deleted'}-${record.sku}`}
          columns={productColumns} dataSource={topProducts} loading={loading} pagination={false}
          scroll={{ x: 620 }} locale={{ emptyText: 'Chưa có dữ liệu bán hàng' }}
        />
      </Card>

      <Card className="dashboard-panel dashboard-table-card" bordered={false} title={<span><WarningOutlined /> Sản phẩm sắp hết</span>} extra={<Button type="link" onClick={() => onNavigate('/inventory')}>Quản lý kho</Button>}>
        <Table<LowStockItem>
          rowKey={(record) => `${record.product.id}-${record.variant?.id ?? 'product'}`}
          columns={lowStockColumns} dataSource={lowStockItems} loading={loading}
          pagination={false} scroll={{ x: 480 }} locale={{ emptyText: 'Không có sản phẩm sắp hết hàng' }}
        />
      </Card>

      <Card className="dashboard-panel dashboard-table-card dashboard-table-card--wide" bordered={false} title={<span><InboxOutlined /> Đơn hàng gần đây</span>} extra={<Button type="link" onClick={() => onNavigate('/orders')}>Xem tất cả</Button>}>
        <Table<DashboardRecentOrder>
          rowKey="id" columns={orderColumns} dataSource={recentOrders} loading={loading}
          pagination={false} scroll={{ x: 800 }} locale={{ emptyText: 'Chưa có đơn hàng' }}
        />
      </Card>
    </div>
  );
}
