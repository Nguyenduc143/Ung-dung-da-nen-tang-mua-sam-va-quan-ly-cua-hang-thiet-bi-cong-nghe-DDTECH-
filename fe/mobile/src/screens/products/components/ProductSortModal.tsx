import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, radius, shadows, spacing, typography } from '@/theme';
import type { ProductSort } from '@/types';

export const productSortOptions: Array<{ label: string; value: ProductSort }> = [
  { label: 'Mới nhất', value: 'newest' },
  { label: 'Bán chạy', value: 'best_selling' },
  { label: 'Đánh giá cao', value: 'rating' },
  { label: 'Giá thấp đến cao', value: 'price_asc' },
  { label: 'Giá cao đến thấp', value: 'price_desc' },
];

interface ProductSortModalProps {
  selected: ProductSort;
  visible: boolean;
  onClose: () => void;
  onSelect: (sort: ProductSort) => void;
}

export function ProductSortModal({
  selected,
  visible,
  onClose,
  onSelect,
}: ProductSortModalProps) {
  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible={visible}>
      <Pressable accessibilityLabel="Đóng chọn sắp xếp" onPress={onClose} style={styles.backdrop}>
        <SafeAreaView edges={['bottom']} style={styles.safeArea}>
          <Pressable onPress={(event) => event.stopPropagation()} style={styles.sheet}>
            <View style={styles.handle} />
            <Text style={styles.title}>Sắp xếp sản phẩm</Text>
            {productSortOptions.map((option) => {
              const isSelected = option.value === selected;
              return (
                <Pressable
                  accessibilityRole="radio"
                  accessibilityState={{ checked: isSelected }}
                  key={option.value}
                  onPress={() => onSelect(option.value)}
                  style={({ pressed }) => [styles.option, pressed && styles.pressed]}
                >
                  <Text style={[styles.optionText, isSelected && styles.selectedText]}>
                    {option.label}
                  </Text>
                  {isSelected ? <Ionicons color={colors.primary} name="checkmark" size={24} /> : null}
                </Pressable>
              );
            })}
          </Pressable>
        </SafeAreaView>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: colors.overlay },
  safeArea: { backgroundColor: colors.surface, borderTopLeftRadius: radius.xxl, borderTopRightRadius: radius.xxl },
  sheet: {
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    backgroundColor: colors.surface,
    ...shadows.floating,
  },
  handle: {
    width: 44,
    height: 5,
    alignSelf: 'center',
    borderRadius: radius.round,
    backgroundColor: colors.borderStrong,
    marginBottom: spacing.lg,
  },
  title: { ...typography.titleSmall, color: colors.textPrimary, marginBottom: spacing.md },
  option: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  optionText: { ...typography.body, color: colors.textPrimary },
  selectedText: { color: colors.primary, fontWeight: '600' },
  pressed: { opacity: 0.65 },
});
