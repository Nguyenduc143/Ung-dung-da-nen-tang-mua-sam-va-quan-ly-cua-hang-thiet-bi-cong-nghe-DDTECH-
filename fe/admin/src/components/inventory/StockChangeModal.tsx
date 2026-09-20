import { Form, Input, InputNumber, Modal, Typography } from 'antd';
import { useEffect } from 'react';

import type { InventoryChangeInput } from '../../types/inventory';

const { Text } = Typography;

export interface StockTarget {
  productId: number;
  productName: string;
  productSku: string;
  variantId: number | null;
  variantName: string | null;
  variantSku: string | null;
  stock: number;
}

interface FormValues {
  quantity: number;
  note?: string;
}

interface StockChangeModalProps {
  mode: 'import' | 'adjust';
  target: StockTarget | null;
  open: boolean;
  submitting: boolean;
  onCancel: () => void;
  onSubmit: (input: InventoryChangeInput) => Promise<void>;
}

export function StockChangeModal({
  mode,
  target,
  open,
  submitting,
  onCancel,
  onSubmit,
}: StockChangeModalProps) {
  const [form] = Form.useForm<FormValues>();
  const quantity = Form.useWatch('quantity', form) ?? 0;
  const nextStock = (target?.stock ?? 0) + quantity;
  const isImport = mode === 'import';

  useEffect(() => {
    if (open) form.resetFields();
  }, [form, open, target]);

  const handleFinish = async (values: FormValues) => {
    if (!target) return;
    await onSubmit({
      productId: target.productId,
      variantId: target.variantId,
      quantity: values.quantity,
      note: values.note?.trim() || null,
    });
  };

  return (
    <Modal
      open={open}
      title={isImport ? 'Nhập thêm hàng' : 'Điều chỉnh tồn kho'}
      okText={isImport ? 'Xác nhận nhập kho' : 'Lưu điều chỉnh'}
      cancelText="Hủy"
      confirmLoading={submitting}
      destroyOnHidden
      onCancel={onCancel}
      onOk={() => form.submit()}
    >
      {target && (
        <div className="stock-target-summary">
          <div>
            <Text strong>{target.productName}</Text>
            <Text type="secondary">
              {target.variantName ? `${target.variantName} · ${target.variantSku}` : target.productSku}
            </Text>
          </div>
          <div>
            <Text type="secondary">Tồn hiện tại</Text>
            <strong>{target.stock}</strong>
          </div>
        </div>
      )}

      <Form<FormValues>
        form={form}
        layout="vertical"
        requiredMark="optional"
        initialValues={{ quantity: isImport ? 1 : undefined }}
        onFinish={(values) => void handleFinish(values)}
      >
        <Form.Item
          name="quantity"
          label={isImport ? 'Số lượng nhập' : 'Số lượng thay đổi'}
          extra={isImport ? 'Nhập số lượng hàng được cộng thêm.' : 'Dùng số dương để tăng, số âm để giảm.'}
          rules={[
            { required: true, message: 'Vui lòng nhập số lượng.' },
            {
              validator: (_, value?: number) => {
                if (value === undefined || value === null) return Promise.resolve();
                if (!Number.isInteger(value)) return Promise.reject(new Error('Số lượng phải là số nguyên.'));
                if (isImport && value <= 0) return Promise.reject(new Error('Số lượng nhập phải lớn hơn 0.'));
                if (!isImport && value === 0) return Promise.reject(new Error('Số lượng thay đổi phải khác 0.'));
                if (target && target.stock + value < 0) {
                  return Promise.reject(new Error('Tồn kho sau điều chỉnh không thể nhỏ hơn 0.'));
                }
                return Promise.resolve();
              },
            },
          ]}
        >
          <InputNumber className="full-width" precision={0} placeholder={isImport ? 'Ví dụ: 10' : 'Ví dụ: 5 hoặc -3'} />
        </Form.Item>

        <Form.Item name="note" label="Ghi chú" rules={[{ max: 255, message: 'Ghi chú tối đa 255 ký tự.' }]}>
          <Input.TextArea rows={3} showCount maxLength={255} placeholder="Lý do hoặc thông tin phiếu kho" />
        </Form.Item>

        <div className={`stock-preview ${nextStock < 0 ? 'stock-preview--error' : ''}`}>
          <Text type="secondary">Tồn kho sau thao tác</Text>
          <strong>{nextStock}</strong>
        </div>
      </Form>
    </Modal>
  );
}
