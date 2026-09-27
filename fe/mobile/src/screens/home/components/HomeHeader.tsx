import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BrandLogo } from '@/components';
import { colors, radius, shadows, spacing, typography } from '@/theme';

interface HomeHeaderProps {
  displayName: string;
  notificationCount: number;
  onFavoritesPress: () => void;
  onNotificationsPress: () => void;
}

export function HomeHeader({
  displayName,
  notificationCount,
  onFavoritesPress,
  onNotificationsPress,
}: HomeHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.brandGroup}>
        <Text numberOfLines={1} style={styles.greeting}>Xin chào, {displayName} 👋</Text>
        <BrandLogo compact />
      </View>

      <View style={styles.actions}>
        <Pressable
          accessibilityLabel="Sản phẩm yêu thích"
          accessibilityRole="button"
          onPress={onFavoritesPress}
          style={({ pressed }) => [styles.action, pressed && styles.pressed]}
        >
          <Ionicons color={colors.textPrimary} name="heart-outline" size={25} />
        </Pressable>
        <Pressable
          accessibilityLabel={notificationCount > 0
            ? `Thông báo, ${notificationCount} chưa đọc`
            : 'Thông báo'}
          accessibilityRole="button"
          onPress={onNotificationsPress}
          style={({ pressed }) => [styles.action, pressed && styles.pressed]}
        >
          <Ionicons color={colors.textPrimary} name="notifications-outline" size={25} />
          {notificationCount > 0 ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {notificationCount > 99 ? '99+' : notificationCount}
              </Text>
            </View>
          ) : null}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  brandGroup: { flex: 1 },
  greeting: { ...typography.bodySmall, color: colors.textSecondary, marginBottom: spacing.xxs },
  actions: { flexDirection: 'row', gap: spacing.sm },
  action: {
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    ...shadows.card,
  },
  pressed: { opacity: 0.68 },
  badge: {
    position: 'absolute',
    top: 3,
    right: 2,
    minWidth: 18,
    height: 18,
    paddingHorizontal: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.round,
    borderWidth: 2,
    borderColor: colors.surface,
    backgroundColor: colors.primary,
  },
  badgeText: { ...typography.captionSemibold, color: colors.textInverse, fontSize: 9, lineHeight: 11 },
});
