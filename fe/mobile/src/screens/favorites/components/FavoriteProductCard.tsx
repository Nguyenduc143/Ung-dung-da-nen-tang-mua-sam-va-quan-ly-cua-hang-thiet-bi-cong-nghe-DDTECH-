import { Ionicons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { PriceDisplay, PrimaryButton, RatingStars, SecondaryButton } from '@/components';
import { colors, radius, shadows, spacing, typography } from '@/theme';
import type { FavoriteProduct } from '@/types';

interface FavoriteProductCardProps {
  product: FavoriteProduct;
  isAddingToCart: boolean;
  isCartBusy: boolean;
  isRemoving: boolean;
  onAddToCart: () => void;
  onOpen: () => void;
  onRemove: () => void;
}

const currentPrice = (product: FavoriteProduct): number => (
  product.salePrice !== null && product.salePrice < product.price
    ? product.salePrice
    : product.price
);

export function FavoriteProductCard({
  product,
  isAddingToCart,
  isCartBusy,
  isRemoving,
  onAddToCart,
  onOpen,
  onRemove,
}: FavoriteProductCardProps) {
  const price = currentPrice(product);
  const hasDiscount = price < product.price;
  const isOutOfStock = product.stock <= 0;
  const actionTitle = product.hasVariants
    ? 'Chọn phiên bản'
    : isOutOfStock ? 'Hết hàng' : 'Thêm vào giỏ';
  const ActionButton = product.hasVariants ? SecondaryButton : PrimaryButton;

  return (
    <View style={styles.card}>
      <Pressable
        accessibilityLabel={`Mở chi tiết ${product.name}`}
        accessibilityRole="button"
        onPress={onOpen}
        style={({ pressed }) => [styles.productContent, pressed && styles.pressed]}
      >
        <View style={styles.imageContainer}>
          {product.imageUrl ? (
            <Image resizeMode="contain" source={{ uri: product.imageUrl }} style={styles.image} />
          ) : (
            <Ionicons color={colors.textMuted} name="image-outline" size={46} />
          )}
        </View>

        <View style={styles.details}>
          <Text style={styles.category}>{product.category.name}</Text>
          <Text numberOfLines={2} style={styles.name}>{product.name}</Text>
          <RatingStars count={product.reviewCount} rating={product.ratingAvg} size={14} />
          <PriceDisplay
            direction="row"
            originalPrice={hasDiscount ? product.price : null}
            price={price}
          />
          <Text style={[styles.stock, isOutOfStock && styles.outOfStock]}>
            {isOutOfStock ? 'Hết hàng' : product.hasVariants ? 'Có nhiều phiên bản' : `Còn ${product.stock} sản phẩm`}
          </Text>
        </View>
      </Pressable>

      <View style={styles.footer}>
        <Pressable
          accessibilityLabel={`Xóa ${product.name} khỏi yêu thích`}
          accessibilityRole="button"
          accessibilityState={{ busy: isRemoving, disabled: isRemoving }}
          disabled={isRemoving}
          onPress={onRemove}
          style={({ pressed }) => [styles.removeButton, pressed && styles.pressed]}
        >
          {isRemoving ? (
            <ActivityIndicator color={colors.primary} size="small" />
          ) : (
            <Ionicons color={colors.primary} name="heart" size={22} />
          )}
          <Text style={styles.removeText}>Bỏ yêu thích</Text>
        </Pressable>
        <ActionButton
          disabled={isOutOfStock || isRemoving || isCartBusy}
          fullWidth={false}
          loading={isAddingToCart}
          onPress={onAddToCart}
          style={styles.cartButton}
          title={actionTitle}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    ...shadows.card,
  },
  productContent: { flexDirection: 'row', gap: spacing.lg, padding: spacing.lg },
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
  category: { ...typography.captionSemibold, color: colors.primary },
  name: { ...typography.bodySemibold, color: colors.textPrimary },
  stock: { ...typography.caption, color: colors.success },
  outOfStock: { color: colors.danger },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  removeButton: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  removeText: { ...typography.captionSemibold, color: colors.primary },
  cartButton: { minHeight: 48, flex: 1, paddingHorizontal: spacing.md },
  pressed: { opacity: 0.68 },
});
