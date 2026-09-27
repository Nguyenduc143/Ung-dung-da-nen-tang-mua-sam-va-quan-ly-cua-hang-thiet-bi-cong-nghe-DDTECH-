import { Alert, Card, Col, DatePicker, Form, Input, InputNumber, Row, Select } from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { useEffect } from 'react';

import type {
  Promotion,
  PromotionDiscountType,
  PromotionInput,
  PromotionStatus,
} from '../../types/promotion';

const { TextArea } = Input;
const MAX_MONEY = 9_999_999_999_999.99;
const MAX_USAGE_LIMIT = 4_294_967_295;

interface PromotionFormValues {
  code: string;
  name: string;
  description?: string;
  discountType: PromotionDiscountType;
  discountValue: number;
  maxDiscount?: number;
  minOrderValue: number;
  usageLimit?: number;
  usageLimitPerUser: number;
  startDate: Dayjs;
  endDate: Dayjs;
  status: PromotionStatus;
}

interface PromotionFormProps {
  promotion: Promotion | null;
  saving: boolean;
  onSubmit: (input: PromotionInput) => Promise<void>;
}

export function PromotionForm({ promotion, saving, onSubmit }: PromotionFormProps) {
  const [form] = Form.useForm<PromotionFormValues>();
  const discountType = Form.useWatch('discountType', form);

  useEffect(() => {
    form.setFieldsValue({
      code: promotion?.code ?? '',
      name: promotion?.name ?? '',
      description: promotion?.description ?? '',
      discountType: promotion?.discountType ?? 'PERCENT',
      discountValue: promotion?.discountValue ?? 10,
      maxDiscount: promotion?.maxDiscount ?? undefined,
      minOrderValue: promotion?.minOrderValue ?? 0,
      usageLimit: promotion?.usageLimit ?? undefined,
      usageLimitPerUser: promotion?.usageLimitPerUser ?? 1,
      startDate: promotion ? dayjs(promotion.startDate) : dayjs(),
      endDate: promotion ? dayjs(promotion.endDate) : dayjs().add(30, 'day'),
      status: promotion?.status ?? 'ACTIVE',
    });
  }, [form, promotion]);

  const handleDiscountTypeChange = (value: PromotionDiscountType) => {
    if (value === 'FIXED') form.setFieldValue('maxDiscount', undefined);
  };

  const handleFinish = async (values: PromotionFormValues) => {
    await onSubmit({
      code: values.code.trim().toUpperCase(),
      name: values.name.trim(),
      description: values.description?.trim() || null,
      discountType: values.discountType,
      discountValue: values.discountValue,
      maxDiscount: values.discountType === 'PERCENT' ? values.maxDiscount ?? null : null,
      minOrderValue: values.minOrderValue,
      usageLimit: values.usageLimit ?? null,
      usageLimitPerUser: values.usageLimitPerUser,
      startDate: values.startDate.toISOString(),
      endDate: values.endDate.toISOString(),
      status: values.status,
    });
  };

  return (
    <Form<PromotionFormValues>
      id="promotion-form"
      form={form}
      layout="vertical"
      requiredMark={false}
      disabled={saving}
      onFinish={handleFinish}
    >
      <Card className="form-section-card" bordered={false} title="Thông tin chương trình">
        <Row gutter={[16, 0]}>
          <Col xs={24} md={9}>
            <Form.Item
              name="code"
              label="Mã khuyến mãi"
              normalize={(value: string) => value.toUpperCase()}
              rules={[
                { required: true, whitespace: true, message: 'Vui lòng nhập mã khuyến mãi.' },
                { max: 50, message: 'Mã không được vượt quá 50 ký tự.' },
                { pattern: /^[A-Za-z0-9_-]+$/, message: 'Chỉ dùng chữ, số, gạch ngang hoặc gạch dưới.' },
              ]}
            >
              <Input placeholder="Ví dụ: DDTECH10" autoFocus />
            </Form.Item>
          </Col>
          <Col xs={24} md={15}>
            <Form.Item
              name="name"
              label="Tên chương trình"
              rules={[
                { required: true, whitespace: true, message: 'Vui lòng nhập tên chương trình.' },
                { max: 150, message: 'Tên không được vượt quá 150 ký tự.' },
              ]}
            >
              <Input placeholder="Ví dụ: Giảm 10% toàn bộ sản phẩm" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="description"
          label="Mô tả"
          rules={[{ max: 500, message: 'Mô tả không được vượt quá 500 ký tự.' }]}
        >
          <TextArea rows={3} showCount maxLength={500} placeholder="Điều kiện và nội dung khuyến mãi" />
        </Form.Item>

        <Row gutter={[16, 0]}>
          <Col xs={24} md={12}>
            <Form.Item name="startDate" label="Thời gian bắt đầu" rules={[{ required: true, message: 'Vui lòng chọn thời gian bắt đầu.' }]}>
              <DatePicker showTime format="DD/MM/YYYY HH:mm" className="promotion-date-picker" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name="endDate"
              label="Thời gian kết thúc"
              dependencies={['startDate']}
              rules={[
                { required: true, message: 'Vui lòng chọn thời gian kết thúc.' },
                ({ getFieldValue }) => ({
                  validator(_, value: Dayjs | undefined) {
                    const startDate = getFieldValue('startDate') as Dayjs | undefined;
                    if (!value || !startDate || value.isAfter(startDate)) return Promise.resolve();
                    return Promise.reject(new Error('Thời gian kết thúc phải sau thời gian bắt đầu.'));
                  },
                }),
              ]}
            >
              <DatePicker showTime format="DD/MM/YYYY HH:mm" className="promotion-date-picker" />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      <Card className="form-section-card" bordered={false} title="Giá trị giảm giá">
        <Row gutter={[16, 0]}>
          <Col xs={24} md={8}>
            <Form.Item name="discountType" label="Loại giảm giá" rules={[{ required: true }]}>
              <Select
                options={[
                  { value: 'PERCENT', label: 'Theo phần trăm' },
                  { value: 'FIXED', label: 'Số tiền cố định' },
                ]}
                onChange={handleDiscountTypeChange}
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item
              name="discountValue"
              label={discountType === 'FIXED' ? 'Số tiền giảm' : 'Phần trăm giảm'}
              rules={[
                { required: true, message: 'Vui lòng nhập giá trị giảm.' },
                {
                  validator(_, value: number | undefined) {
                    if (value === undefined || value <= 0) return Promise.reject(new Error('Giá trị giảm phải lớn hơn 0.'));
                    if (discountType === 'PERCENT' && value > 100) return Promise.reject(new Error('Phần trăm giảm không được vượt quá 100.'));
                    return Promise.resolve();
                  },
                },
              ]}
            >
              <InputNumber<number>
                min={0}
                max={discountType === 'PERCENT' ? 100 : MAX_MONEY}
                precision={2}
                addonAfter={discountType === 'PERCENT' ? '%' : 'đ'}
                className="promotion-number-input"
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item
              name="maxDiscount"
              label="Mức giảm tối đa"
              tooltip="Chỉ áp dụng cho khuyến mãi theo phần trăm."
              rules={[{ type: 'number', min: 0.01, message: 'Mức giảm tối đa phải lớn hơn 0.' }]}
            >
              <InputNumber<number>
                min={0.01}
                max={MAX_MONEY}
                precision={2}
                addonAfter="đ"
                disabled={discountType !== 'PERCENT' || saving}
                className="promotion-number-input"
                placeholder="Không giới hạn"
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="minOrderValue"
          label="Giá trị đơn hàng tối thiểu"
          rules={[
            { required: true, message: 'Vui lòng nhập giá trị đơn hàng tối thiểu.' },
            { type: 'number', min: 0, message: 'Giá trị đơn hàng tối thiểu không được âm.' },
          ]}
        >
          <InputNumber<number> min={0} max={MAX_MONEY} precision={2} addonAfter="đ" className="promotion-number-input" />
        </Form.Item>
      </Card>

      <Card className="form-section-card" bordered={false} title="Giới hạn sử dụng">
        <Row gutter={[16, 0]}>
          <Col xs={24} md={8}>
            <Form.Item
              name="usageLimit"
              label="Tổng lượt sử dụng"
              tooltip="Để trống nếu không giới hạn tổng số lượt."
              rules={[
                { type: 'integer', message: 'Số lượt phải là số nguyên.' },
                { type: 'number', min: 1, message: 'Số lượt phải lớn hơn 0.' },
                {
                  validator(_, value: number | undefined) {
                    if (value === undefined || !promotion || value >= promotion.usedCount) return Promise.resolve();
                    return Promise.reject(new Error(`Không được nhỏ hơn ${promotion.usedCount} lượt đã dùng.`));
                  },
                },
              ]}
            >
              <InputNumber<number> min={1} max={MAX_USAGE_LIMIT} precision={0} className="promotion-number-input" placeholder="Không giới hạn" />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item
              name="usageLimitPerUser"
              label="Lượt dùng mỗi người"
              rules={[
                { required: true, message: 'Vui lòng nhập giới hạn mỗi người.' },
                { type: 'integer', message: 'Số lượt phải là số nguyên.' },
                { type: 'number', min: 1, message: 'Mỗi người phải có ít nhất 1 lượt.' },
              ]}
            >
              <InputNumber<number> min={1} max={MAX_USAGE_LIMIT} precision={0} className="promotion-number-input" />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item name="status" label="Trạng thái" rules={[{ required: true }]}>
              <Select
                options={[
                  { value: 'ACTIVE', label: 'Hoạt động' },
                  { value: 'INACTIVE', label: 'Ngừng hoạt động' },
                ]}
              />
            </Form.Item>
          </Col>
        </Row>

        {promotion && (
          <Alert
            type="info"
            showIcon
            message={`Mã này đã được sử dụng ${promotion.usedCount} lượt.`}
            description="Tổng giới hạn sử dụng không thể nhỏ hơn số lượt đã dùng."
          />
        )}
      </Card>
    </Form>
  );
}
