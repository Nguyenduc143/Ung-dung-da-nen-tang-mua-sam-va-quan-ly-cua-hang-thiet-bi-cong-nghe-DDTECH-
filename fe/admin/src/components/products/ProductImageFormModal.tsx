import { PictureOutlined } from '@ant-design/icons';
import { Avatar, Form, Input, InputNumber, Modal, Select, Switch, Typography } from 'antd';
import { useEffect } from 'react';

import type { ProductImageInput, ProductVariant } from '../../types/product';

const { Text } = Typography;

interface ProductImageFormValues {
  variantId?: number;
  imageUrl: string;
  altText?: string;
  isPrimary: boolean;
  sortOrder: number;
}

interface ProductImageFormModalProps {
  open: boolean;
  variants: ProductVariant[];
  submitting: boolean;
  onCancel: () => void;
  onSubmit: (input: ProductImageInput) => Promise<void>;
}

export function ProductImageFormModal({
  open,
  variants,
  submitting,
  onCancel,
  onSubmit,
}: ProductImageFormModalProps) {
  const [form] = Form.useForm<ProductImageFormValues>();
  const imageUrl = Form.useWatch('imageUrl', form);

  useEffect(() => {
    if (!open) return;
    form.setFieldsValue({
      variantId: undefined,
      imageUrl: '',
      altText: '',
      isPrimary: false,
      sortOrder: 0,
    });
  }, [form, open]);

  const handleFinish = async (values: ProductImageFormValues) => {
    await onSubmit({
      variantId: values.variantId ?? null,
      imageUrl: values.imageUrl.trim(),
      altText: values.altText?.trim() || null,
      isPrimary: values.isPrimary,
      sortOrder: values.sortOrder ?? 0,
    });
  };

  return (
    <Modal open={open} title="Thêm ảnh sản phẩm" okText="Thêm ảnh" cancelText="Hủy"
      confirmLoading={submitting} onCancel={onCancel} onOk={() => form.submit()} destroyOnHidden>
      <Form<ProductImageFormValues> form={form} layout="vertical" requiredMark={false} onFinish={handleFinish}>
        <div className="image-form-preview">
          <Avatar shape="square" size={112} src={imageUrl?.trim() || undefined} icon={<PictureOutlined />} />
          <Text type="secondary">Xem trước hình ảnh</Text>
        </div>
        <Form.Item name="imageUrl" label="URL hình ảnh"
          rules={[{ required: true, whitespace: true }, { type: 'url', message: 'URL hình ảnh không hợp lệ.' }, { max: 500 }]}>
          <Input placeholder="https://..." autoFocus />
        </Form.Item>
        <Form.Item name="altText" label="Mô tả ảnh" rules={[{ max: 255 }]}>
          <Input placeholder="Nội dung thay thế khi ảnh không tải được" />
        </Form.Item>
        <Form.Item name="variantId" label="Ảnh dành cho phiên bản">
          <Select allowClear placeholder="Ảnh chung của sản phẩm"
            options={variants.map((variant) => ({ value: variant.id, label: variant.variantName }))} />
        </Form.Item>
        <div className="attribute-form-row">
          <Form.Item name="isPrimary" label="Đặt làm ảnh chính" valuePropName="checked"><Switch /></Form.Item>
          <Form.Item name="sortOrder" label="Thứ tự"><InputNumber precision={0} className="full-width" /></Form.Item>
        </div>
      </Form>
    </Modal>
  );
}
