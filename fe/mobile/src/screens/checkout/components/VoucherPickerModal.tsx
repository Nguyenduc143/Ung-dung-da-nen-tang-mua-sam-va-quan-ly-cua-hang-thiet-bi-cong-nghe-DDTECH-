import { Ionicons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, radius, shadows, spacing, typography } from '@/theme';
import type { PromotionValidationData } from '@/types';

interface VoucherPickerModalProps {
  error: string | null;
  isLoading: boolean;
  onClose: () => void;
  onRetry: () => void;
  onSelect: (voucher: PromotionValidationData) => void;
  selectedCode?: string;
  visible: boolean;
  vouchers: PromotionValidationData[];
}

const currencyFormatter = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 });
const formatCurrency = (value: number) => `${currencyFormatter.format(Math.max(0, value))}đ`;

const getOfferLabel = (voucher: PromotionValidationData): string => {
  const promotion = voucher.promotion;
  if (promotion.discountType === 'FIXED') return `Giảm ${formatCurrency(promotion.discountValue)}`;
  const cap = promotion.maxDiscount ? `, tối đa ${formatCurrency(promotion.maxDiscount)}` : '';
  return `Giảm ${promotion.discountValue}%${cap}`;
};

export function VoucherPickerModal({
  error,
  isLoading,
  onClose,
  onRetry,
  onSelect,
  selectedCode,
  visible,
  vouchers,
}: VoucherPickerModalProps) {
  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
      transparent
      visible={visible}
    >
      <View style={styles.overlay}>
        <Pressable accessibilityLabel="Đóng danh sách voucher" onPress={onClose} style={styles.backdrop} />
        <SafeAreaView edges={['bottom']} style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Voucher của bạn</Text>
              <Text style={styles.subtitle}>Chọn mã phù hợp cho đơn hàng này</Text>
            </View>
            <Pressable accessibilityLabel="Đóng" hitSlop={8} onPress={onClose}>
              <Ionicons color={colors.textSecondary} name="close" size={26} />
            </Pressable>
          </View>

          {isLoading ? (
            <View style={styles.state}>
              <ActivityIndicator color={colors.primary} size="large" />
              <Text style={styles.stateText}>Đang tìm voucher khả dụng...</Text>
            </View>
          ) : error ? (
            <View style={styles.state}>
              <Ionicons color={colors.danger} name="alert-circle-outline" size={40} />
              <Text style={styles.errorText}>{error}</Text>
              <Pressable onPress={onRetry} style={styles.retryButton}>
                <Text style={styles.retryText}>Thử lại</Text>
              </Pressable>
            </View>
          ) : (
            <FlatList
              contentContainerStyle={styles.listContent}
              data={vouchers}
              keyExtractor={(item) => String(item.promotion.id)}
              ListEmptyComponent={(
                <View style={styles.state}>
                  <Ionicons color={colors.textMuted} name="ticket-outline" size={44} />
                  <Text style={styles.emptyTitle}>Chưa có voucher phù hợp</Text>
                  <Text style={styles.stateText}>
                    Bạn vẫn có thể nhập mã voucher ở màn hình thanh toán.
                  </Text>
                </View>
              )}
              renderItem={({ item }) => {
                const selected = selectedCode === item.promotion.code;
                return (
                  <Pressable
                    accessibilityRole="radio"
                    accessibilityState={{ checked: selected }}
                    onPress={() => onSelect(item)}
                    style={({ pressed }) => [
                      styles.voucher,
                      selected && styles.selectedVoucher,
                      pressed && styles.pressed,
                    ]}
                  >
                    <View style={styles.ticketIcon}>
                      <Ionicons color={colors.primary} name="ticket" size={25} />
                    </View>
                    <View style={styles.voucherContent}>
                      <View style={styles.codeRow}>
                        <Text style={styles.code}>{item.promotion.code}</Text>
                        {selected ? (
                          <Ionicons color={colors.primary} name="checkmark-circle" size={21} />
                        ) : null}
                      </View>
                      <Text style={styles.name}>{item.promotion.name}</Text>
                      <Text style={styles.offer}>{getOfferLabel(item)}</Text>
                      <Text style={styles.condition}>
                        Đơn tối thiểu {formatCurrency(item.promotion.minOrderValue)} · Giảm ngay {formatCurrency(item.discountAmount)}
                      </Text>
                    </View>
                  </Pressable>
                );
              }}
              showsVerticalScrollIndicator={false}
            />
          )}
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: colors.overlay,
  },
  sheet: {
    maxHeight: '78%',
    minHeight: 360,
    paddingTop: spacing.sm,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    backgroundColor: colors.surface,
    ...shadows.floating,
  },
  handle: {
    width: 44,
    height: 4,
    alignSelf: 'center',
    borderRadius: radius.round,
    backgroundColor: colors.borderStrong,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.lg,
    padding: spacing.screen,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  title: { ...typography.titleSmall, color: colors.textPrimary },
  subtitle: { ...typography.bodySmall, color: colors.textSecondary, marginTop: spacing.xs },
  listContent: { flexGrow: 1, padding: spacing.screen, gap: spacing.md },
  voucher: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
  },
  selectedVoucher: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  pressed: { opacity: 0.72 },
  ticketIcon: {
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
  },
  voucherContent: { flex: 1 },
  codeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  code: { ...typography.bodySemibold, color: colors.primary },
  name: { ...typography.bodySmallSemibold, color: colors.textPrimary, marginTop: spacing.xs },
  offer: { ...typography.bodySmallSemibold, color: colors.success, marginTop: spacing.sm },
  condition: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs },
  state: { minHeight: 260, alignItems: 'center', justifyContent: 'center', padding: spacing.xxl },
  stateText: { ...typography.bodySmall, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.md },
  errorText: { ...typography.bodySmall, color: colors.danger, textAlign: 'center', marginTop: spacing.md },
  emptyTitle: { ...typography.bodySemibold, color: colors.textPrimary, marginTop: spacing.md },
  retryButton: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, marginTop: spacing.lg },
  retryText: { ...typography.bodySmallSemibold, color: colors.primary },
});
