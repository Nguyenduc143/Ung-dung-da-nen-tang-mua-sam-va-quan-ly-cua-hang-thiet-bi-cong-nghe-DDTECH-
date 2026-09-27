import { useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { getApiErrorMessage } from '@/api/axiosClient';
import { EmptyState, ErrorState } from '@/components';
import type { CustomerStackParamList, MainTabParamList } from '@/navigation/types';
import { useCartStore } from '@/stores';
import { colors, radius, spacing, typography } from '@/theme';
import type { CartItem } from '@/types';
import { CartItemCard } from './components/CartItemCard';
import { CartSkeleton } from './components/CartSkeleton';
import { CartSummaryBar } from './components/CartSummaryBar';

type Props = BottomTabScreenProps<MainTabParamList, 'CartTab'>;

export function CartScreen({ navigation }: Props) {
  const rootNavigation = navigation.getParent<NativeStackNavigationProp<CustomerStackParamList>>();
  const cart = useCartStore((state) => state.cart);
  const error = useCartStore((state) => state.error);
  const isLoading = useCartStore((state) => state.isLoading);
  const isRefreshing = useCartStore((state) => state.isRefreshing);
  const isClearing = useCartStore((state) => state.isClearing);
  const selectedItemIds = useCartStore((state) => state.selectedItemIds);
  const updatingItemIds = useCartStore((state) => state.updatingItemIds);
  const loadCart = useCartStore((state) => state.loadCart);
  const refreshCart = useCartStore((state) => state.refreshCart);
  const updateItemQuantity = useCartStore((state) => state.updateItemQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const clearItems = useCartStore((state) => state.clearItems);
  const toggleItemSelection = useCartStore((state) => state.toggleItemSelection);
  const setAllItemsSelected = useCartStore((state) => state.setAllItemsSelected);

  useFocusEffect(useCallback(() => {
    void loadCart(true).catch(() => undefined);
  }, [loadCart]));

  const handleQuantityChange = async (item: CartItem, quantity: number) => {
    const validQuantity = item.quantity > item.availableStock && quantity < item.quantity
      ? item.availableStock
      : quantity;
    if (validQuantity < 1 || validQuantity > item.availableStock) {
      Alert.alert('Số lượng không hợp lệ', `Sản phẩm hiện chỉ còn ${item.availableStock}.`);
      return;
    }

    try {
      await updateItemQuantity(item.id, validQuantity);
    } catch (updateError) {
      Alert.alert(
        'Không thể cập nhật số lượng',
        getApiErrorMessage(updateError, 'Vui lòng thử lại.'),
      );
      void refreshCart().catch(() => undefined);
    }
  };

  const handleRemove = async (item: CartItem) => {
    try {
      await removeItem(item.id);
    } catch (removeError) {
      Alert.alert(
        'Không thể xóa sản phẩm',
        getApiErrorMessage(removeError, 'Vui lòng thử lại.'),
      );
      void refreshCart().catch(() => undefined);
    }
  };

  const confirmRemove = (item: CartItem) => {
    Alert.alert(
      'Xóa sản phẩm khỏi giỏ?',
      item.product.name,
      [
        { style: 'cancel', text: 'Hủy' },
        {
          style: 'destructive',
          text: 'Xóa',
          onPress: () => void handleRemove(item),
        },
      ],
    );
  };

  const handleClear = async () => {
    try {
      await clearItems();
    } catch (clearError) {
      Alert.alert(
        'Không thể xóa giỏ hàng',
        getApiErrorMessage(clearError, 'Vui lòng thử lại.'),
      );
      void refreshCart().catch(() => undefined);
    }
  };

  const confirmClear = () => {
    Alert.alert(
      'Xóa toàn bộ giỏ hàng?',
      'Tất cả sản phẩm trong giỏ sẽ bị xóa.',
      [
        { style: 'cancel', text: 'Hủy' },
        {
          style: 'destructive',
          text: 'Xóa tất cả',
          onPress: () => void handleClear(),
        },
      ],
    );
  };

  if ((isLoading || isRefreshing) && !cart) return <CartSkeleton />;

  if (error && !cart) {
    return (
      <ErrorState
        description={error}
        onRetry={() => void loadCart(true).catch(() => undefined)}
        style={styles.fullState}
        title="Không thể tải giỏ hàng"
      />
    );
  }

  const items = cart?.items ?? [];
  const selectedItems = items.filter((item) => selectedItemIds.has(item.id));
  const selectedQuantity = selectedItems.reduce((total, item) => total + item.quantity, 0);
  const selectedSubtotal = selectedItems.reduce((total, item) => total + item.lineTotal, 0);
  const allItemsSelected = items.length > 0 && selectedItems.length === items.length;
  const hasInvalidItems = selectedItems.some((item) => (
    !item.isAvailable
    || !item.hasSufficientStock
    || item.quantity > item.availableStock
  ));
  const hasPendingUpdate = updatingItemIds.size > 0 || isClearing;

  return (
    <View style={styles.screen}>
      <FlatList
        contentContainerStyle={styles.listContent}
        data={items}
        keyExtractor={(item) => String(item.id)}
        ListEmptyComponent={(
          <EmptyState
            actionLabel="Khám phá sản phẩm"
            description="Hãy thêm sản phẩm bạn yêu thích để bắt đầu mua sắm."
            icon="cart-outline"
            onAction={() => rootNavigation?.navigate('ProductList')}
            title="Giỏ hàng đang trống"
          />
        )}
        ListHeaderComponent={items.length > 0 ? (
          <View>
            <View style={styles.headerRow}>
              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked: allItemsSelected }}
                onPress={() => setAllItemsSelected(!allItemsSelected)}
                style={({ pressed }) => [styles.selectAllButton, pressed && styles.pressed]}
              >
                <Ionicons
                  color={allItemsSelected ? colors.primary : colors.textMuted}
                  name={allItemsSelected ? 'checkbox' : 'square-outline'}
                  size={24}
                />
                <Text style={styles.itemCount}>Chọn tất cả ({items.length})</Text>
              </Pressable>
              <Pressable
                accessibilityLabel="Xóa toàn bộ giỏ hàng"
                accessibilityRole="button"
                accessibilityState={{ busy: isClearing, disabled: hasPendingUpdate }}
                disabled={hasPendingUpdate}
                onPress={confirmClear}
                style={({ pressed }) => [styles.clearButton, pressed && styles.pressed]}
              >
                {isClearing ? (
                  <ActivityIndicator color={colors.primary} size="small" />
                ) : (
                  <Ionicons color={colors.primary} name="trash-outline" size={20} />
                )}
                <Text style={styles.clearText}>Xóa tất cả</Text>
              </Pressable>
            </View>
            {error ? (
              <View accessibilityRole="alert" style={styles.inlineError}>
                <Text numberOfLines={2} style={styles.inlineErrorText}>{error}</Text>
                <Pressable hitSlop={8} onPress={() => void refreshCart().catch(() => undefined)}>
                  <Text style={styles.retryText}>Tải lại</Text>
                </Pressable>
              </View>
            ) : null}
            {hasInvalidItems ? (
              <View style={styles.cartWarning}>
                <Ionicons color={colors.warning} name="information-circle-outline" size={20} />
                <Text style={styles.cartWarningText}>
                  Vui lòng xử lý sản phẩm hết hàng hoặc vượt tồn kho trước khi thanh toán.
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        onRefresh={() => void refreshCart().catch(() => undefined)}
        refreshing={isRefreshing}
        renderItem={({ item }) => (
          <CartItemCard
            isSelected={selectedItemIds.has(item.id)}
            isUpdating={updatingItemIds.has(item.id)}
            item={item}
            onOpen={() => rootNavigation?.navigate('ProductDetail', {
              productId: item.product.id,
            })}
            onQuantityChange={(quantity) => void handleQuantityChange(item, quantity)}
            onRemove={() => confirmRemove(item)}
            onToggleSelection={() => toggleItemSelection(item.id)}
          />
        )}
        showsVerticalScrollIndicator={false}
      />

      {items.length > 0 ? (
        <CartSummaryBar
          disabled={selectedItems.length === 0 || hasInvalidItems || hasPendingUpdate}
          itemCount={selectedQuantity}
          onCheckout={() => rootNavigation?.navigate('Checkout', {
            cartItemIds: selectedItems.map((item) => item.id),
          })}
          subtotal={selectedSubtotal}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  fullState: { flex: 1, backgroundColor: colors.background },
  listContent: {
    flexGrow: 1,
    padding: spacing.screen,
    paddingBottom: spacing.huge,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  itemCount: { ...typography.bodySemibold, color: colors.textPrimary },
  selectAllButton: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  clearButton: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
  },
  clearText: { ...typography.captionSemibold, color: colors.primary },
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
  cartWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.warningSoft,
  },
  cartWarningText: { ...typography.caption, flex: 1, color: colors.warning },
  separator: { height: spacing.lg },
  pressed: { opacity: 0.65 },
});
