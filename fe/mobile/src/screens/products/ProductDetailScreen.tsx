import { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getApiErrorMessage } from '@/api/axiosClient';
import { ErrorState, PriceDisplay, PrimaryButton, RatingStars, SecondaryButton } from '@/components';
import { useProductDetail } from '@/hooks';
import type { CustomerStackParamList } from '@/navigation/types';
import { useCartStore, useFavoriteStore } from '@/stores';
import { colors, radius, shadows, spacing, typography } from '@/theme';
import type { ProductVariant } from '@/types';
import { getProductAvailability } from '@/utils';
import { ProductDetailSkeleton } from './components/ProductDetailSkeleton';
import { ProductGallery, type GalleryImage } from './components/ProductGallery';
import { PurchaseOptionsModal, type PurchaseOptionAction } from './components/PurchaseOptionsModal';
import { ReviewPreview } from './components/ReviewPreview';
import { SpecificationList } from './components/SpecificationList';

type Props = NativeStackScreenProps<CustomerStackParamList, 'ProductDetail'>;
type PurchaseAction = 'cart' | 'buy' | null;

const effectivePrice = (price: number, salePrice: number | null): number => (
  salePrice !== null && salePrice < price ? salePrice : price
);

const discountPercent = (price: number, salePrice: number | null): number => {
  if (salePrice === null || price <= 0 || salePrice >= price) return 0;
  return Math.round(((price - salePrice) / price) * 100);
};

export function ProductDetailScreen({ navigation, route }: Props) {
  const productId = route.params.productId;
  const {
    detail,
    reviews,
    error,
    isLoading,
    isRefreshing,
    reload,
    refresh,
  } = useProductDetail(productId);
  const addCartItem = useCartStore((state) => state.addItem);
  const isFavorite = useFavoriteStore((state) => (
    state.favorites.some((item) => item.product.id === productId)
  ));
  const isUpdatingFavorite = useFavoriteStore((state) => (
    state.updatingProductIds.has(productId)
  ));
  const toggleFavorite = useFavoriteStore((state) => state.toggleFavorite);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [purchaseAction, setPurchaseAction] = useState<PurchaseAction>(null);
  const [optionAction, setOptionAction] = useState<PurchaseOptionAction | null>(null);

  useEffect(() => {
    setSelectedVariant(null);
    setQuantity(1);
  }, [detail]);

  const handleFavorite = async () => {
    try {
      await toggleFavorite(productId);
    } catch (favoriteError) {
      Alert.alert(
        'Không thể cập nhật yêu thích',
        getApiErrorMessage(favoriteError, 'Vui lòng thử lại.'),
      );
    }
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      title: detail?.product.name ?? 'Chi tiết sản phẩm',
      headerTitleStyle: styles.headerTitle,
      headerRight: () => (
        <Pressable
          accessibilityLabel={isFavorite ? 'Xóa khỏi yêu thích' : 'Thêm vào yêu thích'}
          accessibilityRole="button"
          disabled={isUpdatingFavorite || !detail}
          hitSlop={10}
          onPress={() => void handleFavorite()}
          style={({ pressed }) => [styles.favoriteButton, pressed && styles.pressed]}
        >
          {isUpdatingFavorite ? (
            <ActivityIndicator color={colors.primary} size="small" />
          ) : (
            <Ionicons
              color={isFavorite ? colors.primary : colors.textPrimary}
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={25}
            />
          )}
        </Pressable>
      ),
    });
  }, [detail, isFavorite, isUpdatingFavorite, navigation, toggleFavorite]);

  const galleryImages = useMemo<GalleryImage[]>(() => {
    if (!detail) return [];
    const images = [
      ...detail.images.map((image) => ({ url: image.imageUrl, altText: image.altText })),
      ...detail.variants
        .filter((variant) => variant.imageUrl)
        .map((variant) => ({ url: variant.imageUrl!, altText: variant.variantName })),
    ];
    if (detail.product.primaryImageUrl) {
      images.unshift({ url: detail.product.primaryImageUrl, altText: detail.product.name });
    }
    return [...new Map(images.map((image) => [image.url, image])).values()];
  }, [detail]);

  if (isLoading && !detail) return <ProductDetailSkeleton />;

  if (!detail) {
    return (
      <ErrorState
        description={error ?? 'Không tìm thấy thông tin sản phẩm.'}
        onRetry={() => void reload()}
        style={styles.fullState}
        title="Không thể tải sản phẩm"
      />
    );
  }

  const { product, category, brand, specifications, variants } = detail;
  const displayedPrice = product.price;
  const displayedSalePrice = product.salePrice;
  const currentPrice = effectivePrice(displayedPrice, displayedSalePrice);
  const originalPrice = currentPrice < displayedPrice ? displayedPrice : null;
  const discount = discountPercent(displayedPrice, displayedSalePrice);
  const availability = getProductAvailability(product, variants);
  const availableStock = availability.stock;
  const canPurchase = availability.isPurchasable;

  const openPurchaseOptions = (action: PurchaseOptionAction) => {
    setSelectedVariant(null);
    setQuantity(1);
    setOptionAction(action);
  };

  const closePurchaseOptions = () => {
    if (purchaseAction) return;
    setOptionAction(null);
    setSelectedVariant(null);
    setQuantity(1);
  };

  const handlePurchase = async (action: Exclude<PurchaseAction, null>) => {
    if (!canPurchase || purchaseAction) return;
    if (product.hasVariants && (!selectedVariant || selectedVariant.productId !== product.id)) {
      Alert.alert('Chọn phiên bản', 'Vui lòng chọn phiên bản sản phẩm trước khi mua.');
      return;
    }
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > availableStock) {
      Alert.alert('Số lượng không hợp lệ', `Vui lòng chọn từ 1 đến ${availableStock} sản phẩm.`);
      return;
    }

    setPurchaseAction(action);
    try {
      const cart = await addCartItem({
        productId: product.id,
        variantId: selectedVariant?.id ?? null,
        quantity,
      });
      setOptionAction(null);
      setSelectedVariant(null);
      setQuantity(1);
      if (action === 'buy') {
        const cartItem = cart.items.find((item) => (
          item.product.id === product.id
          && (item.variant?.id ?? null) === (selectedVariant?.id ?? null)
        ));
        if (!cartItem) {
          Alert.alert('Không thể mua ngay', 'Không tìm thấy sản phẩm vừa thêm trong giỏ hàng.');
          return;
        }
        navigation.navigate('Checkout', { cartItemIds: [cartItem.id] });
      } else {
        Alert.alert('Đã thêm vào giỏ', `${product.name} đã được thêm vào giỏ hàng.`);
      }
    } catch (purchaseError) {
      Alert.alert(
        'Không thể thêm vào giỏ',
        getApiErrorMessage(purchaseError, 'Vui lòng kiểm tra lại sản phẩm và thử lại.'),
      );
    } finally {
      setPurchaseAction(null);
    }
  };

  return (
    <SafeAreaView edges={['bottom']} style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={(
          <RefreshControl
            colors={[colors.primary]}
            onRefresh={() => void refresh()}
            refreshing={isRefreshing}
            tintColor={colors.primary}
          />
        )}
        showsVerticalScrollIndicator={false}
      >
        <ProductGallery focusedUrl={selectedVariant?.imageUrl} images={galleryImages} />

        <View style={styles.section}>
          <View style={styles.metaRow}>
            <Text style={styles.category}>{category.name}</Text>
            <Text style={styles.sku}>SKU: {selectedVariant?.sku ?? product.sku}</Text>
          </View>
          <Text style={styles.productName}>{product.name}</Text>
          <View style={styles.ratingRow}>
            <RatingStars
              count={product.reviewCount}
              rating={product.ratingAvg}
              showValue
              size={17}
            />
            <View style={styles.dot} />
            <Text style={styles.sold}>Đã bán {product.soldCount}</Text>
          </View>
          <View style={styles.priceRow}>
            <PriceDisplay
              direction="row"
              originalPrice={originalPrice}
              price={currentPrice}
              size="large"
            />
            {discount > 0 ? <Text style={styles.discount}>-{discount}%</Text> : null}
          </View>
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Ionicons color={colors.primary} name="shield-checkmark-outline" size={21} />
              <View>
                <Text style={styles.infoLabel}>Bảo hành</Text>
                <Text style={styles.infoValue}>{product.warrantyMonths} tháng</Text>
              </View>
            </View>
            <View style={styles.infoItem}>
              <Ionicons color={canPurchase ? colors.success : colors.danger} name="cube-outline" size={21} />
              <View>
                <Text style={styles.infoLabel}>Tình trạng</Text>
                <Text style={[styles.infoValue, !canPurchase && styles.outOfStock]}>
                  {availability.label}
                </Text>
              </View>
            </View>
          </View>
          {product.shortDescription ? (
            <Text style={styles.shortDescription}>{product.shortDescription}</Text>
          ) : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông số kỹ thuật</Text>
          <View style={styles.specifications}>
            <SpecificationList specifications={specifications} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mô tả sản phẩm</Text>
          <Text style={styles.description}>
            {product.description || 'Thông tin mô tả sản phẩm đang được cập nhật.'}
          </Text>
          <View style={styles.brandRow}>
            <Text style={styles.brandLabel}>Thương hiệu</Text>
            <Text style={styles.brandValue}>{brand?.name ?? 'Đang cập nhật'}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <ReviewPreview
            onViewAll={() => navigation.navigate('Reviews', { productId: product.id })}
            reviews={reviews?.reviews ?? []}
            total={reviews?.pagination.total ?? product.reviewCount}
          />
        </View>
      </ScrollView>

      <View style={styles.actionBar}>
        <SecondaryButton
          disabled={!canPurchase || purchaseAction !== null}
          fullWidth={false}
          loading={purchaseAction === 'cart'}
          onPress={() => openPurchaseOptions('cart')}
          style={styles.cartButton}
          title="Thêm vào giỏ"
        />
        <PrimaryButton
          disabled={!canPurchase || purchaseAction !== null}
          fullWidth={false}
          loading={purchaseAction === 'buy'}
          onPress={() => openPurchaseOptions('buy')}
          style={styles.buyButton}
          title="Mua ngay"
        />
      </View>
      <PurchaseOptionsModal
        action={optionAction}
        isSubmitting={purchaseAction !== null}
        onClose={closePurchaseOptions}
        onConfirm={() => {
          if (optionAction) void handlePurchase(optionAction);
        }}
        onQuantityChange={setQuantity}
        onSelectVariant={(variant) => {
          setSelectedVariant(variant);
          setQuantity(1);
        }}
        product={product}
        quantity={quantity}
        selectedVariant={selectedVariant}
        variants={variants}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.surface },
  fullState: { flex: 1, backgroundColor: colors.background },
  headerTitle: { ...typography.bodySemibold, maxWidth: 220 },
  favoriteButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.round,
    backgroundColor: colors.surface,
    ...shadows.card,
  },
  pressed: { opacity: 0.65 },
  scrollContent: { gap: spacing.md, paddingBottom: spacing.xl, backgroundColor: colors.background },
  section: { padding: spacing.screen, backgroundColor: colors.surface },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md },
  category: { ...typography.captionSemibold, color: colors.primary, textTransform: 'uppercase' },
  sku: { ...typography.caption, color: colors.textMuted },
  productName: { ...typography.titleSmall, color: colors.textPrimary, marginTop: spacing.sm },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.md },
  dot: { width: 3, height: 3, marginHorizontal: spacing.sm, borderRadius: radius.round, backgroundColor: colors.textMuted },
  sold: { ...typography.bodySmall, color: colors.textSecondary },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.lg },
  discount: {
    ...typography.captionSemibold,
    color: colors.textInverse,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    backgroundColor: colors.primary,
  },
  infoGrid: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
  infoItem: {
    flex: 1,
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
  },
  infoLabel: { ...typography.caption, color: colors.textSecondary },
  infoValue: { ...typography.captionSemibold, color: colors.textPrimary, marginTop: spacing.xxs },
  outOfStock: { color: colors.danger },
  shortDescription: { ...typography.bodySmall, color: colors.textSecondary, marginTop: spacing.lg },
  sectionTitle: { ...typography.titleSmall, color: colors.textPrimary },
  specifications: { overflow: 'hidden', marginTop: spacing.lg, borderRadius: radius.md },
  description: { ...typography.body, color: colors.textSecondary, marginTop: spacing.md },
  brandRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  brandLabel: { ...typography.bodySmall, color: colors.textSecondary },
  brandValue: { ...typography.bodySmallSemibold, color: colors.textPrimary },
  actionBar: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    backgroundColor: colors.surface,
    ...shadows.floating,
  },
  cartButton: { flex: 1, paddingHorizontal: spacing.sm },
  buyButton: { flex: 1, paddingHorizontal: spacing.sm },
});
