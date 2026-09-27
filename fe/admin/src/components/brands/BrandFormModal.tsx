import { InboxOutlined, TagsOutlined } from '@ant-design/icons';
import {
  App as AntApp,
  Avatar,
  Col,
  Divider,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Typography,
  Upload,
  type UploadFile,
} from 'antd';
import { useEffect, useState } from 'react';

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

export interface BrandFormSubmission {
  input: BrandInput;
  file: File | null;
}

interface BrandFormModalProps {
  open: boolean;
  brand: Brand | null;
  submitting: boolean;
  onCancel: () => void;
  onSubmit: (submission: BrandFormSubmission) => Promise<void>;
}

export function BrandFormModal({
  open,
  brand,
  submitting,
  onCancel,
  onSubmit,
}: BrandFormModalProps) {
  const { message } = AntApp.useApp();
  const [form] = Form.useForm<BrandFormValues>();
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string>();
  const logoUrl = Form.useWatch('logoUrl', form);
  const selectedFile = fileList[0]?.originFileObj ?? null;

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
      name: brand?.name ?? '',
      slug: brand?.slug ?? '',
      logoUrl: brand?.logoUrl ?? '',
      description: brand?.description ?? '',
      status: brand?.status ?? 'ACTIVE',
    });
  }, [brand, form, open]);

  const handleFinish = async (values: BrandFormValues) => {
    await onSubmit({
      file: selectedFile,
      input: {
        name: values.name.trim(),
        slug: values.slug?.trim() || undefined,
        logoUrl: values.logoUrl?.trim() || null,
        description: values.description?.trim() || null,
        status: values.status,
      },
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
      width={720}
    >
      <Form<BrandFormValues>
        form={form}
        layout="vertical"
        requiredMark={false}
        onFinish={handleFinish}
      >
        <Row gutter={16}>
          <Col xs={24} md={14}>
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
              <Input placeholder="apple" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16} align="middle">
          <Col xs={24} md={8}>
            <div className="image-form-preview category-image-preview">
              <Avatar
                shape="square"
                size={112}
                src={localPreviewUrl || logoUrl?.trim() || undefined}
                icon={<TagsOutlined />}
              />
              <Text type="secondary">Xem trước logo</Text>
            </div>
          </Col>
          <Col xs={24} md={16}>
            <Form.Item label="Tải logo từ máy" className="product-image-upload">
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
                  form.setFieldValue('logoUrl', '');
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
                <p className="ant-upload-text">Bấm hoặc kéo logo vào đây</p>
                <p className="ant-upload-hint">JPG, PNG hoặc WEBP · tối đa 5 MB</p>
              </Upload.Dragger>
            </Form.Item>
          </Col>
        </Row>

        <Divider plain>Hoặc dùng đường dẫn ảnh</Divider>
        <Form.Item
          name="logoUrl"
          label="URL logo"
          rules={[
            {
              validator: async (_, value: string | undefined) => {
                if (selectedFile || !value?.trim()) return;
                try {
                  new URL(value);
                } catch {
                  throw new Error('URL logo không hợp lệ.');
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
