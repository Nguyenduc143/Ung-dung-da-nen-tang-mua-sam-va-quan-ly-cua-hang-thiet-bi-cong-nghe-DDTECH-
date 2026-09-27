import { useCallback, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { getApiErrorMessage } from '@/api/axiosClient';
import { getProduct } from '@/api/products.api';
import { deleteReview, listProductReviews } from '@/api/reviews.api';
import { EmptyState, ErrorState, LoadingSkeleton, PrimaryButton, RatingStars } from '@/components';
import type { CustomerStackParamList } from '@/navigation/types';
import { useAuthStore } from '@/stores';
import { colors, radius, shadows, spacing, typography } from '@/theme';
import type { ProductPagination, ProductReview } from '@/types';

type Props = NativeStackScreenProps<CustomerStackParamList, 'Reviews'>;
type RatingFilter = 0 | 1 | 2 | 3 | 4 | 5;
type LoadMode = 'initial' | 'refresh' | 'more';

const PAGE_SIZE = 10;
const initialPagination: ProductPagination = { page: 1, limit: PAGE_SIZE, total: 0, totalPages: 0 };
const dateFormatter = new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
const ratingFilters: RatingFilter[] = [0, 5, 4, 3, 2, 1];

const mergeReviews = (current: ProductReview[], incoming: ProductReview[]) => {
  const byId = new Map(current.map((review) => [review.id, review]));
  incoming.forEach((review) => byId.set(review.id, review));
  return [...byId.values()];
};

function ReviewsSkeleton() {
  return (
    <View style={styles.skeletonList}>
      <LoadingSkeleton height={126} />
      {[0, 1, 2].map((item) => (
        <View key={item} style={styles.skeletonCard}>
          <View style={styles.skeletonHeader}>
            <LoadingSkeleton borderRadius={radius.round} height={42} width={42} />
            <View style={styles.skeletonHeaderText}>
              <LoadingSkeleton height={16} width="58%" />
              <LoadingSkeleton height={14} width="42%" />
            </View>
          </View>
          <LoadingSkeleton height={16} width="100%" />
          <LoadingSkeleton height={16} width="76%" />
        </View>
      ))}
    </View>
  );
}

interface ReviewCardProps {
  isDeleting: boolean;
  isOwner: boolean;
  onDelete: () => void;
  onEdit: () => void;
  review: ProductReview;
}

function ReviewCard({ isDeleting, isOwner, onDelete, onEdit, review }: ReviewCardProps) {
  return (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        {review.user.avatarUrl ? (
          <Image source={{ uri: review.user.avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Ionicons color={colors.primary} name="person" size={19} />
          </View>
        )}
        <View style={styles.reviewerInfo}>
          <View style={styles.nameRow}>
            <Text numberOfLines={1} style={styles.reviewerName}>{review.user.fullName}</Text>
            {review.isVerifiedPurchase ? (
              <View style={styles.verifiedBadge}>
                <Ionicons color={colors.success} name="checkmark-circle" size={14} />
                <Text style={styles.verifiedText}>Đã mua hàng</Text>
              </View>
            ) : null}
          </View>
          <View style={styles.ratingDateRow}>
            <RatingStars rating={review.rating} size={15} />
            <Text style={styles.reviewDate}>{dateFormatter.format(new Date(review.createdAt))}</Text>
          </View>
        </View>
      </View>

      {review.comment ? <Text style={styles.comment}>{review.comment}</Text> : null}

      {review.images && review.images.length > 0 ? (
        <ScrollView contentContainerStyle={styles.reviewImages} horizontal showsHorizontalScrollIndicator={false}>
          {review.images.map((imageUrl, index) => (
            <Image key={`${imageUrl}-${index}`} source={{ uri: imageUrl }} style={styles.reviewImage} />
          ))}
        </ScrollView>
      ) : null}

      {review.adminReply ? (
        <View style={styles.adminReply}>
          <View style={styles.replyTitleRow}>
            <Ionicons color={colors.primary} name="storefront-outline" size={17} />
            <Text style={styles.replyTitle}>Phản hồi từ DDTECH</Text>
          </View>
          <Text style={styles.replyText}>{review.adminReply}</Text>
          {review.repliedAt ? <Text style={styles.replyDate}>{dateFormatter.format(new Date(review.repliedAt))}</Text> : null}
        </View>
      ) : null}

      {isOwner ? (
        <View style={styles.ownerActions}>
          <Pressable onPress={onEdit} style={({ pressed }) => [styles.ownerButton, pressed && styles.pressed]}>
            <Ionicons color={colors.primary} name="create-outline" size={18} />
            <Text style={styles.editText}>Chỉnh sửa</Text>
          </Pressable>
          <Pressable
            disabled={isDeleting}
            onPress={onDelete}
            style={({ pressed }) => [styles.ownerButton, pressed && styles.pressed]}
          >
            {isDeleting ? (
              <ActivityIndicator color={colors.danger} size="small" />
            ) : (
              <Ionicons color={colors.danger} name="trash-outline" size={18} />
            )}
            <Text style={styles.deleteText}>Xóa</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

export function ReviewsScreen({ navigation, route }: Props) {
  const { productId } = route.params;
  const user = useAuthStore((state) => state.user);
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [pagination, setPagination] = useState(initialPagination);
  const [ratingAverage, setRatingAverage] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [selectedRating, setSelectedRating] = useState<RatingFilter>(0);
  const [error, setError] = useState<string | null>(null);
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [deletingReviewId, setDeletingReviewId] = useState<number | null>(null);
  const requestIdRef = useRef(0);
  const loadingMoreRef = useRef(false);

  const loadPage = useCallback(async (page: number, mode: LoadMode) => {
    if (mode === 'more') {
      if (loadingMoreRef.current) return;
      loadingMoreRef.current = true;
      setIsLoadingMore(true);
      setLoadMoreError(null);
    } else if (mode === 'refresh') setIsRefreshing(true);
    else {
      setIsLoading(true);
      setError(null);
    }

    const requestId = ++requestIdRef.current;
    try {
      const [reviewData, productData] = await Promise.all([
        listProductReviews(productId, page, PAGE_SIZE, selectedRating || undefined),
        page === 1 ? getProduct(productId) : Promise.resolve(null),
      ]);
      if (requestId !== requestIdRef.current) return;
      setReviews((current) => page === 1 ? reviewData.reviews : mergeReviews(current, reviewData.reviews));
      setPagination(reviewData.pagination);
      if (productData) {
        setRatingAverage(productData.product.ratingAvg);
        setReviewCount(productData.product.reviewCount);
        navigation.setOptions({ title: `Đánh giá ${productData.product.name}` });
      }
      setError(null);
      setLoadMoreError(null);
    } catch (requestError) {
      if (requestId !== requestIdRef.current) return;
      const message = getApiErrorMessage(requestError, 'Không thể tải đánh giá sản phẩm.');
      if (mode === 'more') setLoadMoreError(message);
      else setError(message);
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
      if (mode === 'more') {
        loadingMoreRef.current = false;
        setIsLoadingMore(false);
      }
    }
  }, [navigation, productId, selectedRating]);

  useFocusEffect(useCallback(() => {
    setReviews([]);
    setPagination(initialPagination);
    void loadPage(1, 'initial');
    return () => { requestIdRef.current += 1; };
  }, [loadPage]));

  const openReviewForm = (review?: ProductReview) => {
    navigation.navigate('WriteReview', {
      productId,
      reviewId: review?.id,
      review: review ? {
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        images: review.images,
      } : undefined,
    });
  };

  const removeReview = async (review: ProductReview) => {
    setDeletingReviewId(review.id);
    try {
      await deleteReview(review.id);
      setReviews((current) => current.filter((item) => item.id !== review.id));
      setPagination((current) => ({ ...current, total: Math.max(0, current.total - 1) }));
      setReviewCount((current) => Math.max(0, current - 1));
      const productData = await getProduct(productId).catch(() => null);
      if (productData) {
        setRatingAverage(productData.product.ratingAvg);
        setReviewCount(productData.product.reviewCount);
      }
    } catch (requestError) {
      Alert.alert('Không thể xóa đánh giá', getApiErrorMessage(requestError, 'Vui lòng thử lại.'));
    } finally {
      setDeletingReviewId(null);
    }
  };

  const confirmDelete = (review: ProductReview) => {
    Alert.alert('Xóa đánh giá?', 'Đánh giá đã xóa không thể khôi phục.', [
      { style: 'cancel', text: 'Giữ lại' },
      { style: 'destructive', text: 'Xóa', onPress: () => void removeReview(review) },
    ]);
  };

  if (isLoading && reviews.length === 0) return <ReviewsSkeleton />;
  if (error && reviews.length === 0) {
    return <ErrorState description={error} onRetry={() => void loadPage(1, 'initial')} style={styles.fullState} title="Không thể tải đánh giá" />;
  }

  const ownReview = reviews.find((review) => review.user.id === user?.id);
  const hasNextPage = pagination.page < pagination.totalPages;
  const loadMore = () => {
    if (!hasNextPage || isLoadingMore || isRefreshing) return;
    void loadPage(pagination.page + 1, 'more');
  };

  const header = (
    <View>
      <View style={styles.summaryCard}>
        <View style={styles.ratingSummary}>
          <Text style={styles.averageRating}>{ratingAverage.toFixed(1)}</Text>
          <RatingStars rating={ratingAverage} size={20} />
          <Text style={styles.reviewCount}>{reviewCount} đánh giá</Text>
        </View>
        <PrimaryButton
          fullWidth={false}
          icon={<Ionicons color={colors.textInverse} name="create-outline" size={19} />}
          onPress={() => openReviewForm(ownReview)}
          title={ownReview ? 'Sửa đánh giá' : 'Viết đánh giá'}
        />
      </View>
      <ScrollView contentContainerStyle={styles.filterContent} horizontal showsHorizontalScrollIndicator={false}>
        {ratingFilters.map((rating) => {
          const selected = selectedRating === rating;
          return (
            <Pressable
              accessibilityState={{ selected }}
              key={rating}
              onPress={() => setSelectedRating(rating)}
              style={({ pressed }) => [styles.filterChip, selected && styles.filterChipSelected, pressed && styles.pressed]}
            >
              <Text style={[styles.filterText, selected && styles.filterTextSelected]}>
                {rating === 0 ? 'Tất cả' : `${rating} sao`}
              </Text>
              {rating > 0 ? <Ionicons color={selected ? colors.textInverse : colors.rating} name="star" size={14} /> : null}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );

  return (
    <FlatList
      contentContainerStyle={styles.listContent}
      data={reviews}
      keyExtractor={(item) => String(item.id)}
      ListEmptyComponent={(
        <EmptyState
          actionLabel="Viết đánh giá"
          description={selectedRating ? `Chưa có đánh giá ${selectedRating} sao cho sản phẩm này.` : 'Hãy là người đầu tiên chia sẻ trải nghiệm về sản phẩm.'}
          icon="chatbubble-ellipses-outline"
          onAction={() => openReviewForm()}
          title="Chưa có đánh giá"
        />
      )}
      ListFooterComponent={reviews.length > 0 ? (
        <View style={styles.footer}>
          {isLoadingMore ? <ActivityIndicator color={colors.primary} /> : null}
          {loadMoreError ? (
            <View style={styles.loadMoreError}>
              <Text style={styles.loadMoreErrorText}>{loadMoreError}</Text>
              <Pressable onPress={loadMore}><Text style={styles.retryText}>Tải lại</Text></Pressable>
            </View>
          ) : null}
          {!hasNextPage && !isLoadingMore ? <Text style={styles.endText}>Bạn đã xem hết đánh giá</Text> : null}
        </View>
      ) : null}
      ListHeaderComponent={header}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      onEndReached={loadMore}
      onEndReachedThreshold={0.35}
      onRefresh={() => void loadPage(1, 'refresh')}
      refreshing={isRefreshing}
      renderItem={({ item }) => (
        <ReviewCard
          isDeleting={deletingReviewId === item.id}
          isOwner={item.user.id === user?.id}
          onDelete={() => confirmDelete(item)}
          onEdit={() => openReviewForm(item)}
          review={item}
        />
      )}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  fullState: { flex: 1, backgroundColor: colors.background },
  listContent: { flexGrow: 1, padding: spacing.screen, paddingBottom: spacing.huge, backgroundColor: colors.background },
  summaryCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.lg, padding: spacing.lg, borderRadius: radius.lg, backgroundColor: colors.surface, ...shadows.card },
  ratingSummary: { gap: spacing.xs },
  averageRating: { ...typography.titleLarge, color: colors.textPrimary },
  reviewCount: { ...typography.caption, color: colors.textSecondary },
  filterContent: { paddingVertical: spacing.lg, gap: spacing.sm },
  filterChip: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, minHeight: 38, paddingHorizontal: spacing.lg, borderWidth: 1, borderColor: colors.border, borderRadius: radius.round, backgroundColor: colors.surface },
  filterChipSelected: { borderColor: colors.primary, backgroundColor: colors.primary },
  filterText: { ...typography.bodySmallSemibold, color: colors.textSecondary },
  filterTextSelected: { color: colors.textInverse },
  reviewCard: { padding: spacing.lg, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, backgroundColor: colors.surface, ...shadows.card },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: { width: 44, height: 44, borderRadius: radius.round },
  avatarPlaceholder: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: radius.round, backgroundColor: colors.primarySoft },
  reviewerInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  reviewerName: { ...typography.bodySmallSemibold, flexShrink: 1, color: colors.textPrimary },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: spacing.xxs },
  verifiedText: { ...typography.caption, color: colors.success },
  ratingDateRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm, marginTop: spacing.xs },
  reviewDate: { ...typography.caption, color: colors.textMuted },
  comment: { ...typography.body, color: colors.textSecondary, marginTop: spacing.lg },
  reviewImages: { gap: spacing.sm, paddingTop: spacing.md },
  reviewImage: { width: 86, height: 86, borderRadius: radius.md, backgroundColor: colors.surfaceMuted },
  adminReply: { marginTop: spacing.lg, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.primarySoft },
  replyTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  replyTitle: { ...typography.captionSemibold, color: colors.primary },
  replyText: { ...typography.bodySmall, color: colors.textPrimary, marginTop: spacing.sm },
  replyDate: { ...typography.caption, color: colors.textMuted, marginTop: spacing.xs },
  ownerActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.lg, marginTop: spacing.lg, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.divider },
  ownerButton: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, padding: spacing.xs },
  editText: { ...typography.bodySmallSemibold, color: colors.primary },
  deleteText: { ...typography.bodySmallSemibold, color: colors.danger },
  separator: { height: spacing.lg },
  footer: { minHeight: 64, alignItems: 'center', justifyContent: 'center', padding: spacing.md },
  loadMoreError: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  loadMoreErrorText: { ...typography.caption, flexShrink: 1, color: colors.danger },
  retryText: { ...typography.captionSemibold, color: colors.primary },
  endText: { ...typography.caption, color: colors.textMuted },
  pressed: { opacity: 0.72 },
  skeletonList: { flex: 1, padding: spacing.screen, gap: spacing.lg, backgroundColor: colors.background },
  skeletonCard: { padding: spacing.lg, borderRadius: radius.lg, backgroundColor: colors.surface, gap: spacing.md },
  skeletonHeader: { flexDirection: 'row', gap: spacing.md },
  skeletonHeaderText: { flex: 1, gap: spacing.sm },
});
