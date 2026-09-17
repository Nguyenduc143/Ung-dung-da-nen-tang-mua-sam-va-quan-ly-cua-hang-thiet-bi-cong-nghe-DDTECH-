import {
  DeleteOutlined,
  PlusOutlined,
  StarFilled,
  StarOutlined,
} from '@ant-design/icons';
import {
  App as AntApp,
  Button,
  Card,
  Empty,
  Image,
  Popconfirm,
  Space,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import { useMemo, useState } from 'react';

import * as productApi from '../../api/productApi';
import { getApiErrorMessage } from '../../api/axiosClient';
import type { ProductImage, ProductImageInput, ProductVariant } from '../../types/product';
import { ProductImageFormModal } from './ProductImageFormModal';

const { Text } = Typography;

interface ProductImagesPanelProps {
  productId: number;
  images: ProductImage[];
  variants: ProductVariant[];
  onChanged: () => Promise<void>;
}

export function ProductImagesPanel({ productId, images, variants, onChanged }: ProductImagesPanelProps) {
  const { message } = AntApp.useApp();
  const [formOpen, setFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [workingId, setWorkingId] = useState<number | null>(null);
  const variantById = useMemo(() => new Map(variants.map((item) => [item.id, item])), [variants]);

  const handleCreate = async (input: ProductImageInput) => {
    setSubmitting(true);
    try {
      await productApi.createImage(productId, input);
      message.success('Đã thêm ảnh sản phẩm.');
      setFormOpen(false);
      await onChanged();
    } catch (requestError) {
      message.error(getApiErrorMessage(requestError, 'Không thể thêm ảnh sản phẩm.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrimary = async (image: ProductImage) => {
    setWorkingId(image.id);
    try {
      await productApi.setPrimaryImage(image.id);
      message.success('Đã đặt ảnh chính.');
      await onChanged();
    } catch (requestError) {
      message.error(getApiErrorMessage(requestError, 'Không thể đặt ảnh chính.'));
    } finally {
      setWorkingId(null);
    }
  };

  const handleDelete = async (image: ProductImage) => {
    setWorkingId(image.id);
    try {
      await productApi.deleteImage(image.id);
      message.success('Đã xóa ảnh sản phẩm.');
      await onChanged();
    } catch (requestError) {
      message.error(getApiErrorMessage(requestError, 'Không thể xóa ảnh sản phẩm.'));
    } finally {
      setWorkingId(null);
    }
  };

  return (
    <>
      <Card className="form-section-card" bordered={false} title="Hình ảnh sản phẩm"
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setFormOpen(true)}>Thêm ảnh</Button>}>
        {images.length === 0 ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Sản phẩm chưa có hình ảnh" />
        ) : (
          <Image.PreviewGroup>
            <div className="product-image-grid">
              {images.map((image) => (
                <div className={`product-image-card${image.isPrimary ? ' product-image-card--primary' : ''}`} key={image.id}>
                  <div className="product-image-preview">
                    <Image src={image.imageUrl} alt={image.altText ?? 'Ảnh sản phẩm'} fallback="" />
                    {image.isPrimary && <Tag className="primary-image-badge" icon={<StarFilled />} color="blue">Ảnh chính</Tag>}
                  </div>
                  <div className="product-image-meta">
                    <Text ellipsis title={image.altText ?? undefined}>{image.altText || 'Không có mô tả'}</Text>
                    <Text type="secondary">
                      {image.variantId ? variantById.get(image.variantId)?.variantName ?? `Variant #${image.variantId}` : 'Ảnh chung'}
                    </Text>
                  </div>
                  <Space className="product-image-actions">
                    {!image.isPrimary && (
                      <Tooltip title="Đặt làm ảnh chính">
                        <Button type="text" icon={<StarOutlined />} loading={workingId === image.id}
                          onClick={() => void handlePrimary(image)} />
                      </Tooltip>
                    )}
                    <Popconfirm title="Xóa ảnh này?" okText="Xóa" cancelText="Hủy"
                      okButtonProps={{ danger: true, loading: workingId === image.id }}
                      onConfirm={() => handleDelete(image)}>
                      <Tooltip title="Xóa ảnh"><Button danger type="text" icon={<DeleteOutlined />} /></Tooltip>
                    </Popconfirm>
                  </Space>
                </div>
              ))}
            </div>
          </Image.PreviewGroup>
        )}
      </Card>

      <ProductImageFormModal open={formOpen} variants={variants} submitting={submitting}
        onCancel={() => setFormOpen(false)} onSubmit={handleCreate} />
    </>
  );
}
