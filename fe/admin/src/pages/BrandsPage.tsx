import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  TagsOutlined,
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
import { useCallback, useEffect, useMemo, useState } from 'react';

import * as brandApi from '../api/brandApi';
import { getApiErrorMessage } from '../api/axiosClient';
import { BrandFormModal } from '../components/brands/BrandFormModal';
import type { Brand, BrandInput, CatalogStatus } from '../types/catalog';

const { Paragraph, Text, Title } = Typography;
type StatusFilter = CatalogStatus | 'ALL';

export function BrandsPage() {
  const { message } = AntApp.useApp();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('ALL');
  const [formOpen, setFormOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadBrands = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setBrands(await brandApi.listBrands());
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Không thể tải danh sách thương hiệu.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadBrands();
  }, [loadBrands]);

  const filteredBrands = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase('vi');
    return brands.filter((brand) => {
      const matchesSearch = !keyword || [brand.name, brand.slug, brand.description ?? '']
        .some((value) => value.toLocaleLowerCase('vi').includes(keyword));
      const matchesStatus = status === 'ALL' || brand.status === status;
      return matchesSearch && matchesStatus;
    });
  }, [brands, search, status]);

  const openCreateForm = () => {
    setEditingBrand(null);
    setFormOpen(true);
  };

  const openEditForm = (brand: Brand) => {
    setEditingBrand(brand);
    setFormOpen(true);
  };

  const handleSubmit = async (input: BrandInput) => {
    setSubmitting(true);
    try {
      if (editingBrand) {
        await brandApi.updateBrand(editingBrand.id, input);
        message.success('Đã cập nhật thương hiệu.');
      } else {
        await brandApi.createBrand(input);
        message.success('Đã tạo thương hiệu.');
      }
      setFormOpen(false);
      setEditingBrand(null);
      await loadBrands();
    } catch (requestError) {
      message.error(getApiErrorMessage(requestError, 'Không thể lưu thương hiệu.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (brand: Brand) => {
    setDeletingId(brand.id);
    try {
      await brandApi.deleteBrand(brand.id);
      message.success('Đã ẩn thương hiệu khỏi hệ thống.');
      await loadBrands();
    } catch (requestError) {
      message.error(getApiErrorMessage(requestError, 'Không thể xóa thương hiệu.'));
    } finally {
      setDeletingId(null);
    }
  };

  const columns: TableColumnsType<Brand> = [
    {
      title: 'Thương hiệu',
      dataIndex: 'name',
      key: 'name',
      width: 280,
      sorter: (a, b) => a.name.localeCompare(b.name, 'vi'),
      render: (value: string, record) => (
        <div className="category-name-cell">
          <Avatar
            className="brand-logo-cell"
            shape="square"
            size={46}
            src={record.logoUrl || undefined}
            icon={<TagsOutlined />}
          />
          <div className="table-primary-cell">
            <strong>{value}</strong>
            <span>{record.slug}</span>
          </div>
        </div>
      ),
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (value: string | null) => value || <Text type="secondary">Chưa có mô tả</Text>,
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
      width: 110,
      fixed: 'right',
      render: (_, record) => (
        <Space size={2}>
          <Tooltip title="Sửa thương hiệu">
            <Button type="text" icon={<EditOutlined />} onClick={() => openEditForm(record)} />
          </Tooltip>
          <Popconfirm
            title="Ẩn thương hiệu?"
            description="Thương hiệu sẽ không còn xuất hiện trong hệ thống công khai."
            okText="Ẩn thương hiệu"
            cancelText="Hủy"
            okButtonProps={{ danger: true, loading: deletingId === record.id }}
            onConfirm={() => handleDelete(record)}
          >
            <Tooltip title="Ẩn thương hiệu">
              <Button danger type="text" icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <section aria-labelledby="brands-title">
      <div className="page-heading page-heading--actions">
        <div>
          <Text className="eyebrow">THƯƠNG HIỆU SẢN PHẨM</Text>
          <Title id="brands-title" level={2}>Quản lý thương hiệu</Title>
          <Paragraph>Cập nhật thông tin và trạng thái các thương hiệu đang kinh doanh.</Paragraph>
        </div>
        <Button type="primary" size="large" icon={<PlusOutlined />} onClick={openCreateForm}>
          Thêm thương hiệu
        </Button>
      </div>

      {error && (
        <Alert
          className="content-alert"
          type="error"
          showIcon
          message={error}
          action={<Button size="small" icon={<ReloadOutlined />} onClick={() => void loadBrands()}>Thử lại</Button>}
        />
      )}

      <Card className="management-card" bordered={false}>
        <div className="table-toolbar">
          <Input
            allowClear
            value={search}
            prefix={<SearchOutlined />}
            placeholder="Tìm theo tên, slug hoặc mô tả"
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
            <TagsOutlined /> {filteredBrands.length} thương hiệu
          </div>
        </div>

        <Table<Brand>
          rowKey="id"
          columns={columns}
          dataSource={filteredBrands}
          loading={loading}
          scroll={{ x: 850 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            pageSizeOptions: [10, 20, 50],
            showTotal: (total) => `Tổng ${total} thương hiệu`,
          }}
          locale={{ emptyText: error ? 'Không có dữ liệu để hiển thị' : 'Chưa có thương hiệu phù hợp' }}
        />
      </Card>

      <BrandFormModal
        open={formOpen}
        brand={editingBrand}
        submitting={submitting}
        onCancel={() => setFormOpen(false)}
        onSubmit={handleSubmit}
      />
    </section>
  );
}
