import { StyleSheet, Text, type StyleProp, type TextStyle } from 'react-native';

import { colors, typography } from '@/theme';

interface BrandLogoProps {
  compact?: boolean;
  style?: StyleProp<TextStyle>;
}

export function BrandLogo({ compact = false, style }: BrandLogoProps) {
  return (
    <Text accessibilityRole="header" style={[styles.logo, compact && styles.compact, style]}>
      <Text style={styles.accent}>DD</Text>TECH
    </Text>
  );
}

const styles = StyleSheet.create({
  logo: {
    ...typography.display,
    color: colors.textPrimary,
    fontStyle: 'italic',
    letterSpacing: -1.5,
  },
  compact: { fontSize: 30, lineHeight: 38 },
  accent: { color: colors.primary },
});
