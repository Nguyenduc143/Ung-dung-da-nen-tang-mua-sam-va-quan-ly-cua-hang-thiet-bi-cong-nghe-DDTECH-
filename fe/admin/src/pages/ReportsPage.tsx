import {
  DownloadOutlined,
  FileExcelOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import {
  App as AntApp,
  Button,
  Card,
  Col,
  Row,
  Segmented,
  Select,
  Space,
  Statistic,
  Table,
  Tabs,
  Tag,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs, { type Dayjs } from 'dayjs';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import * as reportApi from '../api/reportApi';
import { getApiErrorMessage } from '../api/axiosClient';
import { DateRangeFilter, EmptyState, ErrorState, PageHeader } from '../components/shared';
import type { InventoryTransactionType } from '../types/inventory';
import type { OrderStatus, PaymentMethod } from '../types/order';
import type {
  InventoryReportData,
  InventoryReportItem,
  OrderReportData,
  OrderReportItem,
  ProductReportData,
  ProductReportItem,
  ReportFormat,
  ReportGroupBy,
  ReportKind,
  RevenueReportData,
  RevenueReportPoint,
} from '../types/report';
import {
  formatMoney,
  orderStatusColors,
  orderStatusLabels,
  paymentMethodLabels,
} from '../utils/orderPresentation';
import './reports.css';

const transactionLabels: Record<InventoryTransactionType, string> = {
  IMPORT: 'Nhập kho',
  SALE: 'Bán hàng',
  RETURN: 'Hoàn hàng',
  ADJUSTMENT: 'Điều chỉnh',
  CANCEL_ORDER: 'Hủy đơn',
};

const transactionColors: Record<InventoryTransactionType, string> = {
  IMPORT: 'green', SALE: 'blue', RETURN: 'cyan', ADJUSTMENT: 'gold', CANCEL_ORDER: 'volcano',
};

const compactMoney = (value: number) => new Intl.NumberFormat('vi-VN', {
  notation: 'compact', maximumFractionDigits: 1,
}).format(value);

const triggerDownload = ({ blob, fileName }: { blob: Blob; fileName: string }) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

export function ReportsPage() {
  const { message } = AntApp.useApp();
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([dayjs().subtract(29, 'day'), dayjs()]);
  const [activeReport, setActiveReport] = useState<ReportKind>('revenue');
  const [groupBy, setGroupBy] = useState<ReportGroupBy>('DAY');
  const [orderStatus, setOrderStatus] = useState<OrderStatus>();
  const [inventoryType, setInventoryType] = useState<InventoryTransactionType>();
  const [orderPage, setOrderPage] = useState(1);
  const [inventoryPage, setInventoryPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<ReportFormat>();
  const [error, setError] = useState<string | null>(null);
  const [revenue, setRevenue] = useState<RevenueReportData | null>(null);
  const [orders, setOrders] = useState<OrderReportData | null>(null);
  const [products, setProducts] = useState<ProductReportData | null>(null);
  const [inventory, setInventory] = useState<InventoryReportData | null>(null);

  const dates = useMemo(() => ({
    from: dateRange[0].format('YYYY-MM-DD'),
    to: dateRange[1].format('YYYY-MM-DD'),
  }), [dateRange]);

  const loadReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [revenueData, orderData, productData, inventoryData] = await Promise.all([
        reportApi.getRevenue({ ...dates, groupBy }),
        reportApi.getOrders({ ...dates, page: orderPage, limit: 20, status: orderStatus }),
        reportApi.getProducts({ ...dates, limit: 100 }),
        reportApi.getInventory({ ...dates, page: inventoryPage, limit: 20, type: inventoryType }),
      ]);
      setRevenue(revenueData);
      setOrders(orderData);
      setProducts(productData);
      setInventory(inventoryData);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Không thể tải dữ liệu báo cáo.'));
    } finally {
      setLoading(false);
    }
  }, [dates, groupBy, inventoryPage, inventoryType, orderPage, orderStatus]);

  useEffect(() => { void loadReports(); }, [loadReports]);

  const exportCurrentReport = async (format: ReportFormat) => {
    setExporting(format);
    try {
      const file = await reportApi.exportReport({
        ...dates,
        report: activeReport,
        format,
        ...(activeReport === 'revenue' ? { groupBy } : {}),
        ...(activeReport === 'orders' && orderStatus ? { status: orderStatus } : {}),
        ...(activeReport === 'inventory' && inventoryType ? { type: inventoryType } : {}),
      });
      triggerDownload(file);
      message.success(`Đã tạo báo cáo ${format.toUpperCase()}.`);
    } catch (requestError) {
      message.error(getApiErrorMessage(requestError, 'Không thể xuất báo cáo.'));
    } finally {
      setExporting(undefined);
    }
  };

  const revenueColumns: ColumnsType<RevenueReportPoint> = [
    { title: 'Thời gian', dataIndex: 'period', key: 'period', width: 130, render: (value: string) => groupBy === 'MONTH' ? dayjs(`${value}-01`).format('MM/YYYY') : dayjs(value).format('DD/MM/YYYY') },
    { title: 'Số đơn', dataIndex: 'ordersCount', key: 'ordersCount', width: 100, align: 'right' },
    { title: 'Tiền hàng', dataIndex: 'subtotal', key: 'subtotal', align: 'right', render: (value: number) => formatMoney.format(value) },
    { title: 'Phí vận chuyển', dataIndex: 'shippingFee', key: 'shippingFee', align: 'right', render: (value: number) => formatMoney.format(value) },
    { title: 'Giảm giá', dataIndex: 'discountAmount', key: 'discountAmount', align: 'right', render: (value: number) => formatMoney.format(value) },
    { title: 'Doanh thu', dataIndex: 'revenue', key: 'revenue', align: 'right', render: (value: number) => <strong>{formatMoney.format(value)}</strong> },
  ];

  const orderColumns: ColumnsType<OrderReportItem> = [
    { title: 'Mã đơn', dataIndex: 'orderCode', key: 'orderCode', width: 150 },
    { title: 'Khách hàng', key: 'customer', width: 210, render: (_, row) => <><strong>{row.customerName}</strong><br /><span className="report-muted">{row.customerEmail}</span></> },
    { title: 'Thanh toán', dataIndex: 'paymentMethod', key: 'paymentMethod', width: 130, render: (value: PaymentMethod) => paymentMethodLabels[value] },
    { title: 'Trạng thái', dataIndex: 'status', key: 'status', width: 130, render: (value: OrderStatus) => <Tag color={orderStatusColors[value]}>{orderStatusLabels[value]}</Tag> },
    { title: 'Tổng tiền', dataIndex: 'totalAmount', key: 'totalAmount', width: 150, align: 'right', render: (value: number) => formatMoney.format(value) },
    { title: 'Ngày đặt', dataIndex: 'createdAt', key: 'createdAt', width: 150, render: (value: string) => dayjs(value).format('DD/MM/YYYY HH:mm') },
  ];

  const productColumns: ColumnsType<ProductReportItem> = [
    { title: '#', key: 'rank', width: 60, render: (_, __, index) => index + 1 },
    { title: 'Sản phẩm', key: 'product', width: 260, render: (_, row) => <><strong>{row.productName}</strong><br /><span className="report-muted">{row.productSku}</span></> },
    { title: 'Danh mục', dataIndex: 'categoryName', key: 'categoryName', width: 150, render: (value) => value ?? '—' },
    { title: 'Thương hiệu', dataIndex: 'brandName', key: 'brandName', width: 140, render: (value) => value ?? '—' },
    { title: 'Đã bán', dataIndex: 'quantitySold', key: 'quantitySold', width: 100, align: 'right' },
    { title: 'Số đơn', dataIndex: 'ordersCount', key: 'ordersCount', width: 100, align: 'right' },
    { title: 'Giá bán TB', dataIndex: 'averagePrice', key: 'averagePrice', width: 150, align: 'right', render: (value: number) => formatMoney.format(value) },
    { title: 'Doanh thu hàng', dataIndex: 'grossRevenue', key: 'grossRevenue', width: 170, align: 'right', render: (value: number) => <strong>{formatMoney.format(value)}</strong> },
  ];

  const inventoryColumns: ColumnsType<InventoryReportItem> = [
    { title: 'Sản phẩm', key: 'product', width: 240, render: (_, row) => <><strong>{row.productName}</strong><br /><span className="report-muted">{row.variantName ?? row.productSku}</span></> },
    { title: 'Loại', dataIndex: 'type', key: 'type', width: 120, render: (value: InventoryTransactionType) => <Tag color={transactionColors[value]}>{transactionLabels[value]}</Tag> },
    { title: 'Biến động', dataIndex: 'quantity', key: 'quantity', width: 105, align: 'right', render: (value: number) => <strong className={value >= 0 ? 'report-positive' : 'report-negative'}>{value > 0 ? `+${value}` : value}</strong> },
    { title: 'Tồn sau GD', dataIndex: 'stockAfter', key: 'stockAfter', width: 110, align: 'right' },
    { title: 'Người thực hiện', dataIndex: 'createdByName', key: 'createdByName', width: 160, render: (value) => value ?? 'Hệ thống' },
    { title: 'Ghi chú', dataIndex: 'note', key: 'note', ellipsis: true, render: (value) => value ?? '—' },
    { title: 'Thời gian', dataIndex: 'createdAt', key: 'createdAt', width: 155, render: (value: string) => dayjs(value).format('DD/MM/YYYY HH:mm') },
  ];

  const chartData = revenue?.points.map((point) => ({
    ...point,
    label: groupBy === 'MONTH' ? dayjs(`${point.period}-01`).format('MM/YYYY') : dayjs(point.period).format('DD/MM'),
  })) ?? [];

  const tabs = [
    {
      key: 'revenue', label: 'Doanh thu', children: (
        <Space direction="vertical" size={16} className="report-tab-content">
          <div className="report-tab-toolbar"><Segmented<ReportGroupBy> value={groupBy} options={[{ label: 'Theo ngày', value: 'DAY' }, { label: 'Theo tháng', value: 'MONTH' }]} onChange={setGroupBy} /></div>
          <Card bordered={false} className="report-card" title="Biểu đồ doanh thu đơn đã giao">
            {chartData.length ? <div className="report-chart"><ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData}><defs><linearGradient id="reportRevenue" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#2563eb" stopOpacity={0.35} /><stop offset="95%" stopColor="#2563eb" stopOpacity={0.02} /></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" /><XAxis dataKey="label" axisLine={false} tickLine={false} minTickGap={24} /><YAxis width={70} tickFormatter={(value) => compactMoney(Number(value))} axisLine={false} tickLine={false} /><Tooltip formatter={(value) => [formatMoney.format(Number(value)), 'Doanh thu']} /><Area type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={2.5} fill="url(#reportRevenue)" /></AreaChart></ResponsiveContainer></div> : <EmptyState description="Chưa có dữ liệu doanh thu" />}
          </Card>
          <Card bordered={false} className="report-card" title="Chi tiết doanh thu"><Table rowKey="period" columns={revenueColumns} dataSource={revenue?.points ?? []} loading={loading} pagination={false} scroll={{ x: 900 }} /></Card>
        </Space>
      ),
    },
    {
      key: 'orders', label: 'Đơn hàng', children: (
        <Card bordered={false} className="report-card" title="Đơn hàng trong kỳ" extra={<Select allowClear placeholder="Tất cả trạng thái" value={orderStatus} options={Object.entries(orderStatusLabels).map(([value, label]) => ({ value, label }))} onChange={(value) => { setOrderStatus(value); setOrderPage(1); }} style={{ width: 180 }} />}>
          <Table rowKey="id" columns={orderColumns} dataSource={orders?.orders ?? []} loading={loading} scroll={{ x: 950 }} pagination={{ current: orders?.pagination.page, pageSize: orders?.pagination.limit ?? 20, total: orders?.pagination.total, showSizeChanger: false, onChange: setOrderPage }} />
        </Card>
      ),
    },
    {
      key: 'products', label: 'Sản phẩm bán chạy', children: (
        <Card bordered={false} className="report-card" title="Xếp hạng sản phẩm theo doanh thu"><Table rowKey={(row) => `${row.productId ?? 'deleted'}-${row.productSku}`} columns={productColumns} dataSource={products?.products ?? []} loading={loading} pagination={{ pageSize: 20, showSizeChanger: false }} scroll={{ x: 1100 }} /></Card>
      ),
    },
    {
      key: 'inventory', label: 'Biến động kho', children: (
        <Card bordered={false} className="report-card" title="Lịch sử biến động tồn kho" extra={<Select allowClear placeholder="Tất cả giao dịch" value={inventoryType} options={Object.entries(transactionLabels).map(([value, label]) => ({ value, label }))} onChange={(value) => { setInventoryType(value); setInventoryPage(1); }} style={{ width: 180 }} />}>
          <Table rowKey="id" columns={inventoryColumns} dataSource={inventory?.transactions ?? []} loading={loading} scroll={{ x: 1050 }} pagination={{ current: inventory?.pagination.page, pageSize: inventory?.pagination.limit ?? 20, total: inventory?.pagination.total, showSizeChanger: false, onChange: setInventoryPage }} />
        </Card>
      ),
    },
  ];

  return (
    <section aria-labelledby="reports-title">
      <PageHeader
        titleId="reports-title"
        eyebrow="PHÂN TÍCH KINH DOANH"
        title="Báo cáo thống kê"
        description="Theo dõi hiệu quả bán hàng, doanh thu và biến động kho theo khoảng thời gian."
        actions={<Space wrap><DateRangeFilter value={dateRange} maxDays={366} onChange={(value) => { setDateRange(value); setOrderPage(1); setInventoryPage(1); }} /><Button icon={<ReloadOutlined />} loading={loading} onClick={() => void loadReports()}>Làm mới</Button><Button icon={<DownloadOutlined />} loading={exporting === 'csv'} onClick={() => void exportCurrentReport('csv')}>CSV</Button><Button type="primary" icon={<FileExcelOutlined />} loading={exporting === 'xlsx'} onClick={() => void exportCurrentReport('xlsx')}>Excel</Button></Space>}
      />

      {error && <ErrorState message={error} onRetry={() => void loadReports()} retrying={loading} />}

      <Row gutter={[16, 16]} className="report-summary-grid">
        <Col xs={24} sm={12} xl={6}><Card bordered={false}><Statistic title="Doanh thu đơn đã giao" value={revenue?.summary.revenue ?? 0} formatter={(value) => formatMoney.format(Number(value))} /></Card></Col>
        <Col xs={24} sm={12} xl={6}><Card bordered={false}><Statistic title="Đơn đã giao" value={revenue?.summary.ordersCount ?? 0} suffix="đơn" /></Card></Col>
        <Col xs={24} sm={12} xl={6}><Card bordered={false}><Statistic title="Giá trị đơn trung bình" value={revenue?.summary.ordersCount ? revenue.summary.revenue / revenue.summary.ordersCount : 0} formatter={(value) => formatMoney.format(Number(value))} /></Card></Col>
        <Col xs={24} sm={12} xl={6}><Card bordered={false}><Statistic title="Sản phẩm có doanh số" value={products?.products.length ?? 0} suffix="sản phẩm" /></Card></Col>
      </Row>

      <Tabs activeKey={activeReport} onChange={(key) => setActiveReport(key as ReportKind)} items={tabs} className="report-tabs" />
    </section>
  );
}
