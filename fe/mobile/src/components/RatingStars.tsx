import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, spacing, typography } from '@/theme';

export interface RatingStarsProps {
  rating: number;
  count?: number;
  max?: number;
  showValue?: boolean;
  size?: number;
  style?: StyleProp<ViewStyle>;
}

export function RatingStars({
  rating,
  count,
  max = 5,
  showValue = false,
  size = 16,
  style,
}: RatingStarsProps) {
  const normalizedRating = Math.min(max, Math.max(0, rating));

  return (
    <View accessibilityLabel={`${normalizedRating} trên ${max} sao`} style={[styles.container, style]}>
      <View style={styles.stars}>
        {Array.from({ length: max }, (_, index) => {
          const difference = normalizedRating - index;
          const name = difference >= 1 ? 'star' : difference >= 0.5 ? 'star-half' : 'star-outline';
          return <Ionicons color={colors.rating} key={index} name={name} size={size} />;
        })}
      </View>
      {showValue ? <Text style={styles.value}>{normalizedRating.toFixed(1)}</Text> : null}
      {typeof count === 'number' ? <Text style={styles.count}>({count})</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  stars: { flexDirection: 'row', gap: spacing.xxs },
  value: { ...typography.bodySmallSemibold, color: colors.textPrimary },
  count: { ...typography.bodySmall, color: colors.textSecondary },
});
