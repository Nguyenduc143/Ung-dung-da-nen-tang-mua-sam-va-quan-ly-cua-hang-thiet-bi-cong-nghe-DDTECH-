import { Col, Form, Input, InputNumber, Modal, Row, Select } from 'antd';
import { useEffect, useMemo } from 'react';

import type { Category, CategoryInput, CatalogStatus } from '../../types/catalog';

const { TextArea } = Input;

interface CategoryFormValues {
  name: string;
  slug?: string;
  parentId?: number;
  description?: string;
  imageUrl?: string;
  sortOrder: number;
  status: CatalogStatus;
}

interface CategoryFormModalProps {
  open: boolean;
  category: Category | null;
  categories: Category[];
  submitting: boolean;
  onCancel: () => void;
  onSubmit: (input: CategoryInput) => Promise<void>;
}

const findDescendantIds = (categories: Category[], categoryId: number): Set<number> => {
  const descendants = new Set<number>();
  const queue = [categoryId];

  while (queue.length) {
    const parentId = queue.shift();
    for (const candidate of categories) {
      if (candidate.parentId === parentId && !descendants.has(candidate.id)) {
        descendants.add(candidate.id);
        queue.push(candidate.id);
      }
    }
  }
  return descendants;
};

export function CategoryFormModal({
  open,
  category,
  categories,
  submitting,
  onCancel,
  onSubmit,
}: CategoryFormModalProps) {
  const [form] = Form.useForm<CategoryFormValues>();
  const blockedParentIds = useMemo(() => (
    category
      ? new Set([category.id, ...findDescendantIds(categories, category.id)])
      : new Set<number>()
  ), [categories, category]);

  useEffect(() => {
    if (!open) return;
    form.setFieldsValue({
      name: category?.name ?? '',
      slug: category?.slug ?? '',
      parentId: category?.parentId ?? undefined,
      description: category?.description ?? '',
      imageUrl: category?.imageUrl ?? '',
      sortOrder: category?.sortOrder ?? 0,
      status: category?.status ?? 'ACTIVE',
    });
  }, [category, form, open]);

  const handleFinish = async (values: CategoryFormValues) => {
    await onSubmit({
      name: values.name.trim(),
      slug: values.slug?.trim() || undefined,
      parentId: values.parentId ?? null,
      description: values.description?.trim() || null,
      imageUrl: values.imageUrl?.trim() || null,
      sortOrder: values.sortOrder ?? 0,
      status: values.status,
    });
  };

  return (
    <Modal
      open={open}
      title={category ? 'Cập nhật danh mục' : 'Thêm danh mục'}
      okText={category ? 'Lưu thay đổi' : 'Tạo danh mục'}
      cancelText="Hủy"
      confirmLoading={submitting}
      onCancel={onCancel}
      onOk={() => form.submit()}
      destroyOnHidden
      width={720}
    >
      <Form<CategoryFormValues>
        form={form}
        layout="vertical"
        requiredMark={false}
        onFinish={handleFinish}
      >
        <Row gutter={16}>
          <Col xs={24} md={14}>
            <Form.Item
              name="name"
              label="Tên danh mục"
              rules={[
                { required: true, whitespace: true, message: 'Vui lòng nhập tên danh mục.' },
                { max: 100, message: 'Tên không được vượt quá 100 ký tự.' },
              ]}
            >
              <Input placeholder="Ví dụ: Điện thoại" autoFocus />
            </Form.Item>
          </Col>
          <Col xs={24} md={10}>
            <Form.Item
              name="slug"
              label="Slug"
              tooltip="Để trống để backend tự tạo từ tên."
              rules={[
                { max: 120, message: 'Slug không được vượt quá 120 ký tự.' },
                { pattern: /^[a-z0-9]+(?:-[a-z0-9]+)*$/, message: 'Chỉ dùng chữ thường, số và dấu gạch ngang.' },
              ]}
            >
              <Input placeholder="dien-thoai" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item name="parentId" label="Danh mục cha">
              <Select
                allowClear
                showSearch
                optionFilterProp="label"
                placeholder="Không có danh mục cha"
                options={categories
                  .filter((item) => !blockedParentIds.has(item.id))
                  .map((item) => ({ value: item.id, label: item.name }))}
              />
            </Form.Item>
          </Col>
          <Col xs={12} md={6}>
            <Form.Item name="sortOrder" label="Thứ tự" rules={[{ required: true }]}>
              <InputNumber precision={0} step={1} className="full-width" />
            </Form.Item>
          </Col>
          <Col xs={12} md={6}>
            <Form.Item name="status" label="Trạng thái" rules={[{ required: true }]}>
              <Select
                options={[
                  { value: 'ACTIVE', label: 'Đang hiển thị' },
                  { value: 'HIDDEN', label: 'Đang ẩn' },
                ]}
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="imageUrl"
          label="URL hình ảnh"
          rules={[
            { type: 'url', warningOnly: false, message: 'URL hình ảnh không hợp lệ.' },
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
          <TextArea rows={3} showCount maxLength={500} placeholder="Mô tả ngắn về danh mục" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
