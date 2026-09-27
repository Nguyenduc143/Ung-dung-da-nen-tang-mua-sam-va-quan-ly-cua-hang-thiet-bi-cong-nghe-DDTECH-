import { InboxOutlined, PictureOutlined } from '@ant-design/icons';
import {
  App as AntApp,
  Avatar,
  Divider,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Switch,
  Typography,
  Upload,
  type UploadFile,
} from 'antd';
import { useEffect, useState } from 'react';

import type { ProductImageInput, ProductVariant } from '../../types/product';

const { Text } = Typography;

interface ProductImageFormValues {
  variantId?: number;
  imageUrl: string;
  altText?: string;
  isPrimary: boolean;
  sortOrder: number;
}

export interface ProductImageFormSubmission extends Omit<ProductImageInput, 'imageUrl'> {
  file: File | null;
  imageUrl: string | null;
}

interface ProductImageFormModalProps {
  open: boolean;
  variants: ProductVariant[];
  submitting: boolean;
  onCancel: () => void;
  onSubmit: (input: ProductImageFormSubmission) => Promise<void>;
}

export function ProductImageFormModal({
  open,
  variants,
  submitting,
  onCancel,
  onSubmit,
}: ProductImageFormModalProps) {
  const { message } = AntApp.useApp();
  const [form] = Form.useForm<ProductImageFormValues>();
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string>();
  const imageUrl = Form.useWatch('imageUrl', form);
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
      variantId: undefined,
      imageUrl: '',
      altText: '',
      isPrimary: false,
      sortOrder: 0,
    });
  }, [form, open]);

  const handleFinish = async (values: ProductImageFormValues) => {
    await onSubmit({
      file: selectedFile,
      variantId: values.variantId ?? null,
      imageUrl: values.imageUrl.trim() || null,
      altText: values.altText?.trim() || null,
      isPrimary: values.isPrimary,
      sortOrder: values.sortOrder ?? 0,
    });
  };

  return (
    <Modal open={open} width={620} title="Thêm ảnh sản phẩm" okText="Thêm ảnh" cancelText="Hủy"
      confirmLoading={submitting} onCancel={onCancel} onOk={() => form.submit()} destroyOnHidden>
      <Form<ProductImageFormValues> form={form} layout="vertical" requiredMark={false} onFinish={handleFinish}>
        <div className="image-form-preview">
          <Avatar shape="square" size={112} src={localPreviewUrl || imageUrl?.trim() || undefined} icon={<PictureOutlined />} />
          <Text type="secondary">Xem trước hình ảnh</Text>
        </div>

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
              form.setFieldValue('imageUrl', '');
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

        <Divider plain>Hoặc dùng đường dẫn ảnh</Divider>
        <Form.Item name="imageUrl" label="URL hình ảnh"
          rules={[
            {
              validator: async (_, value: string | undefined) => {
                if (selectedFile || value?.trim()) return;
                throw new Error('Hãy chọn ảnh từ máy hoặc nhập URL hình ảnh.');
              },
            },
            { type: 'url', message: 'URL hình ảnh không hợp lệ.' },
            { max: 500 },
          ]}>
          <Input placeholder="https://..." disabled={submitting || Boolean(selectedFile)} />
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
