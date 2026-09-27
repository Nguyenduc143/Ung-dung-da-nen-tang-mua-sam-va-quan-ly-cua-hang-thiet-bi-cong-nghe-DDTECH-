import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components';
import { colors, shadows, spacing, typography } from '@/theme';

interface CartSummaryBarProps {
  itemCount: number;
  subtotal: number;
  disabled: boolean;
  onCheckout: () => void;
}

const currencyFormatter = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 });

export function CartSummaryBar({
  itemCount,
  subtotal,
  disabled,
  onCheckout,
}: CartSummaryBarProps) {
  return (
    <SafeAreaView edges={['bottom']} style={styles.safeArea}>
      <View style={styles.summaryRow}>
        <View>
          <Text style={styles.label}>Tạm tính ({itemCount} sản phẩm)</Text>
          <Text style={styles.hint}>Chưa bao gồm phí vận chuyển</Text>
        </View>
        <Text style={styles.total}>{currencyFormatter.format(subtotal)}đ</Text>
      </View>
      <PrimaryButton
        disabled={disabled}
        onPress={onCheckout}
        title="Tiến hành thanh toán"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    backgroundColor: colors.surface,
    ...shadows.floating,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  label: { ...typography.bodySmallSemibold, color: colors.textPrimary },
  hint: { ...typography.caption, color: colors.textMuted, marginTop: spacing.xxs },
  total: { ...typography.titleSmall, color: colors.primary },
});
