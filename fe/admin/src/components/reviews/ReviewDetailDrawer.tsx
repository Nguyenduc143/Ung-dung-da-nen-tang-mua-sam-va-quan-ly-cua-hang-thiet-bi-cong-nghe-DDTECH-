import {
  CheckCircleFilled,
  ShoppingFilled,
  UserOutlined,
} from '@ant-design/icons';
import {
  Avatar,
  Descriptions,
  Divider,
  Drawer,
  Empty,
  Image,
  Rate,
  Space,
  Tag,
  Typography,
} from 'antd';
import dayjs from 'dayjs';

import type { Review } from '../../types/review';
import { reviewStatusColors, reviewStatusLabels } from '../../utils/reviewPresentation';
import { ImagePreview } from '../shared';

const { Paragraph, Text, Title } = Typography;

interface ReviewDetailDrawerProps {
  review: Review | null;
  onClose: () => void;
}

export function ReviewDetailDrawer({ review, onClose }: ReviewDetailDrawerProps) {
  return (
    <Drawer
      open={review !== null}
      title="Chi tiết đánh giá"
      width={620}
      destroyOnHidden
      onClose={onClose}
    >
      {review && (
        <div className="review-detail-content">
          <div className="review-detail-user">
            <Avatar size={52} src={review.user.avatarUrl || undefined} icon={<UserOutlined />} />
            <div>
              <Title level={4}>{review.user.fullName}</Title>
              <Space wrap>
                <Rate disabled value={review.rating} />
                <Tag color={reviewStatusColors[review.status]}>{reviewStatusLabels[review.status]}</Tag>
                {review.isVerifiedPurchase && <Tag color="blue" icon={<CheckCircleFilled />}>Đã mua hàng</Tag>}
              </Space>
            </div>
          </div>

          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="Sản phẩm">#{review.product.id} · {review.product.name}</Descriptions.Item>
            <Descriptions.Item label="Người dùng">#{review.user.id} · {review.user.fullName}</Descriptions.Item>
            <Descriptions.Item label="Đơn hàng">{review.orderId ? `#${review.orderId}` : 'Không có đơn hàng liên kết'}</Descriptions.Item>
            <Descriptions.Item label="Ngày đánh giá">{dayjs(review.createdAt).format('HH:mm, DD/MM/YYYY')}</Descriptions.Item>
          </Descriptions>

          <div className="review-detail-section">
            <Text strong>Nội dung đánh giá</Text>
            <Paragraph>{review.comment || 'Khách hàng không để lại nội dung đánh giá.'}</Paragraph>
          </div>

          <div className="review-detail-section">
            <Text strong>Hình ảnh đính kèm</Text>
            {review.images?.length ? (
              <Image.PreviewGroup>
                <div className="review-image-grid">
                  {review.images.map((imageUrl, index) => (
                    <ImagePreview key={`${imageUrl}-${index}`} src={imageUrl} alt={`Ảnh đánh giá ${index + 1}`} />
                  ))}
                </div>
              </Image.PreviewGroup>
            ) : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Không có hình ảnh" />}
          </div>

          <Divider />
          <div className="review-admin-reply">
            <Text strong><ShoppingFilled /> Phản hồi từ DDTECH</Text>
            <Paragraph>{review.adminReply || 'Chưa có phản hồi từ quản trị viên.'}</Paragraph>
            {review.repliedAt && <Text type="secondary">Phản hồi lúc {dayjs(review.repliedAt).format('HH:mm, DD/MM/YYYY')}</Text>}
          </div>
        </div>
      )}
    </Drawer>
  );
}
