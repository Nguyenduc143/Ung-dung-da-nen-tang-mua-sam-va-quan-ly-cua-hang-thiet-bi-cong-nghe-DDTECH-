import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '@/theme';

interface CheckoutOptionCardProps {
  description: string;
  label: string;
  onPress: () => void;
  selected: boolean;
  disabled?: boolean;
  meta?: string;
}

export function CheckoutOptionCard({
  description,
  label,
  onPress,
  selected,
  disabled = false,
  meta,
}: CheckoutOptionCardProps) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        selected && styles.selected,
        disabled && styles.disabled,
        pressed && styles.pressed,
      ]}
    >
      <Ionicons
        color={selected ? colors.primary : colors.textMuted}
        name={selected ? 'radio-button-on' : 'radio-button-off'}
        size={22}
      />
      <View style={styles.content}>
        <View style={styles.labelRow}>
          <Text style={styles.label}>{label}</Text>
          {meta ? <Text style={styles.meta}>{meta}</Text> : null}
        </View>
        <Text style={styles.description}>{description}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  selected: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  disabled: { opacity: 0.48, backgroundColor: colors.disabledBackground },
  pressed: { opacity: 0.72 },
  content: { flex: 1 },
  labelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  label: { ...typography.bodySmallSemibold, flex: 1, color: colors.textPrimary },
  meta: { ...typography.captionSemibold, color: colors.primary },
  description: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs },
});
