import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radius, shadows, spacing, typography } from '@/theme';
import type { IoniconName } from './iconTypes';

export interface AppHeaderAction {
  accessibilityLabel: string;
  icon: IoniconName;
  onPress: () => void;
  badge?: number;
}

export interface AppHeaderProps {
  title: string;
  actions?: AppHeaderAction[];
  onBack?: () => void;
  subtitle?: string;
  style?: StyleProp<ViewStyle>;
}

export function AppHeader({ title, actions = [], onBack, subtitle, style }: AppHeaderProps) {
  return (
    <View style={[styles.container, style]}>
      {onBack ? (
        <Pressable
          accessibilityLabel="Quay lại"
          accessibilityRole="button"
          hitSlop={8}
          onPress={onBack}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
        >
          <Ionicons color={colors.textSecondary} name="arrow-back" size={28} />
        </Pressable>
      ) : null}

      <View style={styles.titleGroup}>
        <Text numberOfLines={1} style={styles.title}>{title}</Text>
        {subtitle ? <Text numberOfLines={1} style={styles.subtitle}>{subtitle}</Text> : null}
      </View>

      {actions.length > 0 ? (
        <View style={styles.actions}>
          {actions.map((action) => (
            <Pressable
              accessibilityLabel={action.accessibilityLabel}
              accessibilityRole="button"
              key={`${action.icon}-${action.accessibilityLabel}`}
              onPress={action.onPress}
              style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}
            >
              <Ionicons color={colors.textPrimary} name={action.icon} size={24} />
              {action.badge ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{action.badge > 99 ? '99+' : action.badge}</Text>
                </View>
              ) : null}
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.screen,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.round,
  },
  titleGroup: { flex: 1 },
  title: { ...typography.title, color: colors.textPrimary },
  subtitle: { ...typography.bodySmall, color: colors.textSecondary, marginTop: spacing.xxs },
  actions: { flexDirection: 'row', gap: spacing.sm },
  actionButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    ...shadows.card,
  },
  pressed: { opacity: 0.7 },
  badge: {
    position: 'absolute',
    top: -3,
    right: -3,
    minWidth: 18,
    height: 18,
    paddingHorizontal: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.round,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  badgeText: { ...typography.captionSemibold, color: colors.textInverse, fontSize: 10, lineHeight: 12 },
});
