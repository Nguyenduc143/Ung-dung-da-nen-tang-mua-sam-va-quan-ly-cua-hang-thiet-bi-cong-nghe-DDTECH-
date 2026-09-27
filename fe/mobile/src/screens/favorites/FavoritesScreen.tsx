import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { getApiErrorMessage } from '@/api/axiosClient';
import { EmptyState, ErrorState } from '@/components';
import type { CustomerStackParamList } from '@/navigation/types';
import { useCartStore, useFavoriteStore } from '@/stores';
import { colors, radius, spacing, typography } from '@/theme';
import type { FavoriteProduct } from '@/types';
import { FavoriteProductCard } from './components/FavoriteProductCard';
import { FavoritesSkeleton } from './components/FavoritesSkeleton';

type Props = NativeStackScreenProps<CustomerStackParamList, 'Favorites'>;

export function FavoritesScreen({ navigation }: Props) {
  const favorites = useFavoriteStore((state) => state.favorites);
  const error = useFavoriteStore((state) => state.error);
  const isLoading = useFavoriteStore((state) => state.isLoading);
  const isRefreshing = useFavoriteStore((state) => state.isRefreshing);
  const isInitialized = useFavoriteStore((state) => state.isInitialized);
  const updatingProductIds = useFavoriteStore((state) => state.updatingProductIds);
  const loadFavorites = useFavoriteStore((state) => state.loadFavorites);
  const refreshFavorites = useFavoriteStore((state) => state.refreshFavorites);
  const toggleFavorite = useFavoriteStore((state) => state.toggleFavorite);
  const addCartItem = useCartStore((state) => state.addItem);
  const [addingProductId, setAddingProductId] = useState<number | null>(null);

  useEffect(() => {
    if (!isInitialized) void loadFavorites().catch(() => undefined);
  }, [isInitialized, loadFavorites]);

  const removeFavorite = async (product: FavoriteProduct) => {
    try {
      await toggleFavorite(product.id);
    } catch (removeError) {
      Alert.alert(
        'Không thể bỏ yêu thích',
        getApiErrorMessage(removeError, 'Vui lòng thử lại.'),
      );
    }
  };

  const confirmRemove = (product: FavoriteProduct) => {
    Alert.alert(
      'Bỏ khỏi danh sách yêu thích?',
      product.name,
      [
        { style: 'cancel', text: 'Hủy' },
        {
          style: 'destructive',
          text: 'Bỏ yêu thích',
          onPress: () => void removeFavorite(product),
        },
      ],
    );
  };

  const handleCartAction = async (product: FavoriteProduct) => {
    if (product.hasVariants) {
      navigation.navigate('ProductDetail', { productId: product.id });
      return;
    }
    if (product.stock <= 0 || addingProductId !== null) return;

    setAddingProductId(product.id);
    try {
      await addCartItem({ productId: product.id, variantId: null, quantity: 1 });
      Alert.alert('Đã thêm vào giỏ', `${product.name} đã được thêm vào giỏ hàng.`);
    } catch (cartError) {
      Alert.alert(
        'Không thể thêm vào giỏ',
        getApiErrorMessage(cartError, 'Vui lòng thử lại.'),
      );
    } finally {
      setAddingProductId(null);
    }
  };

  if (isLoading && favorites.length === 0) return <FavoritesSkeleton />;

  if (error && favorites.length === 0) {
    return (
      <ErrorState
        description={error}
        onRetry={() => void loadFavorites(true).catch(() => undefined)}
        style={styles.fullState}
        title="Không thể tải sản phẩm yêu thích"
      />
    );
  }

  return (
    <FlatList
      contentContainerStyle={styles.listContent}
      data={favorites}
      keyExtractor={(item) => String(item.id)}
      ListEmptyComponent={(
        <EmptyState
          actionLabel="Khám phá sản phẩm"
          description="Nhấn biểu tượng trái tim ở sản phẩm bạn quan tâm để lưu lại tại đây."
          icon="heart-outline"
          onAction={() => navigation.navigate('ProductList')}
          title="Chưa có sản phẩm yêu thích"
        />
      )}
      ListHeaderComponent={favorites.length > 0 ? (
        <View>
          <View style={styles.summaryRow}>
            <View style={styles.summaryTitle}>
              <Ionicons color={colors.primary} name="heart" size={20} />
              <Text style={styles.summaryText}>{favorites.length} sản phẩm đã lưu</Text>
            </View>
            <Pressable
              accessibilityLabel="Tải lại danh sách yêu thích"
              accessibilityRole="button"
              hitSlop={8}
              onPress={() => void refreshFavorites().catch(() => undefined)}
              style={({ pressed }) => pressed && styles.pressed}
            >
              <Ionicons color={colors.textSecondary} name="refresh" size={22} />
            </Pressable>
          </View>
          {error ? (
            <View accessibilityRole="alert" style={styles.inlineError}>
              <Text numberOfLines={2} style={styles.inlineErrorText}>{error}</Text>
              <Pressable hitSlop={8} onPress={() => void refreshFavorites().catch(() => undefined)}>
                <Text style={styles.retryText}>Thử lại</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      ) : null}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      onRefresh={() => void refreshFavorites().catch(() => undefined)}
      refreshing={isRefreshing}
      renderItem={({ item }) => (
        <FavoriteProductCard
          isAddingToCart={addingProductId === item.product.id}
          isCartBusy={addingProductId !== null}
          isRemoving={updatingProductIds.has(item.product.id)}
          onAddToCart={() => void handleCartAction(item.product)}
          onOpen={() => navigation.navigate('ProductDetail', { productId: item.product.id })}
          onRemove={() => confirmRemove(item.product)}
          product={item.product}
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
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  summaryTitle: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  summaryText: { ...typography.bodySemibold, color: colors.textPrimary },
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
  pressed: { opacity: 0.65 },
});
