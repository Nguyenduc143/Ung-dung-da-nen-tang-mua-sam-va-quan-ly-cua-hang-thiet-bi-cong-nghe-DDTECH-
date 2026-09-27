import { App as AntApp, DatePicker } from 'antd';
import type { Dayjs } from 'dayjs';

const { RangePicker } = DatePicker;

interface DateRangeFilterProps {
  value: [Dayjs, Dayjs];
  onChange: (value: [Dayjs, Dayjs]) => void;
  maxDays?: number;
  format?: string;
  className?: string;
}

export function DateRangeFilter({
  value,
  onChange,
  maxDays,
  format = 'DD/MM/YYYY',
  className,
}: DateRangeFilterProps) {
  const { message } = AntApp.useApp();

  return (
    <RangePicker
      allowClear={false}
      value={value}
      format={format}
      className={className}
      onChange={(nextValue) => {
        if (!nextValue?.[0] || !nextValue[1]) return;
        const range: [Dayjs, Dayjs] = [nextValue[0], nextValue[1]];
        if (maxDays && range[1].startOf('day').diff(range[0].startOf('day'), 'day') >= maxDays) {
          message.error(`Khoảng thời gian không được vượt quá ${maxDays} ngày.`);
          return;
        }
        onChange(range);
      }}
    />
  );
}
