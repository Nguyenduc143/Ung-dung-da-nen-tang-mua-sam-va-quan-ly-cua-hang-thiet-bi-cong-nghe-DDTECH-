import { useCallback, useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { getApiErrorMessage } from '@/api/axiosClient';
import { getOrderDetail } from '@/api/orders.api';
import { EmptyState, ErrorState, LoadingSkeleton, PriceDisplay } from '@/components';
import type { CustomerStackParamList } from '@/navigation/types';
import { colors, radius, shadows, spacing, typography } from '@/theme';
import type { OrderDetailData, OrderItem } from '@/types';
import { resolveMediaUrl } from '@/utils';

type Props = NativeStackScreenProps<CustomerStackParamList, 'OrderReviewProducts'>;

function ReviewProductsSkeleton() {
  return (
    <View style={styles.content}>
      <LoadingSkeleton height={72} />
      {[0, 1, 2].map((item) => <LoadingSkeleton height={142} key={item} />)}
    </View>
  );
}

export function OrderReviewProductsScreen({ navigation, route }: Props) {
  const [detail, setDetail] = useState<OrderDetailData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadOrder = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getOrderDetail(route.params.orderId);
      setDetail(data);
      setError(null);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Không thể tải sản phẩm cần đánh giá.'));
    } finally {
      setIsLoading(false);
    }
  }, [route.params.orderId]);

  useFocusEffect(useCallback(() => {
    void loadOrder();
  }, [loadOrder]));

  const reviewableItems = useMemo(() => {
    const uniqueProducts = new Map<number, OrderItem>();
    detail?.items.forEach((item) => {
      if (item.productId !== null && item.isReviewed !== true && !uniqueProducts.has(item.productId)) {
        uniqueProducts.set(item.productId, item);
      }
    });
    return [...uniqueProducts.values()];
  }, [detail]);

  if (isLoading && !detail) return <ReviewProductsSkeleton />;
  if (error && !detail) {
    return (
      <ErrorState
        description={error}
        onRetry={() => void loadOrder()}
        style={styles.fullState}
        title="Không thể tải đơn hàng"
      />
    );
  }

  if (!detail || detail.order.status !== 'DELIVERED' || reviewableItems.length === 0) {
    return (
      <EmptyState
        actionLabel="Quay lại đơn hàng"
        description="Các sản phẩm trong đơn này đã được đánh giá hoặc chưa đủ điều kiện đánh giá."
        icon="checkmark-circle-outline"
        onAction={() => navigation.goBack()}
        style={styles.fullState}
        title="Không còn sản phẩm cần đánh giá"
      />
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.introCard}>
        <Ionicons color={colors.primary} name="star-outline" size={24} />
        <View style={styles.introContent}>
          <Text style={styles.introTitle}>Đơn hàng {route.params.orderCode}</Text>
          <Text style={styles.introText}>Chọn từng sản phẩm để chia sẻ trải nghiệm của bạn.</Text>
        </View>
      </View>

      {reviewableItems.map((item) => {
        const imageUrl = resolveMediaUrl(item.productImage);
        return (
          <View key={item.productId} style={styles.productCard}>
            <Pressable
              accessibilityRole="button"
              onPress={() => navigation.navigate('ProductDetail', { productId: item.productId! })}
              style={({ pressed }) => [styles.productRow, pressed && styles.pressed]}
            >
              <View style={styles.imageContainer}>
                {imageUrl ? (
                  <Image resizeMode="contain" source={{ uri: imageUrl }} style={styles.image} />
                ) : (
                  <Ionicons color={colors.textMuted} name="cube-outline" size={34} />
                )}
              </View>
              <View style={styles.productContent}>
                <Text numberOfLines={2} style={styles.productName}>{item.productName}</Text>
                {item.variantName ? <Text style={styles.variantName}>{item.variantName}</Text> : null}
                <Text style={styles.quantity}>Số lượng: {item.quantity}</Text>
                <PriceDisplay direction="row" price={item.price} size="small" />
              </View>
            </Pressable>
            <Pressable
              accessibilityLabel={`Đánh giá ${item.productName}`}
              accessibilityRole="button"
              onPress={() => navigation.navigate('WriteReview', {
                productId: item.productId!,
                orderId: detail.order.id,
              })}
              style={({ pressed }) => [styles.reviewButton, pressed && styles.reviewButtonPressed]}
            >
              <Ionicons color={colors.primary} name="star" size={18} />
              <Text style={styles.reviewButtonText}>Đánh giá sản phẩm</Text>
            </Pressable>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  fullState: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.screen, paddingBottom: spacing.huge, gap: spacing.lg },
  introCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.primarySoft,
  },
  introContent: { flex: 1 },
  introTitle: { ...typography.bodySemibold, color: colors.textPrimary },
  introText: { ...typography.bodySmall, color: colors.textSecondary, marginTop: spacing.xs },
  productCard: {
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    ...shadows.card,
  },
  productRow: { flexDirection: 'row', gap: spacing.md },
  imageContainer: {
    width: 92,
    height: 92,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
  },
  image: { width: '90%', height: '90%' },
  productContent: { flex: 1, gap: spacing.xs },
  productName: { ...typography.bodySemibold, color: colors.textPrimary },
  variantName: { ...typography.bodySmall, color: colors.textSecondary },
  quantity: { ...typography.caption, color: colors.textMuted },
  reviewButton: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  reviewButtonPressed: { backgroundColor: colors.primarySoft },
  reviewButtonText: { ...typography.bodySmallSemibold, color: colors.primary },
  pressed: { opacity: 0.75 },
});
