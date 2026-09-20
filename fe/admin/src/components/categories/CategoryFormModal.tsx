import { InboxOutlined, PictureOutlined } from '@ant-design/icons';
import {
  App as AntApp,
  Avatar,
  Col,
  Divider,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  Typography,
  Upload,
  type UploadFile,
} from 'antd';
import { useEffect, useMemo, useState } from 'react';

import type { Category, CategoryInput, CatalogStatus } from '../../types/catalog';

const { TextArea } = Input;
const { Text } = Typography;

interface CategoryFormValues {
  name: string;
  slug?: string;
  parentId?: number;
  description?: string;
  imageUrl?: string;
  sortOrder: number;
  status: CatalogStatus;
}

export interface CategoryFormSubmission {
  input: CategoryInput;
  file: File | null;
}

interface CategoryFormModalProps {
  open: boolean;
  category: Category | null;
  categories: Category[];
  submitting: boolean;
  onCancel: () => void;
  onSubmit: (submission: CategoryFormSubmission) => Promise<void>;
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
  const { message } = AntApp.useApp();
  const [form] = Form.useForm<CategoryFormValues>();
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string>();
  const imageUrl = Form.useWatch('imageUrl', form);
  const selectedFile = fileList[0]?.originFileObj ?? null;
  const blockedParentIds = useMemo(() => (
    category
      ? new Set([category.id, ...findDescendantIds(categories, category.id)])
      : new Set<number>()
  ), [categories, category]);

  useEffect(() => {
    if (!selectedFile) {
      setLocalPreviewUrl(undefined);
      return undefined;
    }

    const objectUrl = URL.createObjectURL(selectedFile);
    setLocalPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [selectedFile]);

  useEffect(() => {
    if (!open) return;
    setFileList([]);
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
      file: selectedFile,
      input: {
        name: values.name.trim(),
        slug: values.slug?.trim() || undefined,
        parentId: values.parentId ?? null,
        description: values.description?.trim() || null,
        imageUrl: values.imageUrl?.trim() || null,
        sortOrder: values.sortOrder ?? 0,
        status: values.status,
      },
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

        <Row gutter={16} align="middle">
          <Col xs={24} md={8}>
            <div className="image-form-preview category-image-preview">
              <Avatar
                shape="square"
                size={112}
                src={localPreviewUrl || imageUrl?.trim() || undefined}
                icon={<PictureOutlined />}
              />
              <Text type="secondary">Xem trước hình ảnh</Text>
            </div>
          </Col>
          <Col xs={24} md={16}>
            <Form.Item label="Tải ảnh từ máy" className="product-image-upload">
              <Upload.Dragger
                accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                beforeUpload={(file) => {
                  const acceptedTypes = ['image/jpeg', 'image/png', 'image/webp'];
                  if (!acceptedTypes.includes(file.type)) {
                    message.error('Chỉ chấp nhận ảnh JPG, PNG hoặc WEBP.');
                    return Upload.LIST_IGNORE;
                  }
                  if (file.size > 5 * 1024 * 1024) {
                    message.error('Ảnh tải lên không được vượt quá 5 MB.');
                    return Upload.LIST_IGNORE;
                  }
                  setFileList([{
                    uid: file.uid,
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    status: 'done',
                    originFileObj: file,
                  }]);
                  return false;
                }}
                disabled={submitting}
                fileList={fileList}
                maxCount={1}
                multiple={false}
                onRemove={() => {
                  setFileList([]);
                  return true;
                }}
                showUploadList={{ showPreviewIcon: false }}
              >
                <p className="ant-upload-drag-icon"><InboxOutlined /></p>
                <p className="ant-upload-text">Bấm hoặc kéo ảnh vào đây</p>
                <p className="ant-upload-hint">JPG, PNG hoặc WEBP · tối đa 5 MB</p>
              </Upload.Dragger>
            </Form.Item>
          </Col>
        </Row>

        <Divider plain>Hoặc dùng đường dẫn ảnh</Divider>
        <Form.Item
          name="imageUrl"
          label="URL hình ảnh"
          rules={[
            {
              validator: async (_, value: string | undefined) => {
                if (selectedFile || !value?.trim()) return;
                try {
                  new URL(value);
                } catch {
                  throw new Error('URL hình ảnh không hợp lệ.');
                }
              },
            },
            { max: 500, message: 'URL không được vượt quá 500 ký tự.' },
          ]}
        >
          <Input placeholder="https://..." disabled={submitting || Boolean(selectedFile)} />
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
