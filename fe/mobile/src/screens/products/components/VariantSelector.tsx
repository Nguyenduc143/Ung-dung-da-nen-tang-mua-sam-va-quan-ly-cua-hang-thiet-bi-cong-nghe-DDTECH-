import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '@/theme';
import type { ProductVariant } from '@/types';
import { getVariantAvailability } from '@/utils';
import { getVariantOption } from '@/utils/variantOptions';

interface VariantSelectorProps {
  variants: ProductVariant[];
  selectedId: number | null;
  onSelect: (variant: ProductVariant) => void;
}

export function VariantSelector({ variants, selectedId, onSelect }: VariantSelectorProps) {
  if (variants.length === 0) return null;

  const options = variants.map(getVariantOption);
  const selectedOption = options.find((option) => option.variant.id === selectedId);
  const colorsAvailable = [...new Set(options.map((option) => option.color).filter((value): value is string => value !== null))];
  const configurations = [...new Set(options.map((option) => option.configuration).filter((value): value is string => value !== null))];

  const renderGroup = (dimension: 'color' | 'configuration', title: string, values: string[]) => {
    if (!values.length) return null;
    const other = dimension === 'color' ? 'configuration' : 'color';
    return (
      <View style={styles.group}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.options}>
          {values.map((value) => {
            const candidates = options.filter((option) => option[dimension] === value);
            const compatible = candidates.filter((option) => (
              !selectedOption?.[other] || option[other] === selectedOption[other]
            ));
            // Changing color can move to another existing configuration if needed.
            // Configuration buttons stay restricted to the currently selected color.
            const matching = dimension === 'color'
              && !compatible.some((option) => getVariantAvailability(option.variant).isPurchasable)
              ? candidates : compatible;
            const target = matching.find((option) => getVariantAvailability(option.variant).isPurchasable);
            const unavailable = !target;
            const selected = selectedOption?.[dimension] === value;
            const stock = matching.reduce((total, option) => total
              + (getVariantAvailability(option.variant).isPurchasable ? option.variant.stock : 0), 0);
            return (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${title}: ${value}`}
                accessibilityState={{ disabled: unavailable, selected }}
                disabled={unavailable}
                key={value}
                onPress={() => { if (target) onSelect(target.variant); }}
                style={({ pressed }) => [styles.option, selected && styles.selectedOption,
                  unavailable && styles.unavailableOption, pressed && !unavailable && styles.pressed]}
              >
                {dimension === 'color' && (target ?? matching[0])?.variant.imageUrl ? (
                  <Image resizeMode="contain" source={{ uri: (target ?? matching[0]).variant.imageUrl! }} style={styles.image} />
                ) : null}
                <View style={styles.optionContent}>
                  <Text style={[styles.optionName, selected && styles.selectedText]}>{value}</Text>
                  <Text style={[styles.stockText, selected && styles.selectedText]}>
                    {unavailable ? 'Không khả dụng với lựa chọn hiện tại' : `Còn ${stock} sản phẩm`}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>
    );
  };

  if (colorsAvailable.length > 0) {
    return (
      <View>
        {renderGroup('color', 'Chọn màu sắc', colorsAvailable)}
        {renderGroup('configuration', 'Chọn cấu hình', configurations)}
      </View>
    );
  }

  return (
    <View>
      <Text style={styles.title}>Chọn cấu hình</Text>
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
  group: { marginBottom: spacing.md },
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
