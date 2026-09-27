import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radius, spacing, typography } from '@/theme';

export type StatusBadgeTone = 'neutral' | 'info' | 'warning' | 'success' | 'danger' | 'purple';

export interface StatusBadgeProps {
  label: string;
  tone?: StatusBadgeTone;
  style?: StyleProp<ViewStyle>;
}

const toneStyles: Record<StatusBadgeTone, { backgroundColor: string; color: string }> = {
  neutral: { backgroundColor: colors.surfaceMuted, color: colors.textSecondary },
  info: { backgroundColor: colors.infoSoft, color: colors.info },
  warning: { backgroundColor: colors.warningSoft, color: colors.warning },
  success: { backgroundColor: colors.successSoft, color: colors.success },
  danger: { backgroundColor: colors.dangerSoft, color: colors.danger },
  purple: { backgroundColor: colors.purpleSoft, color: colors.purple },
};

export function StatusBadge({ label, tone = 'neutral', style }: StatusBadgeProps) {
  const palette = toneStyles[tone];
  return (
    <View style={[styles.container, { backgroundColor: palette.backgroundColor }, style]}>
      <Text style={[styles.label, { color: palette.color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.round,
  },
  label: { ...typography.captionSemibold },
});
