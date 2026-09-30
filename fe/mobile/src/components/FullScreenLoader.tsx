import { ActivityIndicator, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, spacing, typography } from '@/theme';
import { BrandLogo } from './BrandLogo';

export interface FullScreenLoaderProps {
  message?: string;
  showBrand?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function FullScreenLoader({
  message = 'Đang tải dữ liệu...',
  showBrand = false,
  style,
}: FullScreenLoaderProps) {
  return (
    <View
      accessibilityLabel={message}
      accessibilityRole="progressbar"
      style={[styles.container, style]}
    >
      {showBrand ? <BrandLogo /> : null}
      <ActivityIndicator
        color={colors.primary}
        size="large"
        style={showBrand ? styles.brandedIndicator : undefined}
      />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.screen,
    backgroundColor: colors.background,
  },
  brandedIndicator: { marginTop: spacing.xxl },
  message: { ...typography.body, color: colors.textSecondary, marginTop: spacing.md },
});
