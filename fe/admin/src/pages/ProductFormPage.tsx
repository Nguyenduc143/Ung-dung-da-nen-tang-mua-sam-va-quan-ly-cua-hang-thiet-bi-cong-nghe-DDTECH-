import {
  ArrowLeftOutlined,
  InfoCircleOutlined,
  SaveOutlined,
} from '@ant-design/icons';
import {
  Alert,
  App as AntApp,
  Button,
  Card,
  Col,
  Empty,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Space,
  Spin,
  Switch,
  Typography,
} from 'antd';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import * as brandApi from '../api/brandApi';
import * as categoryApi from '../api/categoryApi';
import { getApiErrorMessage } from '../api/axiosClient';
import * as productApi from '../api/productApi';
import { ProductImagesPanel } from '../components/products/ProductImagesPanel';
import { ProductVariantsPanel } from '../components/products/ProductVariantsPanel';
import type { Brand, Category, CategoryAttribute } from '../types/catalog';
import type {
  ProductImage,
  ProductInput,
  ProductStatus,
  ProductVariant,
} from '../types/product';

const { Paragraph, Text, Title } = Typography;
const { TextArea } = Input;

interface ProductFormValues {
  categoryId: number;
  brandId?: number;
  name: string;
  slug?: string;
  sku: string;
  shortDescription?: string;
  description?: string;
  specifications?: Record<string, unknown>;
  price: number;
  salePrice?: number;
  stock?: number;
  hasVariants: boolean;
  warrantyMonths: number;
  weightGram?: number;
  isFeatured: boolean;
  isNew: boolean;
  status: ProductStatus;
}

export function ProductFormPage() {
  const { message } = AntApp.useApp();
  const [form] = Form.useForm<ProductFormValues>();
  const navigate = useNavigate();
  const params = useParams<{ id: string }>();
  const productId = params.id ? Number(params.id) : null;
  const isEditing = productId !== null;
  const categoryId = Form.useWatch('categoryId', form);
  const hasVariants = Form.useWatch('hasVariants', form);

  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [attributes, setAttributes] = useState<CategoryAttribute[]>([]);
  const [loading, setLoading] = useState(true);
  const [attributesLoading, setAttributesLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [originalCategoryId, setOriginalCategoryId] = useState<number | null>(null);
  const [originalSpecifications, setOriginalSpecifications] = useState<Record<string, unknown>>({});
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [images, setImages] = useState<ProductImage[]>([]);
  const [persistedHasVariants, setPersistedHasVariants] = useState(false);
  const previousCategoryId = useRef<number | undefined>(undefined);

  const loadPage = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [categoryList, brandList, detail] = await Promise.all([
        categoryApi.listCategories(),
        brandApi.listBrands(),
        productId ? productApi.getProduct(productId) : Promise.resolve(null),
      ]);
      setCategories(categoryList);
      setBrands(brandList);

      if (detail) {
        const { product } = detail;
        const specifications = detail.specifications ?? product.specifications ?? {};
        setOriginalCategoryId(product.categoryId);
        setOriginalSpecifications(specifications);
        setVariants(detail.variants);
        setImages(detail.images);
        setPersistedHasVariants(product.hasVariants);
        form.setFieldsValue({
          categoryId: product.categoryId,
          brandId: product.brandId ?? undefined,
          name: product.name,
          slug: product.slug,
          sku: product.sku,
          shortDescription: product.shortDescription ?? '',
          description: product.description ?? '',
          specifications,
          price: product.price,
          salePrice: product.salePrice ?? undefined,
          stock: product.stock,
          hasVariants: product.hasVariants,
          warrantyMonths: product.warrantyMonths,
          weightGram: product.weightGram ?? undefined,
          isFeatured: product.isFeatured,
          isNew: product.isNew,
          status: product.status,
        });
      } else {
        form.setFieldsValue({
          hasVariants: false,
          warrantyMonths: 12,
          isFeatured: false,
          isNew: true,
          status: 'ACTIVE',
          stock: 0,
        });
      }
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Không thể tải dữ liệu sản phẩm.'));
    } finally {
      setLoading(false);
    }
  }, [form, productId]);

  useEffect(() => {
    void loadPage();
  }, [loadPage]);

  useEffect(() => {
    if (!categoryId) {
      setAttributes([]);
      return;
    }

    if (previousCategoryId.current !== undefined && previousCategoryId.current !== categoryId) {
      form.setFieldValue('specifications', {});
    }
    previousCategoryId.current = categoryId;

    let active = true;
    setAttributesLoading(true);
    categoryApi.listCategoryAttributes(categoryId)
      .then((data) => {
        if (active) setAttributes(data);
      })
      .catch((requestError: unknown) => {
        if (active) {
          setAttributes([]);
          message.error(getApiErrorMessage(requestError, 'Không thể tải thuộc tính danh mục.'));
        }
      })
      .finally(() => {
        if (active) setAttributesLoading(false);
      });

    return () => {
      active = false;
    };
  }, [categoryId, form, message]);

  const refreshProductResources = useCallback(async () => {
    if (!productId) return;
    try {
      const detail = await productApi.getProduct(productId);
      setVariants(detail.variants);
      setImages(detail.images);
      setPersistedHasVariants(detail.product.hasVariants);
    } catch (requestError) {
      message.error(getApiErrorMessage(requestError, 'Đã thao tác nhưng không thể tải lại dữ liệu.'));
    }
  }, [message, productId]);

  const catalogOptions = useMemo(() => ({
    categories: categories.map((item) => ({ value: item.id, label: item.name })),
    brands: brands.map((item) => ({ value: item.id, label: item.name })),
  }), [brands, categories]);

  const buildSpecifications = (values: ProductFormValues): Record<string, unknown> | null => {
    const result: Record<string, unknown> = values.categoryId === originalCategoryId
      ? { ...originalSpecifications }
      : {};

    for (const attribute of attributes) {
      const value = values.specifications?.[attribute.attrKey];
      if (value === undefined || value === null || value === '') {
        delete result[attribute.attrKey];
      } else {
        result[attribute.attrKey] = value;
      }
    }
    return Object.keys(result).length ? result : null;
  };

  const handleSubmit = async (values: ProductFormValues) => {
    setSaving(true);
    try {
      const input: ProductInput = {
        categoryId: values.categoryId,
        brandId: values.brandId ?? null,
        name: values.name.trim(),
        slug: values.slug?.trim() || undefined,
        sku: values.sku.trim(),
        shortDescription: values.shortDescription?.trim() || null,
        description: values.description?.trim() || null,
        specifications: buildSpecifications(values),
        price: values.price,
        salePrice: values.salePrice ?? null,
        hasVariants: values.hasVariants,
        warrantyMonths: values.warrantyMonths ?? 12,
        weightGram: values.weightGram ?? null,
        isFeatured: values.isFeatured,
        isNew: values.isNew,
        status: values.status,
      };

      if (productId) {
        await productApi.updateProduct(productId, input);
        message.success('Đã cập nhật sản phẩm.');
        await loadPage();
      } else {
        const created = await productApi.createProduct({
          ...input,
          stock: values.hasVariants ? 0 : values.stock ?? 0,
        });
        message.success('Đã tạo sản phẩm.');
        navigate(`/products/${created.product.id}/edit`, { replace: true });
      }
    } catch (requestError) {
      message.error(getApiErrorMessage(requestError, 'Không thể lưu sản phẩm.'));
    } finally {
      setSaving(false);
    }
  };

  const renderSpecificationField = (attribute: CategoryAttribute) => {
    const common = {
      name: ['specifications', attribute.attrKey],
      label: `${attribute.attrName}${attribute.unit ? ` (${attribute.unit})` : ''}`,
      key: attribute.id,
    };

    if (attribute.inputType === 'NUMBER') {
      return <Form.Item {...common}><InputNumber className="full-width" /></Form.Item>;
    }
    if (attribute.inputType === 'SELECT') {
      return (
        <Form.Item {...common}>
          <Select allowClear options={(attribute.options ?? []).map((value) => ({ value, label: value }))} />
        </Form.Item>
      );
    }
    return <Form.Item {...common}><Input /></Form.Item>;
  };

  if (loading) {
    return <div className="content-loading"><Spin size="large" /><Text>Đang tải dữ liệu sản phẩm...</Text></div>;
  }

  if (error) {
    return (
      <Alert
        type="error"
        showIcon
        message={error}
        action={<Button onClick={() => void loadPage()}>Thử lại</Button>}
      />
    );
  }

  return (
    <section aria-labelledby="product-form-title">
      <div className="page-heading page-heading--actions">
        <div>
          <Text className="eyebrow">SẢN PHẨM</Text>
          <Title id="product-form-title" level={2}>
            {isEditing ? 'Cập nhật sản phẩm' : 'Thêm sản phẩm'}
          </Title>
          <Paragraph>Thông tin cơ bản, giá bán và thông số kỹ thuật theo danh mục.</Paragraph>
        </div>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/products')}>Quay lại</Button>
      </div>

      <Form<ProductFormValues>
        form={form}
        layout="vertical"
        requiredMark={false}
        onFinish={handleSubmit}
      >
        <div className="product-form-layout">
          <div className="product-form-main">
            <Card className="form-section-card" bordered={false} title="Thông tin sản phẩm">
              <Row gutter={16}>
                <Col xs={24} md={16}>
                  <Form.Item name="name" label="Tên sản phẩm" rules={[{ required: true, whitespace: true }, { max: 255 }]}>
                    <Input placeholder="Tên sản phẩm" autoFocus />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item name="sku" label="SKU" rules={[{ required: true, whitespace: true }, { max: 50 }]}>
                    <Input placeholder="SKU duy nhất" />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item
                name="slug"
                label="Slug"
                tooltip="Để trống khi tạo để backend tự sinh từ tên."
                rules={[
                  { max: 280 },
                  { pattern: /^[a-z0-9]+(?:-[a-z0-9]+)*$/, message: 'Slug chỉ dùng chữ thường, số và dấu gạch ngang.' },
                ]}
              >
                <Input placeholder="ten-san-pham" />
              </Form.Item>
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item name="categoryId" label="Danh mục" rules={[{ required: true, message: 'Vui lòng chọn danh mục.' }]}>
                    <Select showSearch optionFilterProp="label" options={catalogOptions.categories} placeholder="Chọn danh mục" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name="brandId" label="Thương hiệu">
                    <Select allowClear showSearch optionFilterProp="label" options={catalogOptions.brands} placeholder="Không có thương hiệu" />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item name="shortDescription" label="Mô tả ngắn" rules={[{ max: 500 }]}>
                <TextArea rows={2} showCount maxLength={500} />
              </Form.Item>
              <Form.Item name="description" label="Mô tả chi tiết" rules={[{ max: 65535 }]}>
                <TextArea rows={7} />
              </Form.Item>
            </Card>

            <Card className="form-section-card" bordered={false} title="Thông số kỹ thuật">
              {!categoryId ? (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chọn danh mục để nhập thông số kỹ thuật" />
              ) : attributesLoading ? (
                <div className="inline-loading"><Spin /> Đang tải thuộc tính...</div>
              ) : attributes.length ? (
                <Row gutter={16}>
                  {attributes.map((attribute) => (
                    <Col xs={24} md={12} key={attribute.id}>{renderSpecificationField(attribute)}</Col>
                  ))}
                </Row>
              ) : (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Danh mục chưa có thuộc tính" />
              )}
            </Card>

            {productId && (
              <ProductVariantsPanel
                productId={productId}
                enabled={persistedHasVariants}
                variants={variants}
                categoryAttributes={attributes}
                onChanged={refreshProductResources}
              />
            )}

            {productId && (
              <ProductImagesPanel
                productId={productId}
                images={images}
                variants={variants}
                onChanged={refreshProductResources}
              />
            )}
          </div>

          <div className="product-form-aside">
            <Card className="form-section-card" bordered={false} title="Giá và tồn kho">
              <Form.Item name="price" label="Giá gốc" rules={[{ required: true, message: 'Vui lòng nhập giá.' }]}>
                <InputNumber min={0} max={9999999999999.99} precision={0} className="full-width" addonAfter="₫" />
              </Form.Item>
              <Form.Item
                name="salePrice"
                label="Giá khuyến mãi"
                dependencies={['price']}
                rules={[({ getFieldValue }) => ({
                  validator: (_, value?: number) => (
                    value == null || value <= Number(getFieldValue('price'))
                      ? Promise.resolve()
                      : Promise.reject(new Error('Giá khuyến mãi không được lớn hơn giá gốc.'))
                  ),
                })]}
              >
                <InputNumber min={0} precision={0} className="full-width" addonAfter="₫" />
              </Form.Item>
              <Form.Item name="hasVariants" label="Sản phẩm có phiên bản" valuePropName="checked">
                <Switch />
              </Form.Item>
              {!isEditing && !hasVariants && (
                <Form.Item name="stock" label="Tồn kho ban đầu">
                  <InputNumber min={0} precision={0} className="full-width" />
                </Form.Item>
              )}
              {isEditing && (
                <Alert type="info" showIcon icon={<InfoCircleOutlined />} message="Tồn kho được điều chỉnh tại màn hình Inventory." />
              )}
            </Card>

            <Card className="form-section-card" bordered={false} title="Thiết lập">
              <Form.Item name="status" label="Trạng thái" rules={[{ required: true }]}>
                <Select options={[{ value: 'ACTIVE', label: 'Đang bán' }, { value: 'INACTIVE', label: 'Ngừng bán' }]} />
              </Form.Item>
              <Form.Item name="warrantyMonths" label="Bảo hành (tháng)">
                <InputNumber min={0} max={65535} precision={0} className="full-width" />
              </Form.Item>
              <Form.Item name="weightGram" label="Khối lượng (gram)">
                <InputNumber min={0} precision={0} className="full-width" />
              </Form.Item>
              <div className="switch-setting">
                <Form.Item name="isFeatured" label="Sản phẩm nổi bật" valuePropName="checked"><Switch /></Form.Item>
                <Form.Item name="isNew" label="Sản phẩm mới" valuePropName="checked"><Switch /></Form.Item>
              </div>
            </Card>

            <Space className="form-actions">
              <Button onClick={() => navigate('/products')}>Hủy</Button>
              <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={saving}>
                {isEditing ? 'Lưu thay đổi' : 'Tạo sản phẩm'}
              </Button>
            </Space>
          </div>
        </div>
      </Form>
    </section>
  );
}
