import { Ionicons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ImageSourcePropType,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { colors, radius, shadows, spacing, typography } from '@/theme';
import { PriceDisplay } from './PriceDisplay';
import { StatusBadge, type StatusBadgeTone } from './StatusBadge';

export interface OrderCardProps {
  code: string;
  date: string;
  productName: string;
  quantity?: number;
  statusLabel: string;
  total: number;
  imageSource?: ImageSourcePropType;
  onPress?: () => void;
  onBuyAgain?: () => void;
  onReview?: () => void;
  buyAgainLoading?: boolean;
  productSummary?: string;
  statusTone?: StatusBadgeTone;
  style?: StyleProp<ViewStyle>;
}

export function OrderCard({
  code,
  date,
  productName,
  quantity,
  statusLabel,
  total,
  imageSource,
  onPress,
  onBuyAgain,
  onReview,
  buyAgainLoading = false,
  productSummary,
  statusTone = 'neutral',
  style,
}: OrderCardProps) {
  return (
    <Pressable
      accessibilityLabel={`Đơn hàng ${code}, ${statusLabel}`}
      accessibilityRole={onPress ? 'button' : undefined}
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed, style]}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.code}>{code}</Text>
          <Text style={styles.date}>{date}</Text>
        </View>
        <StatusBadge label={statusLabel} tone={statusTone} />
      </View>
      <View style={styles.productRow}>
        <View style={styles.imageContainer}>
          {imageSource ? (
            <Image resizeMode="contain" source={imageSource} style={styles.image} />
          ) : (
            <Ionicons color={colors.textMuted} name="cube-outline" size={34} />
          )}
        </View>
        <View style={styles.productContent}>
          <Text numberOfLines={2} style={styles.productName}>{productName}</Text>
          {productSummary ? <Text numberOfLines={1} style={styles.summary}>{productSummary}</Text> : null}
          {typeof quantity === 'number' && quantity > 0 ? (
            <Text style={styles.quantity}>x{quantity}</Text>
          ) : null}
        </View>
      </View>
      <View style={styles.footer}>
        <Text style={styles.totalLabel}>Tổng tiền</Text>
        <PriceDisplay direction="row" price={total} />
        {onPress ? <Ionicons color={colors.textSecondary} name="chevron-forward" size={22} /> : null}
      </View>
      {onBuyAgain || onReview ? (
        <View style={styles.actions}>
          {onBuyAgain ? (
            <Pressable
              accessibilityLabel="Mua lại đơn hàng"
              accessibilityRole="button"
              disabled={buyAgainLoading}
              onPress={(event) => {
                event.stopPropagation();
                onBuyAgain();
              }}
              style={({ pressed }) => [
                styles.actionButton,
                pressed && styles.actionPressed,
                buyAgainLoading && styles.actionDisabled,
              ]}
            >
              {buyAgainLoading ? (
                <ActivityIndicator color={colors.textPrimary} size="small" />
              ) : (
                <Text style={styles.buyAgainText}>Mua lại</Text>
              )}
            </Pressable>
          ) : null}
          {onReview ? (
            <Pressable
              accessibilityLabel="Đánh giá đơn hàng"
              accessibilityRole="button"
              onPress={(event) => {
                event.stopPropagation();
                onReview();
              }}
              style={({ pressed }) => [
                styles.actionButton,
                styles.reviewActionButton,
                pressed && styles.reviewActionPressed,
              ]}
            >
              <Text style={styles.reviewActionText}>Đánh giá</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    ...shadows.card,
  },
  pressed: { opacity: 0.78 },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.md },
  code: { ...typography.bodySemibold, color: colors.textPrimary },
  date: { ...typography.bodySmall, color: colors.textSecondary, marginTop: spacing.xxs },
  productRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginVertical: spacing.lg },
  imageContainer: {
    width: 92,
    height: 92,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
  },
  image: { width: '88%', height: '88%' },
  productContent: { flex: 1 },
  productName: { ...typography.bodySemibold, color: colors.textPrimary },
  summary: { ...typography.bodySmall, color: colors.textSecondary, marginTop: spacing.xs },
  quantity: { ...typography.bodySmall, color: colors.textSecondary, marginTop: spacing.xs },
  footer: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  totalLabel: { ...typography.bodySmall, flex: 1, color: colors.textSecondary },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    paddingTop: spacing.lg,
    marginTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  actionButton: {
    minWidth: 112,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  reviewActionButton: { borderColor: colors.primary },
  buyAgainText: { ...typography.bodySmallSemibold, color: colors.textPrimary },
  reviewActionText: { ...typography.bodySmallSemibold, color: colors.primary },
  actionPressed: { backgroundColor: colors.surfaceMuted },
  reviewActionPressed: { backgroundColor: colors.primarySoft },
  actionDisabled: { opacity: 0.6 },
});
