import { useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { getApiErrorMessage } from '@/api/axiosClient';
import { EmptyState, ErrorState, PrimaryButton } from '@/components';
import type { CustomerStackParamList } from '@/navigation/types';
import { useAddressStore } from '@/stores';
import { colors, radius, spacing, typography } from '@/theme';
import type { Address } from '@/types';
import { AddressListItem } from './components/AddressListItem';
import { AddressListSkeleton } from './components/AddressListSkeleton';

type Props = NativeStackScreenProps<CustomerStackParamList, 'AddressList'>;

export function AddressListScreen({ navigation, route }: Props) {
  const selectionMode = Boolean(route.params?.selectionMode);
  const addresses = useAddressStore((state) => state.addresses);
  const error = useAddressStore((state) => state.error);
  const isLoading = useAddressStore((state) => state.isLoading);
  const isRefreshing = useAddressStore((state) => state.isRefreshing);
  const isInitialized = useAddressStore((state) => state.isInitialized);
  const updatingAddressIds = useAddressStore((state) => state.updatingAddressIds);
  const loadAddresses = useAddressStore((state) => state.loadAddresses);
  const refreshAddresses = useAddressStore((state) => state.refreshAddresses);
  const removeAddress = useAddressStore((state) => state.removeAddress);
  const setDefaultAddress = useAddressStore((state) => state.setDefaultAddress);

  useFocusEffect(useCallback(() => {
    if (!isInitialized) void loadAddresses().catch(() => undefined);
  }, [isInitialized, loadAddresses]));

  const handleSetDefault = async (address: Address) => {
    try {
      await setDefaultAddress(address.id);
    } catch (setDefaultError) {
      Alert.alert(
        'Không thể đặt mặc định',
        getApiErrorMessage(setDefaultError, 'Vui lòng thử lại.'),
      );
    }
  };

  const handleDelete = async (address: Address) => {
    try {
      await removeAddress(address.id);
    } catch (deleteError) {
      Alert.alert(
        'Không thể xóa địa chỉ',
        getApiErrorMessage(deleteError, 'Vui lòng thử lại.'),
      );
    }
  };

  const confirmDelete = (address: Address) => {
    Alert.alert(
      'Xóa địa chỉ?',
      address.isDefault
        ? 'Đây là địa chỉ mặc định. Bạn có chắc chắn muốn xóa?'
        : `${address.addressLine}, ${address.district}, ${address.province}`,
      [
        { style: 'cancel', text: 'Hủy' },
        {
          style: 'destructive',
          text: 'Xóa',
          onPress: () => void handleDelete(address),
        },
      ],
    );
  };

  const selectAddress = (address: Address) => {
    if (!selectionMode) return;
    navigation.popTo('Checkout', {
      addressId: address.id,
      cartItemIds: route.params?.cartItemIds,
    });
  };

  if (isLoading && addresses.length === 0) return <AddressListSkeleton />;

  if (error && addresses.length === 0) {
    return (
      <ErrorState
        description={error}
        onRetry={() => void loadAddresses(true).catch(() => undefined)}
        style={styles.fullState}
        title="Không thể tải địa chỉ"
      />
    );
  }

  return (
    <FlatList
      contentContainerStyle={styles.listContent}
      data={addresses}
      keyExtractor={(address) => String(address.id)}
      ListEmptyComponent={(
        <EmptyState
          actionLabel="Thêm địa chỉ"
          description="Thêm địa chỉ nhận hàng để quá trình thanh toán nhanh hơn."
          icon="location-outline"
          onAction={() => navigation.navigate('AddressForm')}
          title="Chưa có địa chỉ giao hàng"
        />
      )}
      ListHeaderComponent={(
        <View>
          {selectionMode ? (
            <View style={styles.selectionNotice}>
              <Ionicons color={colors.info} name="information-circle-outline" size={21} />
              <Text style={styles.selectionNoticeText}>
                Chọn một địa chỉ để tiếp tục thanh toán.
              </Text>
            </View>
          ) : null}
          {addresses.length > 0 ? (
            <PrimaryButton
              icon={<Ionicons color={colors.textInverse} name="add" size={22} />}
              onPress={() => navigation.navigate('AddressForm')}
              title="Thêm địa chỉ mới"
            />
          ) : null}
          {addresses.length > 0 ? (
            <Text style={styles.count}>{addresses.length} địa chỉ đã lưu</Text>
          ) : null}
          {error && addresses.length > 0 ? (
            <View accessibilityRole="alert" style={styles.inlineError}>
              <Text numberOfLines={2} style={styles.inlineErrorText}>{error}</Text>
              <Pressable hitSlop={8} onPress={() => void refreshAddresses().catch(() => undefined)}>
                <Text style={styles.retryText}>Thử lại</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      )}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      onRefresh={() => void refreshAddresses().catch(() => undefined)}
      refreshing={isRefreshing}
      renderItem={({ item }) => (
        <AddressListItem
          address={item}
          isUpdating={updatingAddressIds.has(item.id)}
          onDelete={() => confirmDelete(item)}
          onEdit={() => navigation.navigate('AddressForm', { addressId: item.id })}
          onSelect={() => selectAddress(item)}
          onSetDefault={() => void handleSetDefault(item)}
          selected={route.params?.selectedAddressId === item.id}
          selectionMode={selectionMode}
        />
      )}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  fullState: { flex: 1, backgroundColor: colors.background },
  listContent: {
    flexGrow: 1,
    padding: spacing.screen,
    paddingBottom: spacing.huge,
    backgroundColor: colors.background,
  },
  selectionNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.infoSoft,
  },
  selectionNoticeText: { ...typography.bodySmall, flex: 1, color: colors.info },
  count: { ...typography.bodySmallSemibold, color: colors.textSecondary, marginVertical: spacing.lg },
  inlineError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.dangerSoft,
  },
  inlineErrorText: { ...typography.caption, flex: 1, color: colors.danger },
  retryText: { ...typography.captionSemibold, color: colors.danger },
  separator: { height: spacing.lg },
});
