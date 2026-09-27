import { useEffect, useLayoutEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { getApiErrorMessage } from '@/api/axiosClient';
import { getProduct } from '@/api/products.api';
import { createReview, deleteReview, listProductReviews, updateReview } from '@/api/reviews.api';
import { ErrorState, LoadingSkeleton, PrimaryButton } from '@/components';
import type { CustomerStackParamList } from '@/navigation/types';
import { colors, radius, shadows, spacing, typography } from '@/theme';

type Props = NativeStackScreenProps<CustomerStackParamList, 'WriteReview'>;

const ratingLabels: Record<number, string> = {
  1: 'Rất không hài lòng',
  2: 'Không hài lòng',
  3: 'Bình thường',
  4: 'Hài lòng',
  5: 'Rất hài lòng',
};

function FormSkeleton() {
  return (
    <View style={styles.skeleton}>
      <LoadingSkeleton height={90} />
      <LoadingSkeleton height={150} />
      <LoadingSkeleton height={52} />
    </View>
  );
}

export function WriteReviewScreen({ navigation, route }: Props) {
  const { productId, reviewId, review: initialReview } = route.params;
  const isEditing = Boolean(reviewId);
  const [productName, setProductName] = useState('');
  const [rating, setRating] = useState(initialReview?.rating ?? 0);
  const [comment, setComment] = useState(initialReview?.comment ?? '');
  const [images, setImages] = useState(initialReview?.images ?? null);
  const [error, setError] = useState<string | null>(null);
  const [ratingError, setRatingError] = useState<string>();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({ title: isEditing ? 'Chỉnh sửa đánh giá' : 'Viết đánh giá' });
  }, [isEditing, navigation]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [productData, reviewData] = await Promise.all([
          getProduct(productId),
          reviewId && !initialReview ? listProductReviews(productId, 1, 100) : Promise.resolve(null),
        ]);
        if (!active) return;
        setProductName(productData.product.name);
        if (reviewId && !initialReview) {
          const existing = reviewData?.reviews.find((item) => item.id === reviewId);
          if (!existing) throw new Error('Không tìm thấy đánh giá để chỉnh sửa.');
          setRating(existing.rating);
          setComment(existing.comment ?? '');
          setImages(existing.images);
        }
      } catch (loadError) {
        if (active) setError(getApiErrorMessage(loadError, 'Không thể chuẩn bị biểu mẫu đánh giá.'));
      } finally {
        if (active) setIsLoading(false);
      }
    };
    void load();
    return () => { active = false; };
  }, [initialReview, productId, reviewId]);

  const submit = async () => {
    if (rating < 1 || rating > 5) {
      setRatingError('Vui lòng chọn từ 1 đến 5 sao.');
      return;
    }
    setIsSubmitting(true);
    try {
      const input = { rating, comment: comment.trim() || null };
      if (reviewId) await updateReview(reviewId, input);
      else await createReview(productId, input);
      Alert.alert(
        isEditing ? 'Đã cập nhật đánh giá' : 'Cảm ơn bạn đã đánh giá',
        'Đánh giá của bạn đã được ghi nhận.',
        [{ text: 'Xong', onPress: () => navigation.goBack() }],
      );
    } catch (requestError) {
      Alert.alert(
        isEditing ? 'Không thể cập nhật đánh giá' : 'Không thể gửi đánh giá',
        getApiErrorMessage(requestError, 'Vui lòng thử lại.'),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const remove = async () => {
    if (!reviewId) return;
    setIsDeleting(true);
    try {
      await deleteReview(reviewId);
      Alert.alert('Đã xóa đánh giá', 'Đánh giá của bạn đã được xóa.', [
        { text: 'Xong', onPress: () => navigation.goBack() },
      ]);
    } catch (requestError) {
      Alert.alert('Không thể xóa đánh giá', getApiErrorMessage(requestError, 'Vui lòng thử lại.'));
    } finally {
      setIsDeleting(false);
    }
  };

  const confirmDelete = () => {
    Alert.alert('Xóa đánh giá?', 'Đánh giá đã xóa không thể khôi phục.', [
      { style: 'cancel', text: 'Giữ lại' },
      { style: 'destructive', text: 'Xóa', onPress: () => void remove() },
    ]);
  };

  if (isLoading) return <FormSkeleton />;
  if (error) {
    return (
      <ErrorState
        description={error}
        onRetry={() => navigation.replace('WriteReview', route.params)}
        style={styles.fullState}
        title="Không thể mở biểu mẫu"
      />
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
      style={styles.screen}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.productCard}>
          <View style={styles.productIcon}>
            <Ionicons color={colors.primary} name="cube-outline" size={26} />
          </View>
          <View style={styles.productContent}>
            <Text style={styles.productLabel}>Đánh giá sản phẩm</Text>
            <Text numberOfLines={2} style={styles.productName}>{productName}</Text>
          </View>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>Mức độ hài lòng của bạn</Text>
          <View accessibilityRole="radiogroup" style={styles.starRow}>
            {[1, 2, 3, 4, 5].map((value) => (
              <Pressable
                accessibilityLabel={`${value} sao`}
                accessibilityRole="radio"
                accessibilityState={{ checked: rating === value }}
                hitSlop={5}
                key={value}
                onPress={() => {
                  setRating(value);
                  setRatingError(undefined);
                }}
                style={({ pressed }) => pressed && styles.pressed}
              >
                <Ionicons
                  color={value <= rating ? colors.rating : colors.borderStrong}
                  name={value <= rating ? 'star' : 'star-outline'}
                  size={38}
                />
              </Pressable>
            ))}
          </View>
          <Text style={[styles.ratingHint, ratingError && styles.errorText]}>
            {ratingError ?? (rating > 0 ? ratingLabels[rating] : 'Chạm vào số sao để đánh giá')}
          </Text>

          <Text style={styles.commentLabel}>Nhận xét</Text>
          <TextInput
            editable={!isSubmitting && !isDeleting}
            maxLength={5000}
            multiline
            onChangeText={setComment}
            placeholder="Chia sẻ trải nghiệm về chất lượng sản phẩm, giao hàng..."
            placeholderTextColor={colors.textMuted}
            style={styles.commentInput}
            textAlignVertical="top"
            value={comment}
          />
          <Text style={styles.characterCount}>{comment.length}/5000</Text>

          {images && images.length > 0 ? (
            <View style={styles.existingImagesSection}>
              <Text style={styles.existingImagesTitle}>Hình ảnh trong đánh giá</Text>
              <ScrollView contentContainerStyle={styles.existingImages} horizontal showsHorizontalScrollIndicator={false}>
                {images.map((imageUrl, index) => (
                  <Image key={`${imageUrl}-${index}`} source={{ uri: imageUrl }} style={styles.existingImage} />
                ))}
              </ScrollView>
              <Text style={styles.imageHelper}>Ứng dụng giữ nguyên các ảnh đã gửi trước đó.</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.notice}>
          <Ionicons color={colors.info} name="information-circle-outline" size={22} />
          <Text style={styles.noticeText}>
            Nhãn “Đã mua hàng” được hệ thống xác định tự động từ lịch sử đơn hàng đã giao.
          </Text>
        </View>

        <PrimaryButton
          disabled={isDeleting}
          loading={isSubmitting}
          onPress={() => void submit()}
          title={isEditing ? 'Lưu thay đổi' : 'Gửi đánh giá'}
        />

        {isEditing ? (
          <Pressable
            accessibilityRole="button"
            disabled={isSubmitting || isDeleting}
            onPress={confirmDelete}
            style={({ pressed }) => [styles.deleteButton, pressed && styles.pressed]}
          >
            <Ionicons color={colors.danger} name="trash-outline" size={20} />
            <Text style={styles.deleteText}>{isDeleting ? 'Đang xóa...' : 'Xóa đánh giá'}</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  fullState: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.screen, paddingBottom: spacing.huge, gap: spacing.lg },
  productCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg, borderRadius: radius.lg, backgroundColor: colors.surface, ...shadows.card },
  productIcon: { width: 52, height: 52, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md, backgroundColor: colors.primarySoft },
  productContent: { flex: 1 },
  productLabel: { ...typography.caption, color: colors.textSecondary },
  productName: { ...typography.bodySemibold, color: colors.textPrimary, marginTop: spacing.xs },
  formCard: { padding: spacing.xl, borderRadius: radius.lg, backgroundColor: colors.surface, ...shadows.card },
  sectionTitle: { ...typography.bodySemibold, color: colors.textPrimary, textAlign: 'center' },
  starRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, marginTop: spacing.lg },
  ratingHint: { ...typography.bodySmallSemibold, color: colors.rating, textAlign: 'center', marginTop: spacing.md },
  errorText: { color: colors.danger },
  commentLabel: { ...typography.bodySmallSemibold, color: colors.textPrimary, marginTop: spacing.xxl, marginBottom: spacing.sm },
  commentInput: { minHeight: 150, padding: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.surfaceMuted, ...typography.body, color: colors.textPrimary },
  characterCount: { ...typography.caption, color: colors.textMuted, textAlign: 'right', marginTop: spacing.xs },
  existingImagesSection: { marginTop: spacing.lg },
  existingImagesTitle: { ...typography.bodySmallSemibold, color: colors.textPrimary },
  existingImages: { gap: spacing.sm, paddingVertical: spacing.md },
  existingImage: { width: 88, height: 88, borderRadius: radius.md, backgroundColor: colors.surfaceMuted },
  imageHelper: { ...typography.caption, color: colors.textMuted },
  notice: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, padding: spacing.lg, borderRadius: radius.md, backgroundColor: colors.infoSoft },
  noticeText: { ...typography.bodySmall, flex: 1, color: colors.info },
  deleteButton: { minHeight: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, borderWidth: 1, borderColor: colors.danger, borderRadius: radius.md, backgroundColor: colors.surface },
  deleteText: { ...typography.bodySemibold, color: colors.danger },
  pressed: { opacity: 0.68 },
  skeleton: { flex: 1, padding: spacing.screen, gap: spacing.lg, backgroundColor: colors.background },
});
