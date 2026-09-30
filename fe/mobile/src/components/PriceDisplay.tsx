import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, fontWeights, spacing, typography } from '@/theme';

const currencyFormatter = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 });

const formatPrice = (value: number) => `${currencyFormatter.format(Math.max(0, value))}đ`;

export interface PriceDisplayProps {
  price: number | null;
  originalPrice?: number | null;
  direction?: 'row' | 'column';
  size?: 'small' | 'medium' | 'large';
  style?: StyleProp<ViewStyle>;
}

export function PriceDisplay({
  price,
  originalPrice,
  direction = 'column',
  size = 'medium',
  style,
}: PriceDisplayProps) {
  const hasPrice = typeof price === 'number' && Number.isFinite(price) && price > 0;
  const hasDiscount = hasPrice && typeof originalPrice === 'number' && originalPrice > price;

  return (
    <View style={[styles.container, direction === 'row' && styles.row, style]}>
      <Text style={[styles.price, sizeStyles[size]]}>{hasPrice ? formatPrice(price) : 'Giá đang cập nhật'}</Text>
      {hasDiscount ? <Text style={styles.originalPrice}>{formatPrice(originalPrice)}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'flex-start', gap: spacing.xxs },
  row: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm },
  price: { color: colors.primary, fontWeight: fontWeights.bold },
  originalPrice: { ...typography.bodySmall, color: colors.textMuted, textDecorationLine: 'line-through' },
});

const sizeStyles = StyleSheet.create({
  small: { ...typography.bodySmallSemibold },
  medium: { ...typography.bodySemibold },
  large: { ...typography.titleSmall },
});
