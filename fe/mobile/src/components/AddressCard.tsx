import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radius, shadows, spacing, typography } from '@/theme';

export interface AddressCardProps {
  address: string;
  phone: string;
  receiverName: string;
  isDefault?: boolean;
  onEdit?: () => void;
  onPress?: () => void;
  selected?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function AddressCard({
  address,
  phone,
  receiverName,
  isDefault = false,
  onEdit,
  onPress,
  selected = false,
  style,
}: AddressCardProps) {
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityState={{ selected }}
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        selected && styles.selectedCard,
        pressed && styles.pressed,
        style,
      ]}
    >
      {isDefault ? (
        <View style={styles.defaultRow}>
          <Ionicons color={colors.primary} name="shield-checkmark" size={16} />
          <Text style={styles.defaultText}>Địa chỉ mặc định</Text>
        </View>
      ) : null}
      <View style={styles.contentRow}>
        <View style={styles.iconContainer}>
          <Ionicons color={colors.primary} name="location-outline" size={28} />
        </View>
        <View style={styles.content}>
          <Text style={styles.name}>{receiverName}</Text>
          <Text style={styles.phone}>{phone}</Text>
          <Text style={styles.address}>{address}</Text>
        </View>
        {onEdit ? (
          <Pressable
            accessibilityLabel="Chỉnh sửa địa chỉ"
            accessibilityRole="button"
            hitSlop={8}
            onPress={(event) => {
              event.stopPropagation();
              onEdit();
            }}
            style={({ pressed }) => pressed && styles.pressed}
          >
            <Ionicons color={colors.textSecondary} name="create-outline" size={24} />
          </Pressable>
        ) : null}
        {onPress ? (
          <Ionicons
            color={selected ? colors.primary : colors.textMuted}
            name={selected ? 'checkmark-circle' : 'chevron-forward'}
            size={selected ? 24 : 22}
          />
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    ...shadows.card,
  },
  selectedCard: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  pressed: { opacity: 0.75 },
  defaultRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.md },
  defaultText: { ...typography.captionSemibold, color: colors.primary },
  contentRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  iconContainer: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
  },
  content: { flex: 1, gap: spacing.xxs },
  name: { ...typography.bodySemibold, color: colors.textPrimary },
  phone: { ...typography.bodySmall, color: colors.textSecondary },
  address: { ...typography.bodySmall, color: colors.textSecondary, marginTop: spacing.xs },
});
