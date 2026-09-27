import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { AddressCard } from '@/components';
import { colors, radius, spacing, typography } from '@/theme';
import type { Address } from '@/types';

interface AddressListItemProps {
  address: Address;
  isUpdating: boolean;
  selectionMode: boolean;
  selected: boolean;
  onDelete: () => void;
  onEdit: () => void;
  onSelect: () => void;
  onSetDefault: () => void;
}

const addressTypeLabels: Record<Address['addressType'], string> = {
  HOME: 'Nhà riêng',
  OFFICE: 'Văn phòng',
  OTHER: 'Khác',
};

const formatAddress = (address: Address): string => [
  address.addressLine,
  address.ward,
  address.district,
  address.province,
].filter(Boolean).join(', ');

export function AddressListItem({
  address,
  isUpdating,
  selectionMode,
  selected,
  onDelete,
  onEdit,
  onSelect,
  onSetDefault,
}: AddressListItemProps) {
  return (
    <View style={styles.container}>
      <View style={styles.typeBadge}>
        <Ionicons color={colors.primary} name={address.addressType === 'OFFICE' ? 'business-outline' : 'home-outline'} size={15} />
        <Text style={styles.typeText}>{addressTypeLabels[address.addressType]}</Text>
      </View>
      <AddressCard
        address={formatAddress(address)}
        isDefault={address.isDefault}
        onEdit={onEdit}
        onPress={selectionMode ? onSelect : undefined}
        phone={address.receiverPhone}
        receiverName={address.receiverName}
        selected={selected}
        style={styles.card}
      />
      <View style={styles.actions}>
        {!address.isDefault ? (
          <Pressable
            accessibilityRole="button"
            disabled={isUpdating}
            onPress={onSetDefault}
            style={({ pressed }) => [styles.defaultButton, pressed && styles.pressed]}
          >
            {isUpdating ? (
              <ActivityIndicator color={colors.primary} size="small" />
            ) : (
              <Ionicons color={colors.primary} name="shield-checkmark-outline" size={18} />
            )}
            <Text style={styles.defaultButtonText}>Đặt mặc định</Text>
          </Pressable>
        ) : <View />}
        <Pressable
          accessibilityLabel={`Xóa địa chỉ của ${address.receiverName}`}
          accessibilityRole="button"
          disabled={isUpdating}
          onPress={onDelete}
          style={({ pressed }) => [styles.deleteButton, pressed && styles.pressed]}
        >
          <Ionicons color={colors.danger} name="trash-outline" size={19} />
          <Text style={styles.deleteText}>Xóa</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'relative' },
  typeBadge: {
    position: 'absolute',
    zIndex: 1,
    top: spacing.md,
    right: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.round,
    backgroundColor: colors.primarySoft,
  },
  typeText: { ...typography.captionSemibold, color: colors.primary },
  card: { borderBottomLeftRadius: 0, borderBottomRightRadius: 0 },
  actions: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: colors.border,
    borderBottomLeftRadius: radius.lg,
    borderBottomRightRadius: radius.lg,
    backgroundColor: colors.surface,
  },
  defaultButton: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  defaultButtonText: { ...typography.captionSemibold, color: colors.primary },
  deleteButton: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, padding: spacing.sm },
  deleteText: { ...typography.captionSemibold, color: colors.danger },
  pressed: { opacity: 0.65 },
});
