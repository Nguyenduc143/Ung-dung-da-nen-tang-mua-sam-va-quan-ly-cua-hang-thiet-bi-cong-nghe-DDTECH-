import type { ReviewStatus } from '../types/review';

export const reviewStatusLabels: Record<ReviewStatus, string> = {
  PENDING: 'Chờ duyệt',
  APPROVED: 'Đã duyệt',
  HIDDEN: 'Đã ẩn',
};

export const reviewStatusColors: Record<ReviewStatus, string> = {
  PENDING: 'warning',
  APPROVED: 'success',
  HIDDEN: 'default',
};
