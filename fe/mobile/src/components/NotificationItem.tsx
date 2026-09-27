import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radius, spacing, typography } from '@/theme';
import type { IoniconName } from './iconTypes';
import type { StatusBadgeTone } from './StatusBadge';

export interface NotificationItemProps {
  message: string;
  time: string;
  title: string;
  icon?: IoniconName;
  isUnread?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  tone?: StatusBadgeTone;
}

const iconPalette: Record<StatusBadgeTone, { background: string; foreground: string }> = {
  neutral: { background: colors.surfaceMuted, foreground: colors.textSecondary },
  info: { background: colors.infoSoft, foreground: colors.info },
  warning: { background: colors.warningSoft, foreground: colors.warning },
  success: { background: colors.successSoft, foreground: colors.success },
  danger: { background: colors.dangerSoft, foreground: colors.danger },
  purple: { background: colors.purpleSoft, foreground: colors.purple },
};

export function NotificationItem({
  message,
  time,
  title,
  icon = 'notifications-outline',
  isUnread = false,
  onPress,
  style,
  tone = 'danger',
}: NotificationItemProps) {
  const palette = iconPalette[tone];
  return (
    <Pressable
      accessibilityLabel={`${title}. ${message}`}
      accessibilityRole={onPress ? 'button' : undefined}
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        isUnread && styles.unreadContainer,
        pressed && styles.pressed,
        style,
      ]}
    >
      <View style={[styles.iconContainer, { backgroundColor: palette.background }]}>
        <Ionicons color={palette.foreground} name={icon} size={26} />
      </View>
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text numberOfLines={1} style={styles.title}>{title}</Text>
          <Text style={styles.time}>{time}</Text>
          {isUnread ? <View accessibilityLabel="Chưa đọc" style={styles.unreadDot} /> : null}
        </View>
        <Text numberOfLines={2} style={styles.message}>{message}</Text>
      </View>
      {onPress ? <Ionicons color={colors.textMuted} name="chevron-forward" size={20} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    backgroundColor: colors.surface,
  },
  unreadContainer: { backgroundColor: colors.primarySoft },
  pressed: { opacity: 0.72 },
  iconContainer: {
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
  },
  content: { flex: 1, gap: spacing.xs },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  title: { ...typography.bodySmallSemibold, flex: 1, color: colors.textPrimary },
  time: { ...typography.caption, color: colors.textMuted },
  unreadDot: { width: 7, height: 7, borderRadius: radius.round, backgroundColor: colors.primary },
  message: { ...typography.bodySmall, color: colors.textSecondary },
});
