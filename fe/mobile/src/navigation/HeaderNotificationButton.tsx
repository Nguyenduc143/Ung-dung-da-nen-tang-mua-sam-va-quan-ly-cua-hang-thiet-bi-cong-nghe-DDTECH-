import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '@/theme';

interface HeaderNotificationButtonProps {
  count: number;
  onPress: () => void;
}

export function HeaderNotificationButton({ count, onPress }: HeaderNotificationButtonProps) {
  return (
    <Pressable
      accessibilityLabel={count > 0 ? `Thông báo, ${count} chưa đọc` : 'Thông báo'}
      accessibilityRole="button"
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <Ionicons color={colors.textPrimary} name="notifications-outline" size={25} />
      {count > 0 ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{count > 99 ? '99+' : count}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.round,
  },
  pressed: { backgroundColor: colors.primarySoft },
  badge: {
    position: 'absolute',
    top: 1,
    right: 0,
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
