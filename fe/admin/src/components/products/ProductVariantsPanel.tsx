import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import {
  Alert,
  App as AntApp,
  Avatar,
  Button,
  Card,
  Popconfirm,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
  type TableColumnsType,
} from 'antd';
import { useMemo, useState } from 'react';

import * as productApi from '../../api/productApi';
import { getApiErrorMessage } from '../../api/axiosClient';
import type { CategoryAttribute } from '../../types/catalog';
import type { ProductVariant, ProductVariantInput } from '../../types/product';
import { VariantFormModal } from './VariantFormModal';

const { Text } = Typography;
const moneyFormatter = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });

interface ProductVariantsPanelProps {
  productId: number;
  enabled: boolean;
  variants: ProductVariant[];
  categoryAttributes: CategoryAttribute[];
  onChanged: () => Promise<void>;
}

export function ProductVariantsPanel({
  productId,
  enabled,
  variants,
  categoryAttributes,
  onChanged,
}: ProductVariantsPanelProps) {
  const { message } = AntApp.useApp();
  const [formOpen, setFormOpen] = useState(false);
  const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const totalStock = useMemo(() => variants.reduce((sum, item) => sum + item.stock, 0), [variants]);

  const openCreate = () => {
    setEditingVariant(null);
    setFormOpen(true);
  };

  const handleSubmit = async (input: ProductVariantInput) => {
    setSubmitting(true);
    try {
      if (editingVariant) {
        const { stock: _stock, ...updateInput } = input;
        await productApi.updateVariant(editingVariant.id, updateInput);
        message.success('Đã cập nhật phiên bản.');
      } else {
        await productApi.createVariant(productId, input);
        message.success('Đã tạo phiên bản.');
      }
      setFormOpen(false);
      setEditingVariant(null);
      await onChanged();
    } catch (requestError) {
      message.error(getApiErrorMessage(requestError, 'Không thể lưu phiên bản.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (variant: ProductVariant) => {
    setDeletingId(variant.id);
    try {
      await productApi.deleteVariant(variant.id);
      message.success('Đã xóa phiên bản.');
      await onChanged();
    } catch (requestError) {
      message.error(getApiErrorMessage(requestError, 'Không thể xóa phiên bản.'));
    } finally {
      setDeletingId(null);
    }
  };

  const columns: TableColumnsType<ProductVariant> = [
    {
      title: 'Phiên bản',
      dataIndex: 'variantName',
      key: 'variantName',
      width: 220,
      render: (value: string, record) => (
        <div className="category-name-cell">
          <Avatar shape="square" src={record.imageUrl || undefined}>{value.slice(0, 1)}</Avatar>
          <div className="table-primary-cell"><strong>{value}</strong><span>{record.sku}</span></div>
        </div>
      ),
    },
    {
      title: 'Thuộc tính',
      dataIndex: 'attributes',
      key: 'attributes',
      width: 220,
      render: (value: Record<string, unknown> | null) => value && Object.keys(value).length
        ? <Space size={[4, 4]} wrap>{Object.entries(value).map(([key, item]) => <Tag key={key}>{String(item)}</Tag>)}</Space>
        : <Text type="secondary">—</Text>,
    },
    {
      title: 'Giá',
      key: 'price',
      width: 145,
      render: (_, record) => (
        <div className="price-cell">
          <strong>{moneyFormatter.format(record.salePrice ?? record.price)}</strong>
          {record.salePrice !== null && <del>{moneyFormatter.format(record.price)}</del>}
        </div>
      ),
    },
    { title: 'Tồn kho', dataIndex: 'stock', key: 'stock', width: 90, align: 'center' },
    { title: 'Đã bán', dataIndex: 'soldCount', key: 'soldCount', width: 90, align: 'center' },
    {
      title: 'Trạng thái', dataIndex: 'status', key: 'status', width: 100,
      render: (value: ProductVariant['status']) => <Tag color={value === 'ACTIVE' ? 'success' : 'default'}>{value === 'ACTIVE' ? 'Đang bán' : 'Đang ẩn'}</Tag>,
    },
    {
      title: 'Thao tác', key: 'actions', width: 105, fixed: 'right',
      render: (_, record) => (
        <Space size={2}>
          <Tooltip title="Sửa phiên bản">
            <Button type="text" icon={<EditOutlined />} onClick={() => { setEditingVariant(record); setFormOpen(true); }} />
          </Tooltip>
          <Popconfirm title="Xóa phiên bản?" description="Phiên bản phải hết tồn kho và chưa có lịch sử đơn hàng."
            okText="Xóa" cancelText="Hủy" okButtonProps={{ danger: true, loading: deletingId === record.id }}
            onConfirm={() => handleDelete(record)}>
            <Tooltip title="Xóa phiên bản"><Button danger type="text" icon={<DeleteOutlined />} /></Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Card
        className="form-section-card"
        bordered={false}
        title={<span>Phiên bản <Tag color="blue">Tồn kho tổng: {totalStock}</Tag></span>}
        extra={<Button type="primary" icon={<PlusOutlined />} disabled={!enabled} onClick={openCreate}>Thêm phiên bản</Button>}
      >
        {!enabled ? (
          <Alert type="info" showIcon message="Bật “Sản phẩm có phiên bản” và lưu sản phẩm trước khi thêm phiên bản." />
        ) : (
          <Table<ProductVariant> rowKey="id" columns={columns} dataSource={variants} pagination={false}
            scroll={{ x: 900 }} locale={{ emptyText: 'Sản phẩm chưa có phiên bản' }} />
        )}
      </Card>

      <VariantFormModal open={formOpen} variant={editingVariant} categoryAttributes={categoryAttributes}
        submitting={submitting} onCancel={() => setFormOpen(false)} onSubmit={handleSubmit} />
    </>
  );
}
