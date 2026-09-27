import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radius, spacing, typography } from '@/theme';

export interface QuantityStepperProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  max?: number;
  min?: number;
  style?: StyleProp<ViewStyle>;
}

export function QuantityStepper({
  value,
  onChange,
  disabled = false,
  max = Number.MAX_SAFE_INTEGER,
  min = 1,
  style,
}: QuantityStepperProps) {
  const canDecrease = !disabled && value > min;
  const canIncrease = !disabled && value < max;

  const renderButton = (type: 'decrease' | 'increase') => {
    const isIncrease = type === 'increase';
    const enabled = isIncrease ? canIncrease : canDecrease;
    const nextValue = isIncrease ? value + 1 : value - 1;
    return (
      <Pressable
        accessibilityLabel={isIncrease ? 'Tăng số lượng' : 'Giảm số lượng'}
        accessibilityRole="button"
        accessibilityState={{ disabled: !enabled }}
        disabled={!enabled}
        onPress={() => onChange(nextValue)}
        style={({ pressed }) => [styles.button, pressed && enabled && styles.pressed]}
      >
        <Ionicons
          color={enabled ? colors.primary : colors.disabled}
          name={isIncrease ? 'add' : 'remove'}
          size={22}
        />
      </Pressable>
    );
  };

  return (
    <View style={[styles.container, style]}>
      {renderButton('decrease')}
      <Text accessibilityLabel={`Số lượng ${value}`} style={styles.value}>{value}</Text>
      {renderButton('increase')}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minWidth: 132,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  button: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
  value: { ...typography.bodySemibold, color: colors.textPrimary, minWidth: 32, textAlign: 'center' },
  pressed: { backgroundColor: colors.primarySoft, borderRadius: radius.sm },
});
