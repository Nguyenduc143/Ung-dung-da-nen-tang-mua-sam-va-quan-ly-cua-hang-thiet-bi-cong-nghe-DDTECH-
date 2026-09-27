import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { RatingStars } from '@/components';
import { colors, radius, spacing, typography } from '@/theme';
import type { ProductReview } from '@/types';

interface ReviewPreviewProps {
  reviews: ProductReview[];
  total: number;
  onViewAll: () => void;
}

const dateFormatter = new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

export function ReviewPreview({ reviews, total, onViewAll }: ReviewPreviewProps) {
  return (
    <View>
      <View style={styles.header}>
        <Text style={styles.title}>Đánh giá sản phẩm</Text>
        {total > 0 ? (
          <Pressable accessibilityRole="button" hitSlop={8} onPress={onViewAll}>
            <Text style={styles.viewAll}>Xem tất cả ({total})</Text>
          </Pressable>
        ) : null}
      </View>

      {reviews.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons color={colors.textMuted} name="chatbubble-ellipses-outline" size={30} />
          <Text style={styles.emptyText}>Chưa có đánh giá cho sản phẩm này.</Text>
        </View>
      ) : reviews.map((review, index) => (
        <View key={review.id} style={[styles.review, index > 0 && styles.reviewDivider]}>
          <View style={styles.reviewHeader}>
            {review.user.avatarUrl ? (
              <Image source={{ uri: review.user.avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons color={colors.primary} name="person" size={18} />
              </View>
            )}
            <View style={styles.reviewerInfo}>
              <View style={styles.nameRow}>
                <Text numberOfLines={1} style={styles.name}>{review.user.fullName}</Text>
                {review.isVerifiedPurchase ? (
                  <Text style={styles.verified}>Đã mua hàng</Text>
                ) : null}
              </View>
              <RatingStars rating={review.rating} size={14} />
            </View>
            <Text style={styles.date}>{dateFormatter.format(new Date(review.createdAt))}</Text>
          </View>
          {review.comment ? <Text style={styles.comment}>{review.comment}</Text> : null}
          {review.adminReply ? (
            <View style={styles.reply}>
              <Text style={styles.replyTitle}>Phản hồi từ DDTECH</Text>
              <Text style={styles.replyText}>{review.adminReply}</Text>
            </View>
          ) : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  title: { ...typography.titleSmall, color: colors.textPrimary },
  viewAll: { ...typography.bodySmallSemibold, color: colors.primary },
  empty: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xxl },
  emptyText: { ...typography.bodySmall, color: colors.textMuted },
  review: { paddingTop: spacing.lg },
  reviewDivider: { marginTop: spacing.lg, borderTopWidth: 1, borderTopColor: colors.divider },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  avatar: { width: 40, height: 40, borderRadius: radius.round },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.round,
    backgroundColor: colors.primarySoft,
  },
  reviewerInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  name: { ...typography.bodySmallSemibold, maxWidth: '58%', color: colors.textPrimary },
  verified: { ...typography.caption, color: colors.success },
  date: { ...typography.caption, color: colors.textMuted },
  comment: { ...typography.bodySmall, color: colors.textSecondary, marginTop: spacing.md },
  reply: { marginTop: spacing.md, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.surfaceMuted },
  replyTitle: { ...typography.captionSemibold, color: colors.primary },
  replyText: { ...typography.bodySmall, color: colors.textSecondary, marginTop: spacing.xs },
});
