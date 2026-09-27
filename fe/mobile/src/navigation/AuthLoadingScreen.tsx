import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { BrandLogo } from '@/components';
import { colors, spacing, typography } from '@/theme';

export function AuthLoadingScreen() {
  return (
    <View accessibilityLabel="Đang khôi phục phiên đăng nhập" style={styles.container}>
      <BrandLogo />
      <ActivityIndicator color={colors.primary} size="large" style={styles.indicator} />
      <Text style={styles.message}>Đang chuẩn bị ứng dụng...</Text>
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
  indicator: { marginTop: spacing.xxl },
  message: { ...typography.body, color: colors.textSecondary, marginTop: spacing.md },
});
