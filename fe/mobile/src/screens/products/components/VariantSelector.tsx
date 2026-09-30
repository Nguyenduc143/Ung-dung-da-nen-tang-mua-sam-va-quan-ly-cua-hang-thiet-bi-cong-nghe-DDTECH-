import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '@/theme';
import type { ProductVariant } from '@/types';
import { getVariantAvailability } from '@/utils';

interface VariantSelectorProps {
  variants: ProductVariant[];
  selectedId: number | null;
  onSelect: (variant: ProductVariant) => void;
}

export function VariantSelector({ variants, selectedId, onSelect }: VariantSelectorProps) {
  if (variants.length === 0) return null;

  return (
    <View>
      <Text style={styles.title}>Chọn phiên bản</Text>
      <View style={styles.options}>
        {variants.map((variant) => {
          const selected = variant.id === selectedId;
          const availability = getVariantAvailability(variant);
          const unavailable = !availability.isPurchasable;
          return (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: unavailable, selected }}
              disabled={unavailable}
              key={variant.id}
              onPress={() => onSelect(variant)}
              style={({ pressed }) => [
                styles.option,
                selected && styles.selectedOption,
                unavailable && styles.unavailableOption,
                pressed && !unavailable && styles.pressed,
              ]}
            >
              {variant.imageUrl ? (
                <Image resizeMode="contain" source={{ uri: variant.imageUrl }} style={styles.image} />
              ) : null}
              <View style={styles.optionContent}>
                <Text style={[styles.optionName, selected && styles.selectedText]}>
                  {variant.variantName}
                </Text>
                <Text style={[styles.stockText, selected && styles.selectedText]}>
                  {availability.label}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.bodySemibold, color: colors.textPrimary, marginBottom: spacing.md },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  option: {
    minWidth: '47%',
    flexGrow: 1,
    flexBasis: 150,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  image: { width: 42, height: 42, borderRadius: radius.sm },
  optionContent: { flex: 1 },
  selectedOption: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  unavailableOption: { backgroundColor: colors.disabledBackground, opacity: 0.65 },
  optionName: { ...typography.bodySmallSemibold, color: colors.textPrimary },
  stockText: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xxs },
  selectedText: { color: colors.primary },
  pressed: { opacity: 0.7 },
});
