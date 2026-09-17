import { InfoCircleOutlined, ShoppingOutlined } from '@ant-design/icons';
import {
  Alert,
  Avatar,
  Col,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  Typography,
} from 'antd';
import { useEffect } from 'react';

import type { CategoryAttribute } from '../../types/catalog';
import type { ProductStatus, ProductVariant, ProductVariantInput } from '../../types/product';

const { Text } = Typography;

interface VariantFormValues {
  sku: string;
  variantName: string;
  attributes?: Record<string, unknown>;
  price: number;
  salePrice?: number;
  stock?: number;
  imageUrl?: string;
  sortOrder: number;
  status: ProductStatus;
}

interface VariantFormModalProps {
  open: boolean;
  variant: ProductVariant | null;
  categoryAttributes: CategoryAttribute[];
  submitting: boolean;
  onCancel: () => void;
  onSubmit: (input: ProductVariantInput) => Promise<void>;
}

export function VariantFormModal({
  open,
  variant,
  categoryAttributes,
  submitting,
  onCancel,
  onSubmit,
}: VariantFormModalProps) {
  const [form] = Form.useForm<VariantFormValues>();
  const imageUrl = Form.useWatch('imageUrl', form);

  useEffect(() => {
    if (!open) return;
    form.setFieldsValue({
      sku: variant?.sku ?? '',
      variantName: variant?.variantName ?? '',
      attributes: variant?.attributes ?? {},
      price: variant?.price,
      salePrice: variant?.salePrice ?? undefined,
      stock: variant?.stock ?? 0,
      imageUrl: variant?.imageUrl ?? '',
      sortOrder: variant?.sortOrder ?? 0,
      status: variant?.status ?? 'ACTIVE',
    });
  }, [form, open, variant]);

  const handleFinish = async (values: VariantFormValues) => {
    const attributes: Record<string, unknown> = { ...(variant?.attributes ?? {}) };
    for (const attribute of categoryAttributes) {
      const value = values.attributes?.[attribute.attrKey];
      if (value === undefined || value === null || value === '') {
        delete attributes[attribute.attrKey];
      } else {
        attributes[attribute.attrKey] = value;
      }
    }

    await onSubmit({
      sku: values.sku.trim(),
      variantName: values.variantName.trim(),
      attributes: Object.keys(attributes).length ? attributes : null,
      price: values.price,
      salePrice: values.salePrice ?? null,
      stock: variant ? undefined : values.stock ?? 0,
      imageUrl: values.imageUrl?.trim() || null,
      sortOrder: values.sortOrder ?? 0,
      status: values.status,
    });
  };

  const renderAttributeField = (attribute: CategoryAttribute) => {
    const name = ['attributes', attribute.attrKey];
    const label = `${attribute.attrName}${attribute.unit ? ` (${attribute.unit})` : ''}`;
    if (attribute.inputType === 'NUMBER') {
      return <Form.Item name={name} label={label}><InputNumber className="full-width" /></Form.Item>;
    }
    if (attribute.inputType === 'SELECT') {
      return (
        <Form.Item name={name} label={label}>
          <Select allowClear options={(attribute.options ?? []).map((value) => ({ value, label: value }))} />
        </Form.Item>
      );
    }
    return <Form.Item name={name} label={label}><Input /></Form.Item>;
  };

  return (
    <Modal
      open={open}
      title={variant ? 'Cập nhật phiên bản' : 'Thêm phiên bản'}
      okText={variant ? 'Lưu thay đổi' : 'Tạo phiên bản'}
      cancelText="Hủy"
      confirmLoading={submitting}
      onCancel={onCancel}
      onOk={() => form.submit()}
      destroyOnHidden
      width={760}
    >
      <Form<VariantFormValues> form={form} layout="vertical" requiredMark={false} onFinish={handleFinish}>
        <Row gutter={16}>
          <Col xs={24} md={14}>
            <Form.Item name="variantName" label="Tên phiên bản" rules={[{ required: true, whitespace: true }, { max: 150 }]}>
              <Input placeholder="Ví dụ: 256GB - Xanh Navy" autoFocus />
            </Form.Item>
          </Col>
          <Col xs={24} md={10}>
            <Form.Item name="sku" label="SKU phiên bản" rules={[{ required: true, whitespace: true }, { max: 50 }]}>
              <Input placeholder="SKU duy nhất" />
            </Form.Item>
          </Col>
        </Row>

        {categoryAttributes.length > 0 && (
          <Row gutter={16}>
            {categoryAttributes.map((attribute) => (
              <Col xs={24} md={12} key={attribute.id}>{renderAttributeField(attribute)}</Col>
            ))}
          </Row>
        )}

        <Row gutter={16}>
          <Col xs={24} md={8}>
            <Form.Item name="price" label="Giá gốc" rules={[{ required: true }]}>
              <InputNumber min={0} precision={0} className="full-width" addonAfter="₫" />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item name="salePrice" label="Giá khuyến mãi" dependencies={['price']}
              rules={[({ getFieldValue }) => ({
                validator: (_, value?: number) => value == null || value <= Number(getFieldValue('price'))
                  ? Promise.resolve()
                  : Promise.reject(new Error('Giá khuyến mãi không được lớn hơn giá gốc.')),
              })]}>
              <InputNumber min={0} precision={0} className="full-width" addonAfter="₫" />
            </Form.Item>
          </Col>
          <Col xs={12} md={4}>
            <Form.Item name="sortOrder" label="Thứ tự"><InputNumber precision={0} className="full-width" /></Form.Item>
          </Col>
          <Col xs={12} md={4}>
            <Form.Item name="status" label="Trạng thái">
              <Select options={[{ value: 'ACTIVE', label: 'Bán' }, { value: 'INACTIVE', label: 'Ẩn' }]} />
            </Form.Item>
          </Col>
        </Row>

        {!variant ? (
          <Form.Item name="stock" label="Tồn kho ban đầu">
            <InputNumber min={0} precision={0} className="full-width" />
          </Form.Item>
        ) : (
          <Alert className="content-alert" type="info" showIcon icon={<InfoCircleOutlined />}
            message={`Tồn kho hiện tại: ${variant.stock}. Điều chỉnh tại màn hình Inventory.`} />
        )}

        <div className="variant-image-field">
          <Avatar shape="square" size={72} src={imageUrl?.trim() || undefined} icon={<ShoppingOutlined />} />
          <Form.Item name="imageUrl" label="URL ảnh phiên bản" rules={[{ type: 'url', message: 'URL ảnh không hợp lệ.' }, { max: 500 }]}>
            <Input placeholder="https://..." />
          </Form.Item>
          <Text type="secondary">Ảnh đại diện riêng của phiên bản.</Text>
        </div>
      </Form>
    </Modal>
  );
}
