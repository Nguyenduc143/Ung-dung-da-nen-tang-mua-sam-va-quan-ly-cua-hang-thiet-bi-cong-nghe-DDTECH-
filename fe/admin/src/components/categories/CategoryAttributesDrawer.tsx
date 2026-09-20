import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import {
  Alert,
  App as AntApp,
  Button,
  Drawer,
  Popconfirm,
  Space,
  Table,
  Tag,
  Tooltip,
  type TableColumnsType,
} from 'antd';
import { useCallback, useEffect, useState } from 'react';

import * as categoryApi from '../../api/categoryApi';
import { getApiErrorMessage } from '../../api/axiosClient';
import type { Category, CategoryAttribute, CategoryAttributeInput } from '../../types/catalog';
import { AttributeFormModal } from './AttributeFormModal';

interface CategoryAttributesDrawerProps {
  category: Category | null;
  onClose: () => void;
}

const inputTypeLabels = {
  TEXT: 'Văn bản',
  NUMBER: 'Số',
  SELECT: 'Lựa chọn',
};

export function CategoryAttributesDrawer({ category, onClose }: CategoryAttributesDrawerProps) {
  const { message } = AntApp.useApp();
  const [attributes, setAttributes] = useState<CategoryAttribute[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingAttribute, setEditingAttribute] = useState<CategoryAttribute | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadAttributes = useCallback(async () => {
    if (!category) return;
    setLoading(true);
    setError(null);
    try {
      setAttributes(await categoryApi.listCategoryAttributes(category.id));
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Không thể tải thuộc tính danh mục.'));
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => {
    setAttributes([]);
    setEditingAttribute(null);
    setFormOpen(false);
    if (category) void loadAttributes();
  }, [category, loadAttributes]);

  const openCreateForm = () => {
    setEditingAttribute(null);
    setFormOpen(true);
  };

  const openEditForm = (attribute: CategoryAttribute) => {
    setEditingAttribute(attribute);
    setFormOpen(true);
  };

  const handleSubmit = async (input: CategoryAttributeInput) => {
    if (!category) return;
    setSubmitting(true);
    try {
      if (editingAttribute) {
        await categoryApi.updateCategoryAttribute(editingAttribute.id, input);
        message.success('Đã cập nhật thuộc tính.');
      } else {
        await categoryApi.createCategoryAttribute(category.id, input);
        message.success('Đã thêm thuộc tính.');
      }
      setFormOpen(false);
      setEditingAttribute(null);
      await loadAttributes();
    } catch (requestError) {
      message.error(getApiErrorMessage(requestError, 'Không thể lưu thuộc tính.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (attribute: CategoryAttribute) => {
    setDeletingId(attribute.id);
    try {
      await categoryApi.deleteCategoryAttribute(attribute.id);
      message.success('Đã xóa thuộc tính.');
      await loadAttributes();
    } catch (requestError) {
      message.error(getApiErrorMessage(requestError, 'Không thể xóa thuộc tính.'));
    } finally {
      setDeletingId(null);
    }
  };

  const columns: TableColumnsType<CategoryAttribute> = [
    {
      title: 'Thuộc tính',
      dataIndex: 'attrName',
      key: 'attrName',
      width: 190,
      render: (value: string, record) => (
        <div className="table-primary-cell">
          <strong>{value}</strong>
          <span>{record.attrKey}</span>
        </div>
      ),
    },
    {
      title: 'Kiểu',
      dataIndex: 'inputType',
      key: 'inputType',
      width: 110,
      render: (value: CategoryAttribute['inputType']) => inputTypeLabels[value],
    },
    {
      title: 'Đơn vị',
      dataIndex: 'unit',
      key: 'unit',
      width: 90,
      render: (value: string | null) => value || '—',
    },
    {
      title: 'Lọc',
      dataIndex: 'isFilterable',
      key: 'isFilterable',
      width: 85,
      render: (value: boolean) => (
        <Tag color={Boolean(value) ? 'blue' : 'default'}>{Boolean(value) ? 'Có' : 'Không'}</Tag>
      ),
    },
    {
      title: 'Thứ tự',
      dataIndex: 'sortOrder',
      key: 'sortOrder',
      width: 80,
      align: 'center',
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 105,
      fixed: 'right',
      render: (_, record) => (
        <Space size={4}>
          <Tooltip title="Sửa thuộc tính">
            <Button type="text" icon={<EditOutlined />} onClick={() => openEditForm(record)} />
          </Tooltip>
          <Popconfirm
            title="Xóa thuộc tính?"
            description="Thao tác này không thể hoàn tác."
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true, loading: deletingId === record.id }}
            onConfirm={() => handleDelete(record)}
          >
            <Tooltip title="Xóa thuộc tính">
              <Button danger type="text" icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Drawer
        open={Boolean(category)}
        title={category ? `Thuộc tính · ${category.name}` : 'Thuộc tính danh mục'}
        width="min(820px, 100vw)"
        onClose={onClose}
        destroyOnHidden
        extra={(
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreateForm}>
            Thêm thuộc tính
          </Button>
        )}
      >
        {error && (
          <Alert
            className="content-alert"
            type="error"
            showIcon
            message={error}
            action={<Button size="small" icon={<ReloadOutlined />} onClick={() => void loadAttributes()}>Thử lại</Button>}
          />
        )}
        <Table<CategoryAttribute>
          rowKey="id"
          columns={columns}
          dataSource={attributes}
          loading={loading}
          pagination={false}
          scroll={{ x: 680 }}
          locale={{ emptyText: error ? 'Không có dữ liệu để hiển thị' : 'Danh mục chưa có thuộc tính' }}
        />
      </Drawer>

      <AttributeFormModal
        open={formOpen}
        attribute={editingAttribute}
        submitting={submitting}
        onCancel={() => setFormOpen(false)}
        onSubmit={handleSubmit}
      />
    </>
  );
}
