import { Form, Input, InputNumber, Modal, Select, Switch } from 'antd';
import { useEffect } from 'react';

import type {
  AttributeInputType,
  CategoryAttribute,
  CategoryAttributeInput,
} from '../../types/catalog';

interface AttributeFormValues {
  attrKey: string;
  attrName: string;
  unit?: string;
  inputType: AttributeInputType;
  options?: string[];
  isFilterable: boolean;
  sortOrder: number;
}

interface AttributeFormModalProps {
  open: boolean;
  attribute: CategoryAttribute | null;
  submitting: boolean;
  onCancel: () => void;
  onSubmit: (input: CategoryAttributeInput) => Promise<void>;
}

export function AttributeFormModal({
  open,
  attribute,
  submitting,
  onCancel,
  onSubmit,
}: AttributeFormModalProps) {
  const [form] = Form.useForm<AttributeFormValues>();
  const inputType = Form.useWatch('inputType', form);

  useEffect(() => {
    if (!open) return;
    form.setFieldsValue({
      attrKey: attribute?.attrKey ?? '',
      attrName: attribute?.attrName ?? '',
      unit: attribute?.unit ?? '',
      inputType: attribute?.inputType ?? 'TEXT',
      options: attribute?.options ?? [],
      isFilterable: attribute?.isFilterable ?? false,
      sortOrder: attribute?.sortOrder ?? 0,
    });
  }, [attribute, form, open]);

  const handleFinish = async (values: AttributeFormValues) => {
    await onSubmit({
      attrKey: values.attrKey.trim(),
      attrName: values.attrName.trim(),
      unit: values.unit?.trim() || null,
      inputType: values.inputType,
      options: values.inputType === 'SELECT' ? values.options : null,
      isFilterable: values.isFilterable,
      sortOrder: values.sortOrder ?? 0,
    });
  };

  return (
    <Modal
      open={open}
      title={attribute ? 'Cập nhật thuộc tính' : 'Thêm thuộc tính'}
      okText={attribute ? 'Lưu thay đổi' : 'Thêm thuộc tính'}
      cancelText="Hủy"
      confirmLoading={submitting}
      onCancel={onCancel}
      onOk={() => form.submit()}
      destroyOnHidden
    >
      <Form<AttributeFormValues>
        form={form}
        layout="vertical"
        requiredMark={false}
        onFinish={handleFinish}
      >
        <Form.Item
          name="attrKey"
          label="Mã thuộc tính"
          rules={[
            { required: true, message: 'Vui lòng nhập mã thuộc tính.' },
            { pattern: /^[a-z][a-z0-9_]*$/, message: 'Bắt đầu bằng chữ thường; chỉ dùng chữ, số và dấu gạch dưới.' },
            { max: 50, message: 'Mã không được vượt quá 50 ký tự.' },
          ]}
        >
          <Input placeholder="screen_size" autoFocus />
        </Form.Item>

        <Form.Item
          name="attrName"
          label="Tên hiển thị"
          rules={[
            { required: true, whitespace: true, message: 'Vui lòng nhập tên thuộc tính.' },
            { max: 100, message: 'Tên không được vượt quá 100 ký tự.' },
          ]}
        >
          <Input placeholder="Kích thước màn hình" />
        </Form.Item>

        <Form.Item name="unit" label="Đơn vị" rules={[{ max: 20 }]}>
          <Input placeholder="inch, GB, mAh..." />
        </Form.Item>

        <Form.Item name="inputType" label="Kiểu nhập" rules={[{ required: true }]}>
          <Select
            options={[
              { value: 'TEXT', label: 'Văn bản' },
              { value: 'NUMBER', label: 'Số' },
              { value: 'SELECT', label: 'Danh sách lựa chọn' },
            ]}
          />
        </Form.Item>

        {inputType === 'SELECT' && (
          <Form.Item
            name="options"
            label="Các lựa chọn"
            tooltip="Nhập một giá trị rồi nhấn Enter."
            rules={[{ required: true, type: 'array', min: 1, message: 'Cần ít nhất một lựa chọn.' }]}
          >
            <Select mode="tags" tokenSeparators={[',']} placeholder="Ví dụ: Đen, Trắng" />
          </Form.Item>
        )}

        <div className="attribute-form-row">
          <Form.Item name="isFilterable" label="Dùng để lọc" valuePropName="checked">
            <Switch checkedChildren="Có" unCheckedChildren="Không" />
          </Form.Item>
          <Form.Item name="sortOrder" label="Thứ tự">
            <InputNumber precision={0} className="full-width" />
          </Form.Item>
        </div>
      </Form>
    </Modal>
  );
}
