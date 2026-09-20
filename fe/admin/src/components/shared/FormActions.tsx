import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import { Button, Space } from 'antd';

interface FormActionsProps {
  saving?: boolean;
  submitLabel?: string;
  cancelLabel?: string;
  form?: string;
  onCancel: () => void;
}

export function FormActions({
  saving = false,
  submitLabel = 'Lưu thay đổi',
  cancelLabel = 'Quay lại',
  form,
  onCancel,
}: FormActionsProps) {
  return (
    <Space wrap>
      <Button icon={<ArrowLeftOutlined />} disabled={saving} onClick={onCancel}>{cancelLabel}</Button>
      <Button type="primary" icon={<SaveOutlined />} loading={saving} htmlType="submit" form={form}>{submitLabel}</Button>
    </Space>
  );
}
