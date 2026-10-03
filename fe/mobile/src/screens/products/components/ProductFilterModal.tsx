import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton, SecondaryButton, TextInputField } from '@/components';
import { colors, radius, spacing, typography } from '@/theme';
import type { Brand, Category } from '@/types';

export interface ProductFilterValues {
  brand?: number | string;
  category?: number | string;
  featured?: boolean;
  isNew?: boolean;
  maxPrice?: number;
  minPrice?: number;
}

interface ProductFilterModalProps {
  brands: Brand[];
  categories: Category[];
  defaultCategory?: number | string;
  initialValues: ProductFilterValues;
  visible: boolean;
  onApply: (values: ProductFilterValues) => void;
  onClose: () => void;
  onReset: () => void;
}

const onlyDigits = (value: string): string => value.replace(/[^0-9]/g, '');
const toOptionalNumber = (value: string): number | undefined => (
  value ? Number(value) : undefined
);

interface SelectChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

function SelectChip({ label, selected, onPress }: SelectChipProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        selected && styles.selectedChip,
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.chipText, selected && styles.selectedChipText]}>{label}</Text>
    </Pressable>
  );
}

export function ProductFilterModal({
  brands,
  categories,
  defaultCategory,
  initialValues,
  visible,
  onApply,
  onClose,
  onReset,
}: ProductFilterModalProps) {
  const [values, setValues] = useState<ProductFilterValues>(initialValues);
  const [minPrice, setMinPrice] = useState(initialValues.minPrice?.toString() ?? '');
  const [maxPrice, setMaxPrice] = useState(initialValues.maxPrice?.toString() ?? '');
  const [priceError, setPriceError] = useState<string | undefined>();

  useEffect(() => {
    if (!visible) return;
    setValues(initialValues);
    setMinPrice(initialValues.minPrice?.toString() ?? '');
    setMaxPrice(initialValues.maxPrice?.toString() ?? '');
    setPriceError(undefined);
  }, [initialValues, visible]);

  const handleApply = () => {
    const parsedMinPrice = toOptionalNumber(minPrice);
    const parsedMaxPrice = toOptionalNumber(maxPrice);
    if (
      parsedMinPrice !== undefined
      && parsedMaxPrice !== undefined
      && parsedMinPrice > parsedMaxPrice
    ) {
      setPriceError('Giá tối thiểu không được lớn hơn giá tối đa.');
      return;
    }

    onApply({
      ...values,
      minPrice: parsedMinPrice,
      maxPrice: parsedMaxPrice,
    });
  };

  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="pageSheet"
      visible={visible}
    >
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardView}
        >
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Bộ lọc sản phẩm</Text>
              <Text style={styles.subtitle}>Chọn điều kiện phù hợp với bạn</Text>
            </View>
            <Pressable
              accessibilityLabel="Đóng bộ lọc"
              accessibilityRole="button"
              hitSlop={8}
              onPress={onClose}
              style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
            >
              <Ionicons color={colors.textPrimary} name="close" size={26} />
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.sectionTitle}>Danh mục</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.chipRow}>
                <SelectChip
                  label="Tất cả"
                  onPress={() => setValues((current) => ({
                    ...current,
                    category: defaultCategory,
                  }))}
                  selected={String(values.category) === String(defaultCategory)}
                />
                {categories.map((category) => (
                  <SelectChip
                    key={category.id}
                    label={category.name}
                    onPress={() => setValues((current) => ({
                      ...current,
                      category: category.slug,
                    }))}
                    selected={String(values.category) === category.slug}
                  />
                ))}
              </View>
            </ScrollView>

            <Text style={styles.sectionTitle}>Thương hiệu</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.chipRow}>
                <SelectChip
                  label="Tất cả"
                  onPress={() => setValues((current) => ({ ...current, brand: undefined }))}
                  selected={values.brand === undefined}
                />
                {brands.map((brand) => (
                  <SelectChip
                    key={brand.id}
                    label={brand.name}
                    onPress={() => setValues((current) => ({ ...current, brand: brand.slug }))}
                    selected={String(values.brand) === brand.slug}
                  />
                ))}
              </View>
            </ScrollView>

            <Text style={styles.sectionTitle}>Khoảng giá</Text>
            <View style={styles.priceRow}>
              <TextInputField
                containerStyle={styles.priceField}
                error={priceError}
                keyboardType="number-pad"
                label="Giá từ"
                maxLength={14}
                onChangeText={(value) => {
                  setMinPrice(onlyDigits(value));
                  setPriceError(undefined);
                }}
                placeholder="0"
                value={minPrice}
              />
              <TextInputField
                containerStyle={styles.priceField}
                keyboardType="number-pad"
                label="Đến"
                maxLength={14}
                onChangeText={(value) => {
                  setMaxPrice(onlyDigits(value));
                  setPriceError(undefined);
                }}
                placeholder="Không giới hạn"
                value={maxPrice}
              />
            </View>

            <Text style={styles.sectionTitle}>Loại sản phẩm</Text>
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: Boolean(values.featured) }}
              onPress={() => setValues((current) => ({
                ...current,
                featured: current.featured ? undefined : true,
              }))}
              style={({ pressed }) => [styles.checkRow, pressed && styles.pressed]}
            >
              <Ionicons
                color={values.featured ? colors.primary : colors.textMuted}
                name={values.featured ? 'checkbox' : 'square-outline'}
                size={24}
              />
              <Text style={styles.checkLabel}>Sản phẩm nổi bật</Text>
            </Pressable>
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: Boolean(values.isNew) }}
              onPress={() => setValues((current) => ({
                ...current,
                isNew: current.isNew ? undefined : true,
              }))}
              style={({ pressed }) => [styles.checkRow, pressed && styles.pressed]}
            >
              <Ionicons
                color={values.isNew ? colors.primary : colors.textMuted}
                name={values.isNew ? 'checkbox' : 'square-outline'}
                size={24}
              />
              <Text style={styles.checkLabel}>Sản phẩm mới</Text>
            </Pressable>
          </ScrollView>

          <View style={styles.footer}>
            <SecondaryButton
              onPress={() => {
                setValues({ category: defaultCategory });
                setMinPrice('');
                setMaxPrice('');
                setPriceError(undefined);
                onReset();
              }}
              style={styles.footerButton}
              title="Đặt lại"
            />
            <PrimaryButton onPress={handleApply} style={styles.footerButton} title="Áp dụng" />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  keyboardView: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screen,
    paddingVertical: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  title: { ...typography.title, color: colors.textPrimary },
  subtitle: { ...typography.bodySmall, color: colors.textSecondary, marginTop: spacing.xxs },
  closeButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.round,
    backgroundColor: colors.surfaceMuted,
  },
  content: { padding: spacing.screen, paddingBottom: spacing.xxxl },
  sectionTitle: {
    ...typography.bodySemibold,
    color: colors.textPrimary,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  chipRow: { flexDirection: 'row', gap: spacing.sm, paddingRight: spacing.screen },
  chip: {
    minHeight: 42,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.round,
    backgroundColor: colors.surface,
  },
  selectedChip: { borderColor: colors.primary, backgroundColor: colors.primary },
  chipText: { ...typography.bodySmallSemibold, color: colors.textSecondary },
  selectedChipText: { color: colors.textInverse },
  pressed: { opacity: 0.68 },
  priceRow: { flexDirection: 'row', gap: spacing.md },
  priceField: { flex: 1 },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 48,
  },
  checkLabel: { ...typography.body, color: colors.textPrimary },
  footer: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.screen,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
    backgroundColor: colors.surface,
  },
  footerButton: { flex: 1 },
});
