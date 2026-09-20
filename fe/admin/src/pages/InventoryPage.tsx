import {
  EditOutlined,
  ExportOutlined,
  HistoryOutlined,
  InboxOutlined,
  ReloadOutlined,
  SearchOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import {
  Alert,
  App as AntApp,
  Button,
  Card,
  DatePicker,
  Input,
  InputNumber,
  Select,
  Space,
  Table,
  Tabs,
  Tag,
  Tooltip,
  Typography,
  type TableColumnsType,
} from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { getApiErrorMessage } from '../api/axiosClient';
import * as inventoryApi from '../api/inventoryApi';
import { StockChangeModal, type StockTarget } from '../components/inventory/StockChangeModal';
import type {
  InventoryChangeInput,
  InventoryProduct,
  InventoryQuery,
  InventoryTransaction,
  InventoryTransactionQuery,
  InventoryTransactionType,
  InventoryVariant,
  LowStockItem,
} from '../types/inventory';
import type { ProductStatus } from '../types/product';

const { Paragraph, Text, Title } = Typography;
const { RangePicker } = DatePicker;

const transactionLabels: Record<InventoryTransactionType, string> = {
  IMPORT: 'Nhập kho',
  SALE: 'Bán hàng',
  RETURN: 'Hoàn hàng',
  ADJUSTMENT: 'Điều chỉnh',
  CANCEL_ORDER: 'Hủy đơn',
};

const transactionColors: Record<InventoryTransactionType, string> = {
  IMPORT: 'green',
  SALE: 'blue',
  RETURN: 'cyan',
  ADJUSTMENT: 'gold',
  CANCEL_ORDER: 'volcano',
};

const stockTag = (stock: number, threshold: number) => {
  if (stock === 0) return <Tag color="error">Hết hàng</Tag>;
  if (stock <= threshold) return <Tag color="warning">Sắp hết</Tag>;
  return <Tag color="success">Còn hàng</Tag>;
};

export function InventoryPage() {
  const { message } = AntApp.useApp();
  const [activeTab, setActiveTab] = useState('inventory');
  const [products, setProducts] = useState<InventoryProduct[]>([]);
  const [inventoryLoading, setInventoryLoading] = useState(true);
  const [inventoryError, setInventoryError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [status, setStatus] = useState<ProductStatus>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);

  const [threshold, setThreshold] = useState(5);
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);
  const [lowStockLoading, setLowStockLoading] = useState(true);
  const [lowStockError, setLowStockError] = useState<string | null>(null);

  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [transactionLoading, setTransactionLoading] = useState(true);
  const [transactionError, setTransactionError] = useState<string | null>(null);
  const [transactionType, setTransactionType] = useState<InventoryTransactionType>();
  const [transactionDates, setTransactionDates] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  const [transactionPage, setTransactionPage] = useState(1);
  const [transactionPageSize, setTransactionPageSize] = useState(20);
  const [transactionTotal, setTransactionTotal] = useState(0);

  const [modalMode, setModalMode] = useState<'import' | 'adjust'>('import');
  const [stockTarget, setStockTarget] = useState<StockTarget | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [search]);

  const inventoryQuery = useMemo<InventoryQuery>(() => ({
    page,
    limit: pageSize,
    search: debouncedSearch || undefined,
    status,
  }), [debouncedSearch, page, pageSize, status]);

  const transactionQuery = useMemo<InventoryTransactionQuery>(() => ({
    page: transactionPage,
    limit: transactionPageSize,
    type: transactionType,
    dateFrom: transactionDates?.[0]?.startOf('day').toISOString(),
    dateTo: transactionDates?.[1]?.endOf('day').toISOString(),
  }), [transactionDates, transactionPage, transactionPageSize, transactionType]);

  const loadInventory = useCallback(async () => {
    setInventoryLoading(true);
    setInventoryError(null);
    try {
      const data = await inventoryApi.listInventory(inventoryQuery);
      setProducts(data.products);
      setTotal(data.pagination.total);
    } catch (error) {
      setInventoryError(getApiErrorMessage(error, 'Không thể tải dữ liệu tồn kho.'));
    } finally {
      setInventoryLoading(false);
    }
  }, [inventoryQuery]);

  const loadLowStock = useCallback(async () => {
    setLowStockLoading(true);
    setLowStockError(null);
    try {
      const data = await inventoryApi.listLowStock(threshold);
      setLowStockItems(data.items);
    } catch (error) {
      setLowStockError(getApiErrorMessage(error, 'Không thể tải danh sách hàng sắp hết.'));
    } finally {
      setLowStockLoading(false);
    }
  }, [threshold]);

  const loadTransactions = useCallback(async () => {
    setTransactionLoading(true);
    setTransactionError(null);
    try {
      const data = await inventoryApi.listTransactions(transactionQuery);
      setTransactions(data.transactions);
      setTransactionTotal(data.pagination.total);
    } catch (error) {
      setTransactionError(getApiErrorMessage(error, 'Không thể tải lịch sử tồn kho.'));
    } finally {
      setTransactionLoading(false);
    }
  }, [transactionQuery]);

  useEffect(() => { void loadInventory(); }, [loadInventory]);
  useEffect(() => { void loadLowStock(); }, [loadLowStock]);
  useEffect(() => { void loadTransactions(); }, [loadTransactions]);

  const openProductModal = (product: InventoryProduct, mode: 'import' | 'adjust') => {
    setModalMode(mode);
    setStockTarget({
      productId: product.id,
      productName: product.name,
      productSku: product.sku,
      variantId: null,
      variantName: null,
      variantSku: null,
      stock: product.stock,
    });
  };

  const openVariantModal = (product: InventoryProduct, variant: InventoryVariant, mode: 'import' | 'adjust') => {
    setModalMode(mode);
    setStockTarget({
      productId: product.id,
      productName: product.name,
      productSku: product.sku,
      variantId: variant.id,
      variantName: variant.variantName,
      variantSku: variant.sku,
      stock: variant.stock,
    });
  };

  const openLowStockModal = (item: LowStockItem, mode: 'import' | 'adjust') => {
    setModalMode(mode);
    setStockTarget({
      productId: item.product.id,
      productName: item.product.name,
      productSku: item.product.sku,
      variantId: item.variant?.id ?? null,
      variantName: item.variant?.name ?? null,
      variantSku: item.variant?.sku ?? null,
      stock: item.stock,
    });
  };

  const handleStockChange = async (input: InventoryChangeInput) => {
    setSubmitting(true);
    try {
      if (modalMode === 'import') await inventoryApi.importStock(input);
      else await inventoryApi.adjustStock(input);
      message.success(modalMode === 'import' ? 'Đã nhập kho thành công.' : 'Đã điều chỉnh tồn kho.');
      setStockTarget(null);
      await Promise.all([loadInventory(), loadLowStock(), loadTransactions()]);
    } catch (error) {
      message.error(getApiErrorMessage(error, 'Không thể cập nhật tồn kho.'));
    } finally {
      setSubmitting(false);
    }
  };

  const actionButtons = (onImport: () => void, onAdjust: () => void) => (
    <Space size={2}>
      <Tooltip title="Nhập thêm hàng"><Button type="text" icon={<ExportOutlined rotate={-90} />} onClick={onImport} /></Tooltip>
      <Tooltip title="Điều chỉnh tồn kho"><Button type="text" icon={<EditOutlined />} onClick={onAdjust} /></Tooltip>
    </Space>
  );

  const variantColumns = (product: InventoryProduct): TableColumnsType<InventoryVariant> => [
    {
      title: 'Phiên bản', dataIndex: 'variantName', key: 'variantName',
      render: (value: string, record) => <div className="table-primary-cell"><strong>{value}</strong><span>{record.sku}</span></div>,
    },
    { title: 'Tồn kho', dataIndex: 'stock', key: 'stock', width: 100, align: 'center' },
    { title: 'Đã bán', dataIndex: 'soldCount', key: 'soldCount', width: 100, align: 'center' },
    { title: 'Tình trạng', key: 'stockStatus', width: 115, render: (_, record) => stockTag(record.stock, threshold) },
    { title: 'Cập nhật', dataIndex: 'updatedAt', key: 'updatedAt', width: 145, render: (value: string) => dayjs(value).format('DD/MM/YYYY HH:mm') },
    {
      title: 'Thao tác', key: 'actions', width: 100,
      render: (_, record) => actionButtons(
        () => openVariantModal(product, record, 'import'),
        () => openVariantModal(product, record, 'adjust'),
      ),
    },
  ];

  const productColumns: TableColumnsType<InventoryProduct> = [
    {
      title: 'Sản phẩm', dataIndex: 'name', key: 'name', width: 280,
      render: (value: string, record) => (
        <div className="table-primary-cell">
          <strong>{value}</strong>
          <span>{record.sku}{record.hasVariants ? ` · ${record.variants.length} phiên bản` : ''}</span>
        </div>
      ),
    },
    { title: 'Tồn kho', dataIndex: 'stock', key: 'stock', width: 100, align: 'center' },
    { title: 'Đã bán', dataIndex: 'soldCount', key: 'soldCount', width: 100, align: 'center' },
    { title: 'Tình trạng', key: 'stockStatus', width: 115, render: (_, record) => stockTag(record.stock, threshold) },
    {
      title: 'Trạng thái', dataIndex: 'status', key: 'status', width: 115,
      render: (value: ProductStatus) => <Tag color={value === 'ACTIVE' ? 'success' : 'default'}>{value === 'ACTIVE' ? 'Đang bán' : 'Ngừng bán'}</Tag>,
    },
    { title: 'Cập nhật', dataIndex: 'updatedAt', key: 'updatedAt', width: 145, render: (value: string) => dayjs(value).format('DD/MM/YYYY HH:mm') },
    {
      title: 'Thao tác', key: 'actions', width: 100,
      render: (_, record) => record.hasVariants
        ? <Text type="secondary">Mở phiên bản</Text>
        : actionButtons(() => openProductModal(record, 'import'), () => openProductModal(record, 'adjust')),
    },
  ];

  const lowStockColumns: TableColumnsType<LowStockItem> = [
    {
      title: 'Sản phẩm', key: 'product',
      render: (_, record) => <div className="table-primary-cell"><strong>{record.product.name}</strong><span>{record.product.sku}</span></div>,
    },
    {
      title: 'Phiên bản', key: 'variant',
      render: (_, record) => record.variant
        ? <div className="table-primary-cell"><strong>{record.variant.name}</strong><span>{record.variant.sku}</span></div>
        : <Text type="secondary">Không có</Text>,
    },
    { title: 'Tồn kho', dataIndex: 'stock', key: 'stock', width: 110, align: 'center', render: (value: number) => <strong className="low-stock-value">{value}</strong> },
    { title: 'Tình trạng', key: 'status', width: 115, render: (_, record) => stockTag(record.stock, threshold) },
    {
      title: 'Thao tác', key: 'actions', width: 100,
      render: (_, record) => actionButtons(() => openLowStockModal(record, 'import'), () => openLowStockModal(record, 'adjust')),
    },
  ];

  const transactionColumns: TableColumnsType<InventoryTransaction> = [
    {
      title: 'Sản phẩm', key: 'product', width: 240,
      render: (_, record) => (
        <div className="table-primary-cell">
          <strong>{record.product.name}</strong>
          <span>{record.variant ? `${record.variant.name} · ${record.variant.sku}` : record.product.sku}</span>
        </div>
      ),
    },
    { title: 'Loại', dataIndex: 'type', key: 'type', width: 120, render: (value: InventoryTransactionType) => <Tag color={transactionColors[value]}>{transactionLabels[value]}</Tag> },
    { title: 'Thay đổi', dataIndex: 'quantity', key: 'quantity', width: 100, align: 'right', render: (value: number) => <strong className={value >= 0 ? 'stock-positive' : 'stock-negative'}>{value > 0 ? `+${value}` : value}</strong> },
    { title: 'Tồn sau', dataIndex: 'stockAfter', key: 'stockAfter', width: 90, align: 'center' },
    {
      title: 'Tham chiếu', key: 'reference', width: 130,
      render: (_, record) => record.referenceType ? `${record.referenceType}${record.referenceId ? ` #${record.referenceId}` : ''}` : <Text type="secondary">—</Text>,
    },
    { title: 'Ghi chú', dataIndex: 'note', key: 'note', ellipsis: true, render: (value: string | null) => value || <Text type="secondary">—</Text> },
    { title: 'Người tạo', key: 'createdBy', width: 140, render: (_, record) => record.createdBy?.fullName || <Text type="secondary">Hệ thống</Text> },
    { title: 'Thời gian', dataIndex: 'createdAt', key: 'createdAt', width: 145, render: (value: string) => dayjs(value).format('DD/MM/YYYY HH:mm') },
  ];

  const inventoryContent = (
    <>
      {inventoryError && <Alert className="content-alert" type="error" showIcon message={inventoryError} action={<Button size="small" icon={<ReloadOutlined />} onClick={() => void loadInventory()}>Thử lại</Button>} />}
      <div className="inventory-toolbar">
        <Input allowClear value={search} prefix={<SearchOutlined />} placeholder="Tìm tên hoặc SKU" onChange={(event) => setSearch(event.target.value)} />
        <Select allowClear value={status} placeholder="Trạng thái sản phẩm" options={[{ value: 'ACTIVE', label: 'Đang bán' }, { value: 'INACTIVE', label: 'Ngừng bán' }]} onChange={(value) => { setStatus(value); setPage(1); }} />
        <Button icon={<ReloadOutlined />} onClick={() => void loadInventory()}>Làm mới</Button>
      </div>
      <Table<InventoryProduct>
        rowKey="id" columns={productColumns} dataSource={products} loading={inventoryLoading} scroll={{ x: 980 }}
        expandable={{
          rowExpandable: (record) => record.hasVariants,
          expandedRowRender: (record) => <Table<InventoryVariant> rowKey="id" size="small" columns={variantColumns(record)} dataSource={record.variants} pagination={false} locale={{ emptyText: 'Sản phẩm chưa có phiên bản' }} />,
        }}
        pagination={{
          current: page, pageSize, total, showSizeChanger: true, pageSizeOptions: [10, 20, 50, 100],
          showTotal: (count) => `Tổng ${count} sản phẩm`,
          onChange: (nextPage, nextSize) => { setPage(nextSize === pageSize ? nextPage : 1); setPageSize(nextSize); },
        }}
        locale={{ emptyText: inventoryError ? 'Không có dữ liệu để hiển thị' : 'Chưa có sản phẩm phù hợp' }}
      />
    </>
  );

  const lowStockContent = (
    <>
      {lowStockError && <Alert className="content-alert" type="error" showIcon message={lowStockError} action={<Button size="small" icon={<ReloadOutlined />} onClick={() => void loadLowStock()}>Thử lại</Button>} />}
      <div className="inventory-toolbar inventory-toolbar--low-stock">
        <Space><Text>Ngưỡng cảnh báo:</Text><InputNumber min={0} precision={0} value={threshold} onChange={(value) => setThreshold(value ?? 0)} /></Space>
        <Text type="secondary">Hiển thị mặt hàng có tồn kho nhỏ hơn hoặc bằng ngưỡng.</Text>
        <Button icon={<ReloadOutlined />} onClick={() => void loadLowStock()}>Làm mới</Button>
      </div>
      <Table<LowStockItem>
        rowKey={(record) => `${record.product.id}-${record.variant?.id ?? 'product'}`}
        columns={lowStockColumns} dataSource={lowStockItems} loading={lowStockLoading} scroll={{ x: 760 }}
        pagination={{ pageSize: 20, showSizeChanger: true, showTotal: (count) => `${count} mặt hàng sắp hết` }}
        locale={{ emptyText: lowStockError ? 'Không có dữ liệu để hiển thị' : 'Không có mặt hàng nào dưới ngưỡng cảnh báo' }}
      />
    </>
  );

  const transactionContent = (
    <>
      {transactionError && <Alert className="content-alert" type="error" showIcon message={transactionError} action={<Button size="small" icon={<ReloadOutlined />} onClick={() => void loadTransactions()}>Thử lại</Button>} />}
      <div className="inventory-toolbar inventory-toolbar--history">
        <Select allowClear value={transactionType} placeholder="Loại giao dịch" options={Object.entries(transactionLabels).map(([value, label]) => ({ value, label }))} onChange={(value) => { setTransactionType(value); setTransactionPage(1); }} />
        <RangePicker value={transactionDates} format="DD/MM/YYYY" placeholder={['Từ ngày', 'Đến ngày']} onChange={(value) => { setTransactionDates(value ? [value[0], value[1]] : null); setTransactionPage(1); }} />
        <Button icon={<ReloadOutlined />} onClick={() => void loadTransactions()}>Làm mới</Button>
      </div>
      <Table<InventoryTransaction>
        rowKey="id" columns={transactionColumns} dataSource={transactions} loading={transactionLoading} scroll={{ x: 1180 }}
        pagination={{
          current: transactionPage, pageSize: transactionPageSize, total: transactionTotal, showSizeChanger: true,
          pageSizeOptions: [10, 20, 50, 100], showTotal: (count) => `Tổng ${count} giao dịch`,
          onChange: (nextPage, nextSize) => { setTransactionPage(nextSize === transactionPageSize ? nextPage : 1); setTransactionPageSize(nextSize); },
        }}
        locale={{ emptyText: transactionError ? 'Không có dữ liệu để hiển thị' : 'Chưa có giao dịch kho phù hợp' }}
      />
    </>
  );

  return (
    <section aria-labelledby="inventory-title">
      <div className="page-heading">
        <Text className="eyebrow">VẬN HÀNH KHO</Text>
        <Title id="inventory-title" level={2}>Quản lý tồn kho</Title>
        <Paragraph>Theo dõi số lượng, nhập hàng và kiểm tra toàn bộ lịch sử thay đổi kho.</Paragraph>
      </div>
      <Card className="management-card inventory-card" bordered={false}>
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={[
          { key: 'inventory', label: <span><InboxOutlined /> Tồn kho</span>, children: inventoryContent },
          { key: 'low-stock', label: <span><WarningOutlined /> Sắp hết <Tag color="warning">{lowStockItems.length}</Tag></span>, children: lowStockContent },
          { key: 'history', label: <span><HistoryOutlined /> Lịch sử</span>, children: transactionContent },
        ]} />
      </Card>
      <StockChangeModal mode={modalMode} target={stockTarget} open={stockTarget !== null} submitting={submitting} onCancel={() => setStockTarget(null)} onSubmit={handleStockChange} />
    </section>
  );
}
