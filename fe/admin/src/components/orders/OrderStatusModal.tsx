import { Alert, Form, Input, Modal, Select } from 'antd';
import { useEffect } from 'react';

import type { Order, OrderStatus, UpdateOrderStatusInput } from '../../types/order';
import { nextOrderStatuses, orderStatusLabels } from '../../utils/orderPresentation';

interface FormValues {
  status: Exclude<OrderStatus, 'PENDING'>;
  note?: string;
}

interface OrderStatusModalProps {
  order: Order | null;
  open: boolean;
  submitting: boolean;
  onCancel: () => void;
  onSubmit: (input: UpdateOrderStatusInput) => Promise<void>;
}

export function OrderStatusModal({ order, open, submitting, onCancel, onSubmit }: OrderStatusModalProps) {
  const [form] = Form.useForm<FormValues>();
  const selectedStatus = Form.useWatch('status', form);
  const options = order
    ? nextOrderStatuses[order.status].map((status) => ({ value: status, label: orderStatusLabels[status] }))
    : [];

  useEffect(() => {
    if (open) form.resetFields();
  }, [form, open, order]);

  const handleFinish = async (values: FormValues) => {
    await onSubmit({
      status: values.status,
      note: values.note?.trim() || null,
    });
  };

  return (
    <Modal
      open={open}
      title={`Cập nhật trạng thái${order ? ` · ${order.orderCode}` : ''}`}
      okText={selectedStatus === 'CANCELLED' ? 'Xác nhận hủy đơn' : 'Cập nhật'}
      okButtonProps={{ danger: selectedStatus === 'CANCELLED' }}
      cancelText="Đóng"
      confirmLoading={submitting}
      destroyOnHidden
      onCancel={onCancel}
      onOk={() => form.submit()}
    >
      {order && (
        <Alert
          className="content-alert"
          type="info"
          showIcon
          message={`Trạng thái hiện tại: ${orderStatusLabels[order.status]}`}
        />
      )}
      <Form<FormValues> form={form} layout="vertical" requiredMark={false} onFinish={(values) => void handleFinish(values)}>
        <Form.Item name="status" label="Trạng thái mới" rules={[{ required: true, message: 'Vui lòng chọn trạng thái mới.' }]}>
          <Select options={options} placeholder="Chọn bước tiếp theo" />
        </Form.Item>
        <Form.Item
          name="note"
          label={selectedStatus === 'CANCELLED' ? 'Lý do hủy' : 'Ghi chú'}
          rules={[
            { max: 255, message: 'Ghi chú tối đa 255 ký tự.' },
            ...(selectedStatus === 'CANCELLED'
              ? [{ required: true, whitespace: true, message: 'Vui lòng nhập lý do hủy đơn.' }]
              : []),
          ]}
        >
          <Input.TextArea rows={3} showCount maxLength={255} placeholder="Thông tin cho lần cập nhật này" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
