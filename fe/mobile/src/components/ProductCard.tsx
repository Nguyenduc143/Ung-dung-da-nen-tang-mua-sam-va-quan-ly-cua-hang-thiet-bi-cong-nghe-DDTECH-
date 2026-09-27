import { Ionicons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ImageSourcePropType,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { colors, radius, shadows, spacing, typography } from '@/theme';
import { PriceDisplay } from './PriceDisplay';

export interface ProductCardProps {
  name: string;
  price: number;
  imageSource?: ImageSourcePropType;
  badgeText?: string;
  disabled?: boolean;
  isFavorite?: boolean;
  isTogglingFavorite?: boolean;
  onPress?: () => void;
  onToggleFavorite?: () => void;
  originalPrice?: number | null;
  rating?: number;
  soldCount?: number;
  style?: StyleProp<ViewStyle>;
}

export function ProductCard({
  name,
  price,
  imageSource,
  badgeText,
  disabled = false,
  isFavorite = false,
  isTogglingFavorite = false,
  onPress,
  onToggleFavorite,
  originalPrice,
  rating,
  soldCount,
  style,
}: ProductCardProps) {
  return (
    <Pressable
      accessibilityLabel={`${name}, giá ${price} đồng`}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled || !onPress}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      <View style={styles.imageContainer}>
        {imageSource ? (
          <Image source={imageSource} resizeMode="contain" style={styles.image} />
        ) : (
          <Ionicons color={colors.textMuted} name="image-outline" size={48} />
        )}
        {badgeText ? (
          <View style={styles.badge}><Text style={styles.badgeText}>{badgeText}</Text></View>
        ) : null}
        {onToggleFavorite ? (
          <Pressable
            accessibilityLabel={isFavorite ? 'Bỏ khỏi yêu thích' : 'Thêm vào yêu thích'}
            accessibilityRole="button"
            accessibilityState={{ busy: isTogglingFavorite, disabled: isTogglingFavorite }}
            disabled={isTogglingFavorite}
            onPress={(event) => {
              event.stopPropagation();
              onToggleFavorite();
            }}
            style={({ pressed }) => [styles.favoriteButton, pressed && styles.pressed]}
          >
            {isTogglingFavorite ? (
              <ActivityIndicator color={colors.primary} size="small" />
            ) : (
              <Ionicons
                color={isFavorite ? colors.primary : colors.textPrimary}
                name={isFavorite ? 'heart' : 'heart-outline'}
                size={22}
              />
            )}
          </Pressable>
        ) : null}
      </View>

      <View style={styles.content}>
        <Text numberOfLines={2} style={styles.name}>{name}</Text>
        {(typeof rating === 'number' || typeof soldCount === 'number') ? (
          <View style={styles.meta}>
            {typeof rating === 'number' ? (
              <View style={styles.rating}>
                <Ionicons color={colors.rating} name="star" size={14} />
                <Text style={styles.metaText}>{rating.toFixed(1)}</Text>
              </View>
            ) : null}
            {typeof rating === 'number' && typeof soldCount === 'number' ? <Text style={styles.dot}>•</Text> : null}
            {typeof soldCount === 'number' ? <Text style={styles.metaText}>Đã bán {soldCount}</Text> : null}
          </View>
        ) : null}
        <PriceDisplay originalPrice={originalPrice} price={price} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    ...shadows.card,
  },
  pressed: { opacity: 0.78 },
  disabled: { opacity: 0.55 },
  imageContainer: {
    height: 170,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceMuted,
  },
  image: { width: '88%', height: '88%' },
  badge: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.round,
    backgroundColor: colors.primary,
  },
  badgeText: { ...typography.captionSemibold, color: colors.textInverse },
  favoriteButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.round,
    backgroundColor: colors.surface,
    ...shadows.card,
  },
  content: { padding: spacing.md, gap: spacing.sm },
  name: { ...typography.bodySmallSemibold, minHeight: 40, color: colors.textPrimary },
  meta: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: spacing.xs },
  rating: { flexDirection: 'row', alignItems: 'center', gap: spacing.xxs },
  metaText: { ...typography.caption, color: colors.textSecondary },
  dot: { ...typography.caption, color: colors.textMuted },
});
