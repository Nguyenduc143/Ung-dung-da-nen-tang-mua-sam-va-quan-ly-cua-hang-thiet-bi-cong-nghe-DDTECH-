import {
  ApartmentOutlined,
  AppstoreOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  SlidersOutlined,
} from '@ant-design/icons';
import {
  Alert,
  App as AntApp,
  Avatar,
  Button,
  Card,
  Input,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
  type TableColumnsType,
} from 'antd';
import dayjs from 'dayjs';
import { useCallback, useMemo, useState, useEffect } from 'react';

import * as categoryApi from '../api/categoryApi';
import { getApiErrorMessage } from '../api/axiosClient';
import { CategoryAttributesDrawer } from '../components/categories/CategoryAttributesDrawer';
import { CategoryFormModal } from '../components/categories/CategoryFormModal';
import type { Category, CategoryInput, CatalogStatus } from '../types/catalog';

const { Paragraph, Text, Title } = Typography;

type StatusFilter = CatalogStatus | 'ALL';

export function CategoriesPage() {
  const { message } = AntApp.useApp();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('ALL');
  const [formOpen, setFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [attributeCategory, setAttributeCategory] = useState<Category | null>(null);

  const loadCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setCategories(await categoryApi.listCategories());
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Không thể tải danh sách danh mục.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  const categoryById = useMemo(() => new Map(
    categories.map((category) => [category.id, category]),
  ), [categories]);

  const filteredCategories = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase('vi');
    return categories.filter((category) => {
      const parentName = category.parentId ? categoryById.get(category.parentId)?.name ?? '' : '';
      const matchesSearch = !keyword || [category.name, category.slug, parentName]
        .some((value) => value.toLocaleLowerCase('vi').includes(keyword));
      const matchesStatus = status === 'ALL' || category.status === status;
      return matchesSearch && matchesStatus;
    });
  }, [categories, categoryById, search, status]);

  const openCreateForm = () => {
    setEditingCategory(null);
    setFormOpen(true);
  };

  const openEditForm = (category: Category) => {
    setEditingCategory(category);
    setFormOpen(true);
  };

  const handleSubmit = async (input: CategoryInput) => {
    setSubmitting(true);
    try {
      if (editingCategory) {
        await categoryApi.updateCategory(editingCategory.id, input);
        message.success('Đã cập nhật danh mục.');
      } else {
        await categoryApi.createCategory(input);
        message.success('Đã tạo danh mục.');
      }
      setFormOpen(false);
      setEditingCategory(null);
      await loadCategories();
    } catch (requestError) {
      message.error(getApiErrorMessage(requestError, 'Không thể lưu danh mục.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (category: Category) => {
    setDeletingId(category.id);
    try {
      await categoryApi.deleteCategory(category.id);
      if (attributeCategory?.id === category.id) setAttributeCategory(null);
      message.success('Đã xóa danh mục.');
      await loadCategories();
    } catch (requestError) {
      message.error(getApiErrorMessage(requestError, 'Không thể xóa danh mục.'));
    } finally {
      setDeletingId(null);
    }
  };

  const columns: TableColumnsType<Category> = [
    {
      title: 'Danh mục',
      dataIndex: 'name',
      key: 'name',
      width: 240,
      sorter: (a, b) => a.name.localeCompare(b.name, 'vi'),
      render: (value: string, record) => (
        <div className="category-name-cell">
          <Avatar
            shape="square"
            size={42}
            src={record.imageUrl || undefined}
            icon={<AppstoreOutlined />}
          />
          <div className="table-primary-cell">
            <strong>{value}</strong>
            <span>{record.slug}</span>
          </div>
        </div>
      ),
    },
    {
      title: 'Danh mục cha',
      dataIndex: 'parentId',
      key: 'parentId',
      width: 170,
      render: (parentId: number | null) => (
        parentId ? categoryById.get(parentId)?.name ?? `#${parentId}` : <Text type="secondary">Danh mục gốc</Text>
      ),
    },
    {
      title: 'Thứ tự',
      dataIndex: 'sortOrder',
      key: 'sortOrder',
      width: 90,
      align: 'center',
      sorter: (a, b) => a.sortOrder - b.sortOrder,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 125,
      render: (value: CatalogStatus) => (
        <Tag color={value === 'ACTIVE' ? 'success' : 'default'}>
          {value === 'ACTIVE' ? 'Hiển thị' : 'Đang ẩn'}
        </Tag>
      ),
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 145,
      render: (value: string) => dayjs(value).format('DD/MM/YYYY HH:mm'),
      sorter: (a, b) => dayjs(a.createdAt).valueOf() - dayjs(b.createdAt).valueOf(),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Space size={2}>
          <Tooltip title="Quản lý thuộc tính">
            <Button type="text" icon={<SlidersOutlined />} onClick={() => setAttributeCategory(record)} />
          </Tooltip>
          <Tooltip title="Sửa danh mục">
            <Button type="text" icon={<EditOutlined />} onClick={() => openEditForm(record)} />
          </Tooltip>
          <Popconfirm
            title="Xóa danh mục?"
            description="Danh mục sẽ bị ẩn khỏi hệ thống."
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true, loading: deletingId === record.id }}
            onConfirm={() => handleDelete(record)}
          >
            <Tooltip title="Xóa danh mục">
              <Button danger type="text" icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <section aria-labelledby="categories-title">
      <div className="page-heading page-heading--actions">
        <div>
          <Text className="eyebrow">DANH MỤC SẢN PHẨM</Text>
          <Title id="categories-title" level={2}>Quản lý danh mục</Title>
          <Paragraph>Tổ chức danh mục, cấu trúc cha–con và các thuộc tính sản phẩm.</Paragraph>
        </div>
        <Button type="primary" size="large" icon={<PlusOutlined />} onClick={openCreateForm}>
          Thêm danh mục
        </Button>
      </div>

      {error && (
        <Alert
          className="content-alert"
          type="error"
          showIcon
          message={error}
          action={<Button size="small" icon={<ReloadOutlined />} onClick={() => void loadCategories()}>Thử lại</Button>}
        />
      )}

      <Card className="management-card" bordered={false}>
        <div className="table-toolbar">
          <Input
            allowClear
            value={search}
            prefix={<SearchOutlined />}
            placeholder="Tìm theo tên, slug hoặc danh mục cha"
            onChange={(event) => setSearch(event.target.value)}
          />
          <Select<StatusFilter>
            value={status}
            onChange={setStatus}
            options={[
              { value: 'ALL', label: 'Tất cả trạng thái' },
              { value: 'ACTIVE', label: 'Đang hiển thị' },
              { value: 'HIDDEN', label: 'Đang ẩn' },
            ]}
          />
          <div className="result-count">
            <ApartmentOutlined /> {filteredCategories.length} danh mục
          </div>
        </div>

        <Table<Category>
          rowKey="id"
          columns={columns}
          dataSource={filteredCategories}
          loading={loading}
          scroll={{ x: 920 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            pageSizeOptions: [10, 20, 50],
            showTotal: (total) => `Tổng ${total} danh mục`,
          }}
          locale={{
            emptyText: error ? 'Không có dữ liệu để hiển thị' : 'Chưa có danh mục phù hợp',
          }}
        />
      </Card>

      <CategoryFormModal
        open={formOpen}
        category={editingCategory}
        categories={categories}
        submitting={submitting}
        onCancel={() => setFormOpen(false)}
        onSubmit={handleSubmit}
      />

      <CategoryAttributesDrawer
        category={attributeCategory}
        onClose={() => setAttributeCategory(null)}
      />
    </section>
  );
}
