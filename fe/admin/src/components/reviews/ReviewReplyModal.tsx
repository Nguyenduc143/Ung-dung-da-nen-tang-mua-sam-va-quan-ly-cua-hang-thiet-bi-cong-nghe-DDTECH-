import { Alert, Form, Input, Modal } from 'antd';
import { useEffect } from 'react';

import type { Review } from '../../types/review';

interface FormValues {
  reply: string;
}

interface ReviewReplyModalProps {
  review: Review | null;
  open: boolean;
  submitting: boolean;
  onCancel: () => void;
  onSubmit: (reply: string) => Promise<void>;
}

export function ReviewReplyModal({
  review,
  open,
  submitting,
  onCancel,
  onSubmit,
}: ReviewReplyModalProps) {
  const [form] = Form.useForm<FormValues>();

  useEffect(() => {
    if (!open) return;
    form.setFieldsValue({ reply: review?.adminReply ?? '' });
  }, [form, open, review]);

  const handleFinish = async (values: FormValues) => {
    await onSubmit(values.reply.trim());
  };

  return (
    <Modal
      open={open}
      title={review?.adminReply ? 'Cập nhật phản hồi' : 'Phản hồi đánh giá'}
      okText={review?.adminReply ? 'Lưu phản hồi' : 'Gửi phản hồi'}
      cancelText="Hủy"
      confirmLoading={submitting}
      destroyOnHidden
      width={620}
      onCancel={onCancel}
      onOk={() => form.submit()}
    >
      {review && (
        <Alert
          className="content-alert"
          type="info"
          showIcon
          message={`${review.user.fullName} · ${review.rating}/5 sao`}
          description={review.comment || 'Khách hàng không để lại nội dung đánh giá.'}
        />
      )}
      <Form<FormValues>
        form={form}
        layout="vertical"
        requiredMark={false}
        onFinish={(values) => void handleFinish(values)}
      >
        <Form.Item
          name="reply"
          label="Nội dung phản hồi"
          rules={[
            { required: true, whitespace: true, message: 'Vui lòng nhập nội dung phản hồi.' },
            { max: 5000, message: 'Phản hồi không được vượt quá 5000 ký tự.' },
          ]}
        >
          <Input.TextArea
            rows={6}
            showCount
            maxLength={5000}
            placeholder="Nhập phản hồi chính thức từ DDTECH"
            autoFocus
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
