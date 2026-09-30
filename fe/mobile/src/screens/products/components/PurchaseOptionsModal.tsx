import { Ionicons } from '@expo/vector-icons';
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PriceDisplay, PrimaryButton, QuantityStepper } from '@/components';
import { colors, radius, shadows, spacing, typography } from '@/theme';
import type { Product, ProductVariant } from '@/types';
import { getVariantAvailability } from '@/utils';
import { VariantSelector } from './VariantSelector';

export type PurchaseOptionAction = 'cart' | 'buy';

interface PurchaseOptionsModalProps {
  action: PurchaseOptionAction | null;
  isSubmitting: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onQuantityChange: (quantity: number) => void;
  onSelectVariant: (variant: ProductVariant) => void;
  product: Product;
  quantity: number;
  selectedVariant: ProductVariant | null;
  variants: ProductVariant[];
}

const effectivePrice = (price: number, salePrice: number | null): number => (
  salePrice !== null && salePrice < price ? salePrice : price
);

const currencyFormatter = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 });
const formatCurrency = (value: number) => `${currencyFormatter.format(value)}đ`;

export function PurchaseOptionsModal({
  action,
  isSubmitting,
  onClose,
  onConfirm,
  onQuantityChange,
  onSelectVariant,
  product,
  quantity,
  selectedVariant,
  variants,
}: PurchaseOptionsModalProps) {
  const price = selectedVariant?.price ?? product.price;
  const salePrice = selectedVariant?.salePrice ?? product.salePrice;
  const currentPrice = effectivePrice(price, salePrice);
  const originalPrice = currentPrice < price ? price : null;
  const stock = product.hasVariants ? selectedVariant?.stock ?? 0 : product.stock;
  const availableVariants = variants.filter((variant) => (
    getVariantAvailability(variant).isPurchasable
  ));
  const variantPrices = availableVariants.map((variant) => (
    effectivePrice(variant.price, variant.salePrice)
  ));
  const minVariantPrice = variantPrices.length > 0 ? Math.min(...variantPrices) : product.price;
  const maxVariantPrice = variantPrices.length > 0 ? Math.max(...variantPrices) : product.price;
  const totalVariantStock = availableVariants.reduce((total, variant) => total + variant.stock, 0);
  const imageUrl = selectedVariant?.imageUrl ?? product.primaryImageUrl;
  const canConfirm = !isSubmitting
    && (!product.hasVariants || selectedVariant !== null)
    && stock > 0
    && quantity >= 1
    && quantity <= stock;

  return (
    <Modal
      animationType="slide"
      onRequestClose={() => !isSubmitting && onClose()}
      statusBarTranslucent
      transparent
      visible={action !== null}
    >
      <View style={styles.overlay}>
        <Pressable
          accessibilityLabel="Đóng bảng chọn phiên bản"
          disabled={isSubmitting}
          onPress={onClose}
          style={styles.backdrop}
        />
        <SafeAreaView edges={['bottom']} style={styles.sheet}>
          <View style={styles.handle} />
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.productRow}>
              <View style={styles.imageBox}>
                {imageUrl ? (
                  <Image resizeMode="contain" source={{ uri: imageUrl }} style={styles.image} />
                ) : (
                  <Ionicons color={colors.textMuted} name="image-outline" size={38} />
                )}
              </View>
              <View style={styles.productInfo}>
                {product.hasVariants && !selectedVariant ? (
                  <Text style={styles.priceRange}>
                    {minVariantPrice === maxVariantPrice
                      ? formatCurrency(minVariantPrice)
                      : `${formatCurrency(minVariantPrice)} – ${formatCurrency(maxVariantPrice)}`}
                  </Text>
                ) : (
                  <PriceDisplay
                    direction="row"
                    originalPrice={originalPrice}
                    price={currentPrice}
                    size="large"
                  />
                )}
                <Text style={styles.stock}>
                  {product.hasVariants && !selectedVariant
                    ? `Kho: ${totalVariantStock}`
                    : stock > 0 ? `Kho: ${stock}` : 'Hết hàng'}
                </Text>
              </View>
              <Pressable
                accessibilityLabel="Đóng"
                disabled={isSubmitting}
                hitSlop={8}
                onPress={onClose}
                style={({ pressed }) => pressed && styles.pressed}
              >
                <Ionicons color={colors.textSecondary} name="close" size={28} />
              </Pressable>
            </View>

            {product.hasVariants ? (
              <View style={styles.section}>
                <VariantSelector
                  onSelect={onSelectVariant}
                  selectedId={selectedVariant?.id ?? null}
                  variants={variants}
                />
                {!selectedVariant ? (
                  <Text style={styles.selectionHint}>Vui lòng chọn một phiên bản để tiếp tục.</Text>
                ) : null}
              </View>
            ) : null}

            <View style={[styles.section, styles.quantityRow]}>
              <View>
                <Text style={styles.sectionTitle}>Số lượng</Text>
                <Text style={styles.quantityHint}>
                  {stock > 0 ? `Tối đa ${stock} sản phẩm` : 'Chưa có hàng khả dụng'}
                </Text>
              </View>
              <QuantityStepper
                disabled={(!selectedVariant && product.hasVariants) || stock <= 0 || isSubmitting}
                max={Math.max(1, stock)}
                onChange={onQuantityChange}
                value={quantity}
              />
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <PrimaryButton
              disabled={!canConfirm}
              loading={isSubmitting}
              onPress={onConfirm}
              title={action === 'buy' ? 'Mua ngay' : 'Thêm vào giỏ hàng'}
            />
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: colors.overlay,
  },
  sheet: {
    maxHeight: '84%',
    minHeight: 390,
    paddingTop: spacing.sm,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    backgroundColor: colors.surface,
    ...shadows.floating,
  },
  handle: {
    width: 44,
    height: 4,
    alignSelf: 'center',
    borderRadius: radius.round,
    backgroundColor: colors.borderStrong,
  },
  scrollContent: { paddingBottom: spacing.lg },
  productRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    padding: spacing.screen,
  },
  imageBox: {
    width: 96,
    height: 96,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
  },
  image: { width: '94%', height: '94%' },
  productInfo: { flex: 1, alignSelf: 'center' },
  priceRange: { ...typography.titleSmall, color: colors.primary },
  stock: { ...typography.bodySmall, color: colors.textSecondary, marginTop: spacing.sm },
  section: {
    padding: spacing.screen,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  selectionHint: { ...typography.caption, color: colors.warning, marginTop: spacing.md },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  sectionTitle: { ...typography.titleSmall, color: colors.textPrimary },
  quantityHint: { ...typography.bodySmall, color: colors.textMuted, marginTop: spacing.xs },
  footer: {
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    backgroundColor: colors.surface,
  },
  pressed: { opacity: 0.65 },
});
