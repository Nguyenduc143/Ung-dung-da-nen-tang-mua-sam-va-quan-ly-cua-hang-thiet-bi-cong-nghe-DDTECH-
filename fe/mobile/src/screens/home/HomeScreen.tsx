import { useMemo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  FlatList,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CategoryCard, ErrorState, SearchBar } from '@/components';
import { getApiErrorMessage } from '@/api/axiosClient';
import { useHomeData } from '@/hooks';
import type { CustomerStackParamList, MainTabParamList } from '@/navigation/types';
import { useAuthStore, useBadgeStore, useFavoriteStore } from '@/stores';
import { colors, radius, spacing, typography } from '@/theme';
import type { ProductListItem } from '@/types';
import { getProductDiscountPercent } from '@/utils';
import { HomeHeader } from './components/HomeHeader';
import { HomeHeroBanner } from './components/HomeHeroBanner';
import { HomeLoadingState } from './components/HomeLoadingState';
import { HomeProductSection } from './components/HomeProductSection';
import { HomeSectionHeader } from './components/HomeSectionHeader';

type Props = BottomTabScreenProps<MainTabParamList, 'HomeTab'>;

const getDisplayName = (fullName: string | undefined): string => {
  const parts = fullName?.trim().split(/\s+/).filter(Boolean) ?? [];
  return parts[parts.length - 1] ?? 'bạn';
};

const deduplicateDiscountedProducts = (sections: ProductListItem[][]): ProductListItem[] => {
  const products = new Map<number, ProductListItem>();
  for (const section of sections) {
    for (const product of section) {
      if (getProductDiscountPercent(product) > 0) products.set(product.id, product);
    }
  }
  return [...products.values()].slice(0, 8);
};

export function HomeScreen({ navigation }: Props) {
  const rootNavigation = navigation.getParent<NativeStackNavigationProp<CustomerStackParamList>>();
  const user = useAuthStore((state) => state.user);
  const notificationCount = useBadgeStore((state) => state.unreadNotificationCount);
  const favorites = useFavoriteStore((state) => state.favorites);
  const favoriteProductIds = useMemo(
    () => new Set(favorites.map((item) => item.product.id)),
    [favorites],
  );
  const updatingFavoriteIds = useFavoriteStore((state) => state.updatingProductIds);
  const toggleFavorite = useFavoriteStore((state) => state.toggleFavorite);
  const {
    categories,
    featuredProducts,
    newProducts,
    bestSellingProducts,
    error,
    isLoading,
    isRefreshing,
    reload,
    refresh,
  } = useHomeData();

  const quickCategories = useMemo(
    () => categories.filter((category) => category.parentId === null).slice(0, 10),
    [categories],
  );
  const promotionalProducts = useMemo(
    () => deduplicateDiscountedProducts([
      featuredProducts,
      newProducts,
      bestSellingProducts,
    ]),
    [bestSellingProducts, featuredProducts, newProducts],
  );
  const maximumDiscount = useMemo(
    () => promotionalProducts.reduce(
      (maximum, product) => Math.max(maximum, getProductDiscountPercent(product)),
      0,
    ),
    [promotionalProducts],
  );
  const hasContent = categories.length > 0
    || featuredProducts.length > 0
    || newProducts.length > 0
    || bestSellingProducts.length > 0;
  const showContent = hasContent || (!isLoading && !error);

  const openProduct = (product: ProductListItem) => {
    rootNavigation?.navigate('ProductDetail', { productId: product.id });
  };

  const handleToggleFavorite = async (productId: number) => {
    try {
      await toggleFavorite(productId);
    } catch (favoriteError) {
      Alert.alert(
        'Không thể cập nhật yêu thích',
        getApiErrorMessage(favoriteError, 'Vui lòng thử lại.'),
      );
    }
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={(
          <RefreshControl
            colors={[colors.primary]}
            onRefresh={() => void refresh()}
            refreshing={isRefreshing}
            tintColor={colors.primary}
          />
        )}
        showsVerticalScrollIndicator={false}
      >
        <HomeHeader
          displayName={getDisplayName(user?.fullName)}
          notificationCount={notificationCount}
          onFavoritesPress={() => rootNavigation?.navigate('Favorites')}
          onNotificationsPress={() => rootNavigation?.navigate('Notifications')}
        />

        {isLoading && !hasContent ? <HomeLoadingState /> : null}

        {!isLoading && error && !hasContent ? (
          <ErrorState
            description={error}
            onRetry={() => void reload()}
            style={styles.fullError}
            title="Không thể tải trang chủ"
          />
        ) : null}

        {showContent ? (
          <>
            {error ? (
              <View accessibilityRole="alert" style={styles.inlineError}>
                <Ionicons color={colors.danger} name="alert-circle-outline" size={20} />
                <Text numberOfLines={2} style={styles.inlineErrorText}>{error}</Text>
                <Pressable hitSlop={8} onPress={() => void reload()}>
                  <Text style={styles.retryText}>Thử lại</Text>
                </Pressable>
              </View>
            ) : null}

            <Pressable
              accessibilityLabel="Mở màn hình tìm kiếm sản phẩm"
              accessibilityRole="button"
              onPress={() => rootNavigation?.navigate('Search')}
              style={styles.searchWrapper}
            >
              <View pointerEvents="none">
                <SearchBar editable={false} placeholder="Tìm iPhone, laptop, tai nghe..." />
              </View>
            </Pressable>

            <View style={styles.bannerWrapper}>
              <HomeHeroBanner
                discountPercent={maximumDiscount}
                onPress={() => rootNavigation?.navigate('ProductList', {
                  featured: true,
                  title: 'Sản phẩm nổi bật',
                })}
              />
            </View>

            <View style={styles.categorySection}>
              <HomeSectionHeader
                actionLabel="Xem tất cả"
                onAction={() => navigation.navigate('CategoriesTab')}
                title="Danh mục"
              />
              {quickCategories.length > 0 ? (
                <FlatList
                  contentContainerStyle={styles.categoryList}
                  data={quickCategories}
                  horizontal
                  ItemSeparatorComponent={() => <View style={styles.categorySeparator} />}
                  keyExtractor={(category) => String(category.id)}
                  renderItem={({ item }) => (
                    <CategoryCard
                      imageSource={item.imageUrl ? { uri: item.imageUrl } : undefined}
                      name={item.name}
                      onPress={() => rootNavigation?.navigate('ProductList', {
                        category: item.slug,
                        categoryRoot: item.slug,
                        title: item.name,
                      })}
                    />
                  )}
                  showsHorizontalScrollIndicator={false}
                />
              ) : (
                <View style={styles.emptyCategory}>
                  <Text style={styles.emptyText}>Chưa có danh mục để hiển thị.</Text>
                </View>
              )}
            </View>

            <HomeProductSection
              badgeFallback="Nổi bật"
              emptyMessage="Chưa có sản phẩm nổi bật."
              favoriteProductIds={favoriteProductIds}
              updatingFavoriteIds={updatingFavoriteIds}
              onToggleFavorite={(productId) => void handleToggleFavorite(productId)}
              onProductPress={openProduct}
              onSeeAll={() => rootNavigation?.navigate('ProductList', {
                featured: true,
                title: 'Sản phẩm nổi bật',
              })}
              products={featuredProducts}
              title="Sản phẩm nổi bật"
            />
            <HomeProductSection
              badgeFallback="Mới"
              emptyMessage="Chưa có sản phẩm mới."
              favoriteProductIds={favoriteProductIds}
              updatingFavoriteIds={updatingFavoriteIds}
              onToggleFavorite={(productId) => void handleToggleFavorite(productId)}
              onProductPress={openProduct}
              onSeeAll={() => rootNavigation?.navigate('ProductList', {
                isNew: true,
                sort: 'newest',
                title: 'Sản phẩm mới',
              })}
              products={newProducts}
              title="Sản phẩm mới"
            />
            <HomeProductSection
              badgeFallback="Bán chạy"
              emptyMessage="Chưa có dữ liệu sản phẩm bán chạy."
              favoriteProductIds={favoriteProductIds}
              updatingFavoriteIds={updatingFavoriteIds}
              onToggleFavorite={(productId) => void handleToggleFavorite(productId)}
              onProductPress={openProduct}
              onSeeAll={() => rootNavigation?.navigate('ProductList', {
                sort: 'best_selling',
                title: 'Sản phẩm bán chạy',
              })}
              products={bestSellingProducts}
              title="Sản phẩm bán chạy"
            />
            <HomeProductSection
              emptyMessage="Hiện chưa có sản phẩm khuyến mãi."
              favoriteProductIds={favoriteProductIds}
              updatingFavoriteIds={updatingFavoriteIds}
              onToggleFavorite={(productId) => void handleToggleFavorite(productId)}
              onProductPress={openProduct}
              products={promotionalProducts}
              title="Khuyến mãi"
            />
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  scrollContent: { flexGrow: 1, paddingBottom: spacing.huge },
  fullError: { flex: 1, minHeight: 420 },
  inlineError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.screen,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.dangerSoft,
  },
  inlineErrorText: { ...typography.caption, flex: 1, color: colors.danger },
  retryText: { ...typography.captionSemibold, color: colors.danger },
  searchWrapper: { marginHorizontal: spacing.screen },
  bannerWrapper: { marginHorizontal: spacing.screen, marginTop: spacing.lg },
  categorySection: { marginTop: spacing.xxxl },
  categoryList: { paddingHorizontal: spacing.screen, paddingBottom: spacing.sm },
  categorySeparator: { width: spacing.sm },
  emptyCategory: {
    marginHorizontal: spacing.screen,
    padding: spacing.xl,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
  },
  emptyText: { ...typography.bodySmall, color: colors.textSecondary, textAlign: 'center' },
});
