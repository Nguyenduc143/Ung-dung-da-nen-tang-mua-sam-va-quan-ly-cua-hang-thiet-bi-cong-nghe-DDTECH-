import { Ionicons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { PriceDisplay, QuantityStepper } from '@/components';
import { colors, radius, shadows, spacing, typography } from '@/theme';
import type { CartItem } from '@/types';

interface CartItemCardProps {
  item: CartItem;
  isSelected: boolean;
  isUpdating: boolean;
  onOpen: () => void;
  onToggleSelection: () => void;
  onQuantityChange: (quantity: number) => void;
  onRemove: () => void;
}

export function CartItemCard({
  item,
  isSelected,
  isUpdating,
  onOpen,
  onToggleSelection,
  onQuantityChange,
  onRemove,
}: CartItemCardProps) {
  const hasDiscount = item.currentPrice < (item.variant?.price ?? item.product.price);
  const originalPrice = hasDiscount ? item.variant?.price ?? item.product.price : null;
  const canChangeQuantity = item.isAvailable && item.availableStock > 0;
  const availabilityMessage = !item.isAvailable
    ? 'Sản phẩm hoặc phiên bản không còn khả dụng.'
    : !item.hasSufficientStock
      ? `Số lượng vượt tồn kho. Hiện chỉ còn ${item.availableStock} sản phẩm.`
      : null;

  return (
    <View style={styles.card}>
      <View style={styles.productRow}>
        <Pressable
          accessibilityLabel={isSelected ? 'Bỏ chọn sản phẩm' : 'Chọn sản phẩm để thanh toán'}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: isSelected }}
          hitSlop={8}
          onPress={onToggleSelection}
          style={({ pressed }) => [styles.checkbox, pressed && styles.pressed]}
        >
          <Ionicons
            color={isSelected ? colors.primary : colors.textMuted}
            name={isSelected ? 'checkbox' : 'square-outline'}
            size={25}
          />
        </Pressable>
        <Pressable
          accessibilityLabel={`Mở chi tiết ${item.product.name}`}
          accessibilityRole="button"
          onPress={onOpen}
          style={({ pressed }) => [styles.productLink, pressed && styles.pressed]}
        >
          <View style={styles.imageContainer}>
            {item.imageUrl ? (
              <Image resizeMode="contain" source={{ uri: item.imageUrl }} style={styles.image} />
            ) : (
              <Ionicons color={colors.textMuted} name="image-outline" size={44} />
            )}
          </View>
          <View style={styles.details}>
            <Text numberOfLines={2} style={styles.name}>{item.product.name}</Text>
            {item.variant ? (
              <Text numberOfLines={1} style={styles.variant}>{item.variant.variantName}</Text>
            ) : null}
            <PriceDisplay
              direction="row"
              originalPrice={originalPrice}
              price={item.currentPrice}
            />
            <Text style={styles.stock}>Kho: {item.availableStock}</Text>
          </View>
        </Pressable>
      </View>

      {availabilityMessage ? (
        <View accessibilityRole="alert" style={styles.warning}>
          <Ionicons color={colors.danger} name="alert-circle-outline" size={18} />
          <Text style={styles.warningText}>{availabilityMessage}</Text>
        </View>
      ) : null}

      <View style={styles.actions}>
        <View style={styles.quantityArea}>
          <QuantityStepper
            disabled={!canChangeQuantity || isUpdating}
            max={Math.max(1, item.availableStock)}
            onChange={onQuantityChange}
            value={item.quantity}
          />
          {isUpdating ? <ActivityIndicator color={colors.primary} size="small" /> : null}
        </View>
        <Pressable
          accessibilityLabel={`Xóa ${item.product.name} khỏi giỏ`}
          accessibilityRole="button"
          accessibilityState={{ disabled: isUpdating }}
          disabled={isUpdating}
          onPress={onRemove}
          style={({ pressed }) => [styles.removeButton, pressed && styles.pressed]}
        >
          <Ionicons color={colors.primary} name="trash-outline" size={22} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    ...shadows.card,
  },
  productRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  checkbox: { paddingTop: spacing.huge },
  productLink: { flex: 1, flexDirection: 'row', gap: spacing.md },
  imageContainer: {
    width: 112,
    height: 112,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
  },
  image: { width: '90%', height: '90%' },
  details: { flex: 1, gap: spacing.xs },
  name: { ...typography.bodySemibold, color: colors.textPrimary },
  variant: { ...typography.bodySmall, color: colors.textSecondary },
  stock: { ...typography.caption, color: colors.textMuted },
  warning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    marginTop: spacing.md,
    borderRadius: radius.sm,
    backgroundColor: colors.dangerSoft,
  },
  warningText: { ...typography.caption, flex: 1, color: colors.danger },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.md,
    marginTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  quantityArea: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  removeButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
  },
  pressed: { opacity: 0.68 },
});
