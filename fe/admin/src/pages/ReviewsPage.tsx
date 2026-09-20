import {
  CheckOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  MessageOutlined,
  ReloadOutlined,
  StarFilled,
  UserOutlined,
} from '@ant-design/icons';
import {
  App as AntApp,
  Avatar,
  Button,
  Card,
  InputNumber,
  Rate,
  Select,
  Space,
  Tag,
  Tooltip,
  Typography,
  type TableColumnsType,
} from 'antd';
import dayjs from 'dayjs';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { getApiErrorMessage } from '../api/axiosClient';
import * as reviewApi from '../api/reviewApi';
import { ReviewDetailDrawer } from '../components/reviews/ReviewDetailDrawer';
import { ReviewReplyModal } from '../components/reviews/ReviewReplyModal';
import {
  ConfirmDialog,
  DataTable,
  ErrorState,
  PageHeader,
  StatusBadge,
} from '../components/shared';
import type { Review, ReviewQuery, ReviewStatus } from '../types/review';
import { reviewStatusColors, reviewStatusLabels } from '../utils/reviewPresentation';

const { Text } = Typography;

const initials = (name: string) => name.trim().split(/\s+/).slice(-2).map((part) => part[0]).join('').toUpperCase();

export function ReviewsPage() {
  const { message } = AntApp.useApp();
  const navigate = useNavigate();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [productId, setProductId] = useState<number>();
  const [userId, setUserId] = useState<number>();
  const [rating, setRating] = useState<number>();
  const [status, setStatus] = useState<ReviewStatus>();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [changingId, setChangingId] = useState<number | null>(null);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [replyReview, setReplyReview] = useState<Review | null>(null);
  const [replying, setReplying] = useState(false);

  const query = useMemo<ReviewQuery>(() => ({
    page,
    limit: pageSize,
    productId,
    userId,
    rating,
    status,
  }), [page, pageSize, productId, rating, status, userId]);

  const loadReviews = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await reviewApi.listReviews(query);
      setReviews(data.reviews);
      setTotal(data.pagination.total);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Không thể tải danh sách đánh giá.'));
    } finally {
      setLoading(false);
    }
  }, [query]);

  useEffect(() => { void loadReviews(); }, [loadReviews]);

  const syncReview = (updatedReview: Review) => {
    setReviews((current) => current.map((item) => item.id === updatedReview.id ? updatedReview : item));
    setSelectedReview((current) => current?.id === updatedReview.id ? updatedReview : current);
  };

  const changeStatus = async (review: Review, nextStatus: ReviewStatus) => {
    setChangingId(review.id);
    try {
      const updatedReview = await reviewApi.updateReviewStatus(review.id, nextStatus);
      syncReview(updatedReview);
      message.success(nextStatus === 'APPROVED' ? 'Đã duyệt đánh giá.' : 'Đã ẩn đánh giá.');
    } catch (requestError) {
      message.error(getApiErrorMessage(requestError, 'Không thể cập nhật trạng thái đánh giá.'));
    } finally {
      setChangingId(null);
    }
  };

  const handleReply = async (reply: string) => {
    if (!replyReview) return;
    setReplying(true);
    try {
      const updatedReview = await reviewApi.replyReview(replyReview.id, reply);
      syncReview(updatedReview);
      setReplyReview(null);
      message.success('Đã gửi phản hồi đánh giá.');
    } catch (requestError) {
      message.error(getApiErrorMessage(requestError, 'Không thể gửi phản hồi đánh giá.'));
    } finally {
      setReplying(false);
    }
  };

  const clearFilters = () => {
    setProductId(undefined);
    setUserId(undefined);
    setRating(undefined);
    setStatus(undefined);
    setPage(1);
  };

  const columns: TableColumnsType<Review> = [
    {
      title: 'Người đánh giá', key: 'user', width: 230,
      render: (_, record) => (
        <div className="review-user-cell">
          <Avatar size={42} src={record.user.avatarUrl || undefined} icon={!record.user.fullName ? <UserOutlined /> : undefined}>
            {record.user.fullName ? initials(record.user.fullName) : null}
          </Avatar>
          <div className="table-primary-cell"><strong>{record.user.fullName}</strong><span>User #{record.user.id}</span></div>
        </div>
      ),
    },
    {
      title: 'Sản phẩm', key: 'product', width: 245,
      render: (_, record) => (
        <Button className="review-product-link" type="link" onClick={() => navigate(`/products/${record.product.id}/edit`)}>
          {record.product.name}
        </Button>
      ),
    },
    {
      title: 'Đánh giá', key: 'rating', width: 145,
      render: (_, record) => <Rate className="review-rating" disabled value={record.rating} />,
    },
    {
      title: 'Nội dung', dataIndex: 'comment', key: 'comment', width: 300, ellipsis: true,
      render: (value: string | null) => value || <Text type="secondary">Không có nội dung</Text>,
    },
    {
      title: 'Xác thực', dataIndex: 'isVerifiedPurchase', key: 'isVerifiedPurchase', width: 130,
      render: (value: boolean) => value ? <Tag color="blue">Đã mua hàng</Tag> : <Tag>Chưa xác thực</Tag>,
    },
    {
      title: 'Trạng thái', dataIndex: 'status', key: 'status', width: 120,
      render: (value: ReviewStatus) => <StatusBadge status={value} labels={reviewStatusLabels} colors={reviewStatusColors} />,
    },
    {
      title: 'Ngày tạo', dataIndex: 'createdAt', key: 'createdAt', width: 150,
      render: (value: string) => dayjs(value).format('DD/MM/YYYY HH:mm'),
    },
    {
      title: 'Thao tác', key: 'actions', fixed: 'right', width: 170,
      render: (_, record) => (
        <Space size={2}>
          <Tooltip title="Xem chi tiết"><Button type="text" icon={<EyeOutlined />} onClick={() => setSelectedReview(record)} /></Tooltip>
          {record.status !== 'APPROVED' && (
            <Tooltip title="Duyệt đánh giá">
              <Button type="text" loading={changingId === record.id} icon={<CheckOutlined />} onClick={() => void changeStatus(record, 'APPROVED')} />
            </Tooltip>
          )}
          {record.status !== 'HIDDEN' && (
            <ConfirmDialog
              title="Ẩn đánh giá này?"
              description="Đánh giá sẽ không còn xuất hiện trên trang sản phẩm."
              okText="Ẩn đánh giá"
              cancelText="Hủy"
              okButtonProps={{ danger: true, loading: changingId === record.id }}
              onConfirm={() => changeStatus(record, 'HIDDEN')}
            >
              <Tooltip title="Ẩn đánh giá"><Button danger type="text" icon={<EyeInvisibleOutlined />} /></Tooltip>
            </ConfirmDialog>
          )}
          <Tooltip title={record.adminReply ? 'Cập nhật phản hồi' : 'Phản hồi'}>
            <Button type="text" icon={<MessageOutlined />} onClick={() => setReplyReview(record)} />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <section aria-labelledby="reviews-title">
      <PageHeader
        titleId="reviews-title"
        eyebrow="PHẢN HỒI KHÁCH HÀNG"
        title="Quản lý đánh giá"
        description="Duyệt nội dung, ẩn đánh giá không phù hợp và phản hồi khách hàng."
      />

      {error && <ErrorState message={error} onRetry={() => void loadReviews()} retrying={loading} />}

      <Card className="product-filter-card" bordered={false}>
        <div className="review-filter-grid">
          <InputNumber<number>
            min={1} precision={0} value={productId} placeholder="Product ID"
            onChange={(value) => { setProductId(value ?? undefined); setPage(1); }}
          />
          <InputNumber<number>
            min={1} precision={0} value={userId} placeholder="User ID"
            onChange={(value) => { setUserId(value ?? undefined); setPage(1); }}
          />
          <Select<number>
            allowClear value={rating} placeholder="Số sao"
            options={[5, 4, 3, 2, 1].map((value) => ({ value, label: `${value} sao` }))}
            onChange={(value) => { setRating(value); setPage(1); }}
          />
          <Select<ReviewStatus>
            allowClear value={status} placeholder="Trạng thái"
            options={Object.entries(reviewStatusLabels).map(([value, label]) => ({ value, label }))}
            onChange={(value) => { setStatus(value); setPage(1); }}
          />
          <Space><Button onClick={clearFilters}>Xóa bộ lọc</Button><Button icon={<ReloadOutlined />} onClick={() => void loadReviews()}>Làm mới</Button></Space>
        </div>
      </Card>

      <Card className="management-card review-table-card" bordered={false}>
        <div className="table-summary"><StarFilled /> {total} đánh giá</div>
        <DataTable<Review>
          rowKey="id" columns={columns} dataSource={reviews} loading={loading} scroll={{ x: 1490 }}
          onRow={(record) => ({ onDoubleClick: () => setSelectedReview(record) })}
          pagination={{
            current: page, pageSize, total, showSizeChanger: true, pageSizeOptions: [10, 20, 50, 100],
            showTotal: (count) => `Tổng ${count} đánh giá`,
            onChange: (nextPage, nextPageSize) => { setPage(nextPageSize === pageSize ? nextPage : 1); setPageSize(nextPageSize); },
          }}
          hasError={Boolean(error)}
          emptyMessage="Chưa có đánh giá phù hợp"
        />
      </Card>

      <ReviewDetailDrawer review={selectedReview} onClose={() => setSelectedReview(null)} />
      <ReviewReplyModal
        review={replyReview}
        open={replyReview !== null}
        submitting={replying}
        onCancel={() => setReplyReview(null)}
        onSubmit={handleReply}
      />
    </section>
  );
}
