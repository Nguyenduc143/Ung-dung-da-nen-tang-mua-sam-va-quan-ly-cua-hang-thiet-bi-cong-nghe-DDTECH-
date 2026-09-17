import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  ShoppingOutlined,
} from '@ant-design/icons';
import {
  Alert,
  App as AntApp,
  Avatar,
  Button,
  Card,
  Input,
  InputNumber,
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
import { useNavigate } from 'react-router-dom';

import * as brandApi from '../api/brandApi';
import * as categoryApi from '../api/categoryApi';
import { getApiErrorMessage } from '../api/axiosClient';
import * as productApi from '../api/productApi';
import type { Brand, Category } from '../types/catalog';
import type { ProductListItem, ProductQuery, ProductStatus } from '../types/product';

const { Paragraph, Text, Title } = Typography;
const moneyFormatter = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });

export function ProductsPage() {
  const { message } = AntApp.useApp();
  const navigate = useNavigate();
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [category, setCategory] = useState<number>();
  const [brand, setBrand] = useState<number>();
  const [status, setStatus] = useState<ProductStatus>();
  const [minPrice, setMinPrice] = useState<number>();
  const [maxPrice, setMaxPrice] = useState<number>();
  const [featured, setFeatured] = useState<boolean>();
  const [isNew, setIsNew] = useState<boolean>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    Promise.all([categoryApi.listCategories(), brandApi.listBrands()])
      .then(([categoryList, brandList]) => {
        setCategories(categoryList);
        setBrands(brandList);
      })
      .catch((requestError: unknown) => {
        message.error(getApiErrorMessage(requestError, 'Không thể tải dữ liệu bộ lọc.'));
      });
  }, [message]);

  const query = useMemo<ProductQuery>(() => ({
    search: debouncedSearch || undefined,
    category,
    brand,
    status,
    minPrice,
    maxPrice,
    featured,
    new: isNew,
    sort: 'newest',
    page,
    limit: pageSize,
  }), [brand, category, debouncedSearch, featured, isNew, maxPrice, minPrice, page, pageSize, status]);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
      setProducts([]);
      setTotal(0);
      setError('Giá tối thiểu không được lớn hơn giá tối đa.');
      setLoading(false);
      return;
    }
    try {
      const data = await productApi.listProducts(query);
      setProducts(data.products);
      setTotal(data.pagination.total);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Không thể tải danh sách sản phẩm.'));
    } finally {
      setLoading(false);
    }
  }, [maxPrice, minPrice, query]);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  const resetPage = () => setPage(1);

  const clearFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setCategory(undefined);
    setBrand(undefined);
    setStatus(undefined);
    setMinPrice(undefined);
    setMaxPrice(undefined);
    setFeatured(undefined);
    setIsNew(undefined);
    setPage(1);
  };

  const handleDelete = async (product: ProductListItem) => {
    setDeletingId(product.id);
    try {
      await productApi.deleteProduct(product.id);
      message.success('Đã xóa sản phẩm.');
      await loadProducts();
    } catch (requestError) {
      message.error(getApiErrorMessage(requestError, 'Không thể xóa sản phẩm.'));
    } finally {
      setDeletingId(null);
    }
  };

  const columns: TableColumnsType<ProductListItem> = [
    {
      title: 'Sản phẩm',
      dataIndex: 'name',
      key: 'name',
      width: 290,
      render: (value: string, record) => (
        <div className="category-name-cell">
          <Avatar shape="square" size={52} src={record.primaryImageUrl || undefined} icon={<ShoppingOutlined />} />
          <div className="table-primary-cell product-name-cell">
            <strong>{value}</strong>
            <span>{record.sku}</span>
          </div>
        </div>
      ),
    },
    {
      title: 'Phân loại',
      key: 'catalog',
      width: 170,
      render: (_, record) => (
        <div className="table-primary-cell">
          <strong>{record.category.name}</strong>
          <span>{record.brand?.name ?? 'Không thương hiệu'}</span>
        </div>
      ),
    },
    {
      title: 'Giá bán',
      key: 'price',
      width: 150,
      render: (_, record) => (
        <div className="price-cell">
          <strong>{moneyFormatter.format(record.salePrice ?? record.price)}</strong>
          {record.salePrice !== null && <del>{moneyFormatter.format(record.price)}</del>}
        </div>
      ),
    },
    {
      title: 'Kho / Đã bán',
      key: 'stock',
      width: 120,
      align: 'center',
      render: (_, record) => <span>{record.stock} / {record.soldCount}</span>,
    },
    {
      title: 'Nhãn',
      key: 'flags',
      width: 125,
      render: (_, record) => (
        <Space size={[4, 4]} wrap>
          {record.isFeatured && <Tag color="gold">Nổi bật</Tag>}
          {record.isNew && <Tag color="blue">Mới</Tag>}
          {!record.isFeatured && !record.isNew && <Text type="secondary">—</Text>}
        </Space>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (value: ProductStatus) => (
        <Tag color={value === 'ACTIVE' ? 'success' : 'default'}>
          {value === 'ACTIVE' ? 'Đang bán' : 'Ngừng bán'}
        </Tag>
      ),
    },
    {
      title: 'Cập nhật',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 145,
      render: (value: string) => dayjs(value).format('DD/MM/YYYY HH:mm'),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 110,
      fixed: 'right',
      render: (_, record) => (
        <Space size={2}>
          <Tooltip title="Sửa sản phẩm">
            <Button type="text" icon={<EditOutlined />} onClick={() => navigate(`/products/${record.id}/edit`)} />
          </Tooltip>
          <Popconfirm
            title="Xóa sản phẩm?"
            description="Sản phẩm sẽ bị ẩn và không còn xuất hiện trên cửa hàng."
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true, loading: deletingId === record.id }}
            onConfirm={() => handleDelete(record)}
          >
            <Tooltip title="Xóa sản phẩm"><Button danger type="text" icon={<DeleteOutlined />} /></Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <section aria-labelledby="products-title">
      <div className="page-heading page-heading--actions">
        <div>
          <Text className="eyebrow">DANH MỤC HÀNG HÓA</Text>
          <Title id="products-title" level={2}>Quản lý sản phẩm</Title>
          <Paragraph>Theo dõi giá bán, tồn kho và trạng thái sản phẩm.</Paragraph>
        </div>
        <Button type="primary" size="large" icon={<PlusOutlined />} onClick={() => navigate('/products/create')}>
          Thêm sản phẩm
        </Button>
      </div>

      {error && (
        <Alert className="content-alert" type="error" showIcon message={error}
          action={<Button size="small" icon={<ReloadOutlined />} onClick={() => void loadProducts()}>Thử lại</Button>} />
      )}

      <Card className="product-filter-card" bordered={false}>
        <div className="product-filter-grid">
          <Input allowClear value={search} prefix={<SearchOutlined />} placeholder="Tên, SKU hoặc mô tả"
            onChange={(event) => setSearch(event.target.value)} />
          <Select allowClear showSearch optionFilterProp="label" value={category} placeholder="Danh mục"
            options={categories.map((item) => ({ value: item.id, label: item.name }))}
            onChange={(value) => { setCategory(value); resetPage(); }} />
          <Select allowClear showSearch optionFilterProp="label" value={brand} placeholder="Thương hiệu"
            options={brands.map((item) => ({ value: item.id, label: item.name }))}
            onChange={(value) => { setBrand(value); resetPage(); }} />
          <Select allowClear value={status} placeholder="Trạng thái"
            options={[{ value: 'ACTIVE', label: 'Đang bán' }, { value: 'INACTIVE', label: 'Ngừng bán' }]}
            onChange={(value) => { setStatus(value); resetPage(); }} />
          <InputNumber min={0} value={minPrice} placeholder="Giá từ" className="full-width"
            onChange={(value) => { setMinPrice(value ?? undefined); resetPage(); }} />
          <InputNumber min={0} value={maxPrice} placeholder="Giá đến" className="full-width"
            status={minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice ? 'error' : undefined}
            onChange={(value) => { setMaxPrice(value ?? undefined); resetPage(); }} />
          <Select allowClear value={featured} placeholder="Nổi bật"
            options={[{ value: true, label: 'Có nổi bật' }, { value: false, label: 'Không nổi bật' }]}
            onChange={(value) => { setFeatured(value); resetPage(); }} />
          <Select allowClear value={isNew} placeholder="Sản phẩm mới"
            options={[{ value: true, label: 'Sản phẩm mới' }, { value: false, label: 'Không phải mới' }]}
            onChange={(value) => { setIsNew(value); resetPage(); }} />
          <Button onClick={clearFilters}>Xóa bộ lọc</Button>
        </div>
      </Card>

      <Card className="management-card" bordered={false}>
        <div className="table-summary"><ShoppingOutlined /> {total} sản phẩm</div>
        <Table<ProductListItem>
          rowKey="id"
          columns={columns}
          dataSource={products}
          loading={loading}
          scroll={{ x: 1220 }}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            pageSizeOptions: [10, 20, 50, 100],
            showTotal: (count) => `Tổng ${count} sản phẩm`,
            onChange: (nextPage, nextPageSize) => {
              setPage(nextPageSize === pageSize ? nextPage : 1);
              setPageSize(nextPageSize);
            },
          }}
          locale={{ emptyText: error ? 'Không có dữ liệu để hiển thị' : 'Chưa có sản phẩm phù hợp' }}
        />
      </Card>
    </section>
  );
}
