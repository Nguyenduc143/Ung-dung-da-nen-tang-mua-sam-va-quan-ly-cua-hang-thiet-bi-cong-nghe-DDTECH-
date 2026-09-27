import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { colors, radius, spacing, typography } from '@/theme';

export interface AppButtonProps {
  title: string;
  onPress: () => void;
  accessibilityLabel?: string;
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: ReactNode;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

interface ButtonBaseProps extends AppButtonProps {
  variant: 'primary' | 'secondary';
}

export function ButtonBase({
  title,
  onPress,
  accessibilityLabel,
  disabled = false,
  fullWidth = true,
  icon,
  loading = false,
  style,
  testID,
  variant,
}: ButtonBaseProps) {
  const isDisabled = disabled || loading;
  const isPrimary = variant === 'primary';

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        fullWidth && styles.fullWidth,
        isPrimary ? styles.primary : styles.secondary,
        pressed && !isDisabled && (isPrimary ? styles.primaryPressed : styles.secondaryPressed),
        isDisabled && styles.disabled,
        style,
      ]}
      testID={testID}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? colors.textInverse : colors.primary} />
      ) : (
        <>
          {icon}
          <Text style={[styles.label, isPrimary ? styles.primaryLabel : styles.secondaryLabel]}>
            {title}
          </Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  fullWidth: { alignSelf: 'stretch' },
  primary: { backgroundColor: colors.primary, borderColor: colors.primary },
  primaryPressed: { backgroundColor: colors.primaryPressed, borderColor: colors.primaryPressed },
  secondary: { backgroundColor: colors.surface, borderColor: colors.primary },
  secondaryPressed: { backgroundColor: colors.primarySoft },
  disabled: {
    backgroundColor: colors.disabledBackground,
    borderColor: colors.disabled,
    opacity: 0.72,
  },
  label: { ...typography.bodySemibold },
  primaryLabel: { color: colors.textInverse },
  secondaryLabel: { color: colors.primary },
});
