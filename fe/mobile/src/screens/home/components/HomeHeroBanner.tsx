import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '@/theme';

interface HomeHeroBannerProps {
  discountPercent: number;
  onPress: () => void;
}

export function HomeHeroBanner({ discountPercent, onPress }: HomeHeroBannerProps) {
  const title = discountPercent > 0
    ? `Giảm đến ${discountPercent}%\ncông nghệ đỉnh cao`
    : 'Công nghệ chính hãng\ngiá tốt mỗi ngày';

  return (
    <View style={styles.container}>
      <View style={styles.circleLarge} />
      <View style={styles.circleSmall} />
      <View style={styles.content}>
        <View style={styles.pill}>
          <Ionicons color={colors.textInverse} name="flash" size={14} />
          <Text style={styles.pillText}>Ưu đãi tại DDTECH</Text>
        </View>
        <Text style={styles.title}>{title}</Text>
        <Text numberOfLines={2} style={styles.subtitle}>Sản phẩm uy tín, giao hàng toàn quốc</Text>
        <Pressable
          accessibilityRole="button"
          onPress={onPress}
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
        >
          <Text style={styles.buttonText}>Mua ngay</Text>
          <Ionicons color={colors.primary} name="arrow-forward" size={17} />
        </Pressable>
      </View>
      <View style={styles.visual}>
        <Ionicons color="rgba(255,255,255,0.92)" name="headset" size={104} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 224,
    overflow: 'hidden',
    borderRadius: radius.xl,
    backgroundColor: colors.primary,
  },
  content: { width: '68%', zIndex: 2, padding: spacing.xl },
  pill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.round,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  pillText: { ...typography.captionSemibold, color: colors.textInverse },
  title: {
    ...typography.title,
    color: colors.textInverse,
    marginTop: spacing.lg,
  },
  subtitle: { ...typography.bodySmall, color: 'rgba(255,255,255,0.9)', marginTop: spacing.sm },
  button: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    marginTop: spacing.lg,
  },
  buttonPressed: { opacity: 0.82 },
  buttonText: { ...typography.bodySmallSemibold, color: colors.primary },
  visual: {
    position: 'absolute',
    right: -5,
    bottom: 42,
    zIndex: 1,
    transform: [{ rotate: '-7deg' }],
  },
  circleLarge: {
    position: 'absolute',
    width: 210,
    height: 210,
    top: -85,
    right: -65,
    borderRadius: 105,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  circleSmall: {
    position: 'absolute',
    width: 120,
    height: 120,
    right: 35,
    bottom: -45,
    borderRadius: 60,
    backgroundColor: 'rgba(229,47,53,0.55)',
  },
});
