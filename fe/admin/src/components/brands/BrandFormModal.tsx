import { TagsOutlined } from '@ant-design/icons';
import { Avatar, Form, Input, Modal, Select, Typography } from 'antd';
import { useEffect } from 'react';

import type { Brand, BrandInput, CatalogStatus } from '../../types/catalog';

const { TextArea } = Input;
const { Text } = Typography;

interface BrandFormValues {
  name: string;
  slug?: string;
  logoUrl?: string;
  description?: string;
  status: CatalogStatus;
}

interface BrandFormModalProps {
  open: boolean;
  brand: Brand | null;
  submitting: boolean;
  onCancel: () => void;
  onSubmit: (input: BrandInput) => Promise<void>;
}

export function BrandFormModal({
  open,
  brand,
  submitting,
  onCancel,
  onSubmit,
}: BrandFormModalProps) {
  const [form] = Form.useForm<BrandFormValues>();
  const logoUrl = Form.useWatch('logoUrl', form);

  useEffect(() => {
    if (!open) return;
    form.setFieldsValue({
      name: brand?.name ?? '',
      slug: brand?.slug ?? '',
      logoUrl: brand?.logoUrl ?? '',
      description: brand?.description ?? '',
      status: brand?.status ?? 'ACTIVE',
    });
  }, [brand, form, open]);

  const handleFinish = async (values: BrandFormValues) => {
    await onSubmit({
      name: values.name.trim(),
      slug: values.slug?.trim() || undefined,
      logoUrl: values.logoUrl?.trim() || null,
      description: values.description?.trim() || null,
      status: values.status,
    });
  };

  return (
    <Modal
      open={open}
      title={brand ? 'Cập nhật thương hiệu' : 'Thêm thương hiệu'}
      okText={brand ? 'Lưu thay đổi' : 'Tạo thương hiệu'}
      cancelText="Hủy"
      confirmLoading={submitting}
      onCancel={onCancel}
      onOk={() => form.submit()}
      destroyOnHidden
      width={620}
    >
      <Form<BrandFormValues>
        form={form}
        layout="vertical"
        requiredMark={false}
        onFinish={handleFinish}
      >
        <div className="brand-form-grid">
          <div className="logo-preview-panel">
            <Avatar
              className="logo-preview"
              shape="square"
              size={96}
              src={logoUrl?.trim() || undefined}
              icon={<TagsOutlined />}
            />
            <Text type="secondary">Xem trước logo</Text>
          </div>

          <div>
            <Form.Item
              name="name"
              label="Tên thương hiệu"
              rules={[
                { required: true, whitespace: true, message: 'Vui lòng nhập tên thương hiệu.' },
                { max: 100, message: 'Tên không được vượt quá 100 ký tự.' },
              ]}
            >
              <Input placeholder="Ví dụ: Apple" autoFocus />
            </Form.Item>

            <Form.Item
              name="slug"
              label="Slug"
              tooltip="Để trống để backend tự tạo từ tên."
              rules={[
                { max: 120, message: 'Slug không được vượt quá 120 ký tự.' },
                { pattern: /^[a-z0-9]+(?:-[a-z0-9]+)*$/, message: 'Chỉ dùng chữ thường, số và dấu gạch ngang.' },
              ]}
            >
              <Input placeholder="apple" />
            </Form.Item>
          </div>
        </div>

        <Form.Item
          name="logoUrl"
          label="URL logo"
          rules={[
            { type: 'url', message: 'URL logo không hợp lệ.' },
            { max: 500, message: 'URL không được vượt quá 500 ký tự.' },
          ]}
        >
          <Input placeholder="https://..." />
        </Form.Item>

        <Form.Item
          name="description"
          label="Mô tả"
          rules={[{ max: 500, message: 'Mô tả không được vượt quá 500 ký tự.' }]}
        >
          <TextArea rows={3} showCount maxLength={500} placeholder="Thông tin ngắn về thương hiệu" />
        </Form.Item>

        <Form.Item name="status" label="Trạng thái" rules={[{ required: true }]}>
          <Select
            options={[
              { value: 'ACTIVE', label: 'Đang hiển thị' },
              { value: 'HIDDEN', label: 'Đang ẩn' },
            ]}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
