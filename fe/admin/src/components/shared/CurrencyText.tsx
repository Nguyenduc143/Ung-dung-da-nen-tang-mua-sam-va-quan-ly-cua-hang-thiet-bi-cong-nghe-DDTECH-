import { Typography } from 'antd';

import { formatCurrency } from '../../utils/formatters';

interface CurrencyTextProps {
  value: number;
  strong?: boolean;
  className?: string;
}

export function CurrencyText({ value, strong = false, className }: CurrencyTextProps) {
  return <Typography.Text className={className} strong={strong}>{formatCurrency(value)}</Typography.Text>;
}
