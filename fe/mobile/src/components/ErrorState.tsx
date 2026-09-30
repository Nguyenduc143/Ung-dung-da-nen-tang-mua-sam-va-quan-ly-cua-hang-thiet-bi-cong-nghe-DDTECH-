import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radius, spacing, typography } from '@/theme';
import { PrimaryButton } from './PrimaryButton';
import type { IoniconName } from './iconTypes';

export type ErrorStateVariant = 'generic' | 'network' | 'server' | 'auth';

export interface ErrorStateProps {
  variant?: ErrorStateVariant;
  title?: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
  style?: StyleProp<ViewStyle>;
}

const variants: Record<ErrorStateVariant, { title: string; description: string; icon: IoniconName }> = {
  generic: {
    title: 'Đã có lỗi xảy ra',
    description: 'Không thể tải dữ liệu. Vui lòng thử lại.',
    icon: 'alert-circle-outline',
  },
  network: {
    title: 'Không có kết nối mạng',
    description: 'Hãy kiểm tra Wi-Fi hoặc dữ liệu di động rồi thử lại.',
    icon: 'cloud-offline-outline',
  },
  server: {
    title: 'Máy chủ đang gặp sự cố',
    description: 'Dịch vụ tạm thời chưa sẵn sàng. Vui lòng thử lại sau.',
    icon: 'server-outline',
  },
  auth: {
    title: 'Phiên đăng nhập đã hết hạn',
    description: 'Vui lòng đăng nhập lại để tiếp tục.',
    icon: 'lock-closed-outline',
  },
};

export function ErrorState({
  variant = 'generic',
  title,
  description,
  onRetry,
  retryLabel = 'Thử lại',
  style,
}: ErrorStateProps) {
  const presentation = variants[variant];
  return (
    <View accessibilityRole="alert" style={[styles.container, style]}>
      <View style={styles.iconContainer}>
        <Ionicons color={colors.danger} name={presentation.icon} size={42} />
      </View>
      <Text style={styles.title}>{title ?? presentation.title}</Text>
      <Text style={styles.description}>{description ?? presentation.description}</Text>
      {onRetry ? (
        <PrimaryButton fullWidth={false} onPress={onRetry} style={styles.action} title={retryLabel} />
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
    backgroundColor: colors.dangerSoft,
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
  action: { marginTop: spacing.xl, minWidth: 128 },
});
