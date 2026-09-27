import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '@/theme';

export interface ActiveFilterChip {
  key: string;
  label: string;
  onRemove: () => void;
}

interface ActiveFilterChipsProps {
  chips: ActiveFilterChip[];
  onReset: () => void;
}

export function ActiveFilterChips({ chips, onReset }: ActiveFilterChipsProps) {
  if (chips.length === 0) return null;

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        horizontal
        showsHorizontalScrollIndicator={false}
      >
        {chips.map((chip) => (
          <Pressable
            accessibilityLabel={`Bỏ bộ lọc ${chip.label}`}
            accessibilityRole="button"
            key={chip.key}
            onPress={chip.onRemove}
            style={({ pressed }) => [styles.chip, pressed && styles.pressed]}
          >
            <Text numberOfLines={1} style={styles.label}>{chip.label}</Text>
            <Ionicons color={colors.primary} name="close" size={16} />
          </Pressable>
        ))}
        <Pressable
          accessibilityRole="button"
          onPress={onReset}
          style={({ pressed }) => [styles.resetButton, pressed && styles.pressed]}
        >
          <Text style={styles.resetText}>Xóa tất cả</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginHorizontal: -spacing.screen },
  content: { gap: spacing.sm, paddingHorizontal: spacing.screen, paddingTop: spacing.md },
  chip: {
    maxWidth: 210,
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    borderRadius: radius.round,
    backgroundColor: colors.primarySoft,
  },
  label: { ...typography.captionSemibold, flexShrink: 1, color: colors.primary },
  resetButton: { minHeight: 36, justifyContent: 'center', paddingHorizontal: spacing.sm },
  resetText: { ...typography.captionSemibold, color: colors.danger },
  pressed: { opacity: 0.65 },
});
