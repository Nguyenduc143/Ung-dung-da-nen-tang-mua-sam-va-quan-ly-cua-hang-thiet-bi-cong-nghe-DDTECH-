import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '@/theme';

interface AuthSwitchLinkProps {
  disabled?: boolean;
  label: string;
  linkLabel: string;
  onPress: () => void;
}

export function AuthSwitchLink({
  disabled = false,
  label,
  linkLabel,
  onPress,
}: AuthSwitchLinkProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        disabled={disabled}
        hitSlop={8}
        onPress={onPress}
        style={({ pressed }) => [pressed && styles.pressed, disabled && styles.disabled]}
      >
        <Text style={styles.link}>{linkLabel}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.xl,
  },
  label: { ...typography.bodySmall, color: colors.textSecondary },
  link: { ...typography.bodySmallSemibold, color: colors.primary },
  pressed: { opacity: 0.65 },
  disabled: { opacity: 0.5 },
});
