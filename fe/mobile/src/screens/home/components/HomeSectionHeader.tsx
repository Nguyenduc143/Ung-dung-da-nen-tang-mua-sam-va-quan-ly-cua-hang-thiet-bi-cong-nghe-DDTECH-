import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '@/theme';

interface HomeSectionHeaderProps {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function HomeSectionHeader({
  title,
  actionLabel = 'Xem thêm',
  onAction,
}: HomeSectionHeaderProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {onAction ? (
        <Pressable
          accessibilityRole="button"
          hitSlop={8}
          onPress={onAction}
          style={({ pressed }) => pressed && styles.pressed}
        >
          <Text style={styles.action}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screen,
    marginBottom: spacing.lg,
  },
  title: { ...typography.titleSmall, color: colors.textPrimary },
  action: { ...typography.bodySmallSemibold, color: colors.primary },
  pressed: { opacity: 0.62 },
});
