import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radius, spacing, typography } from '@/theme';
import type { IoniconName } from './iconTypes';
import { PrimaryButton } from './PrimaryButton';

export interface EmptyStateProps {
  preset?: EmptyStatePreset;
  title?: string;
  description?: string;
  actionLabel?: string;
  icon?: IoniconName;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
}

export type EmptyStatePreset = 'cart' | 'favorites' | 'orders' | 'notifications' | 'products';

const presets: Record<EmptyStatePreset, { title: string; description: string; icon: IoniconName }> = {
  cart: {
    title: 'Giỏ hàng đang trống',
    description: 'Hãy thêm sản phẩm bạn yêu thích để bắt đầu mua sắm.',
    icon: 'cart-outline',
  },
  favorites: {
    title: 'Chưa có sản phẩm yêu thích',
    description: 'Nhấn biểu tượng trái tim ở sản phẩm bạn quan tâm để lưu lại tại đây.',
    icon: 'heart-outline',
  },
  orders: {
    title: 'Bạn chưa có đơn hàng',
    description: 'Các đơn hàng bạn đã đặt sẽ xuất hiện tại đây.',
    icon: 'receipt-outline',
  },
  notifications: {
    title: 'Chưa có thông báo',
    description: 'Thông báo mới sẽ xuất hiện tại đây.',
    icon: 'notifications-off-outline',
  },
  products: {
    title: 'Không tìm thấy sản phẩm',
    description: 'Hãy thử thay đổi từ khóa hoặc bộ lọc tìm kiếm.',
    icon: 'search-outline',
  },
};

export function EmptyState({
  preset,
  title,
  description,
  actionLabel,
  icon,
  onAction,
  style,
}: EmptyStateProps) {
  const presentation = preset ? presets[preset] : undefined;
  const resolvedTitle = title ?? presentation?.title ?? 'Chưa có dữ liệu';
  const resolvedDescription = description ?? presentation?.description;
  const resolvedIcon = icon ?? presentation?.icon ?? 'cube-outline';

  return (
    <View style={[styles.container, style]}>
      <View style={styles.iconContainer}>
        <Ionicons color={colors.primary} name={resolvedIcon} size={42} />
      </View>
      <Text style={styles.title}>{resolvedTitle}</Text>
      {resolvedDescription ? <Text style={styles.description}>{resolvedDescription}</Text> : null}
      {actionLabel && onAction ? (
        <PrimaryButton fullWidth={false} onPress={onAction} style={styles.action} title={actionLabel} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', padding: spacing.xxl },
  iconContainer: {
    width: 88,
    height: 88,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.round,
    backgroundColor: colors.primarySoft,
    marginBottom: spacing.lg,
  },
  title: { ...typography.titleSmall, color: colors.textPrimary, textAlign: 'center' },
  description: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    maxWidth: 320,
  },
  action: { marginTop: spacing.xl, minWidth: 150 },
});
