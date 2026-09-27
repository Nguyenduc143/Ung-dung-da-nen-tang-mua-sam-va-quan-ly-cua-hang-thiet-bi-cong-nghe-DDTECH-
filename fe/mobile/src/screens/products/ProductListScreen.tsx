import { useLayoutEffect, useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { EmptyState, ErrorState, ProductCard } from '@/components';
import { getApiErrorMessage } from '@/api/axiosClient';
import { useCatalogData, useProductList } from '@/hooks';
import type { CustomerStackParamList, ProductListParams } from '@/navigation/types';
import { useFavoriteStore } from '@/stores';
import { colors, radius, spacing, typography } from '@/theme';
import type { ProductQuery, ProductSort } from '@/types';
import {
  getProductBadgeText,
  getProductImageSource,
  getProductOriginalPrice,
  getProductPrice,
} from '@/utils';
import {
  ProductFilterModal,
  type ProductFilterValues,
} from './components/ProductFilterModal';
import { ProductListSkeleton } from './components/ProductListSkeleton';
import {
  ProductSortModal,
  productSortOptions,
} from './components/ProductSortModal';

type Props = NativeStackScreenProps<CustomerStackParamList, 'ProductList'>;
type ProductListFilterState = Omit<ProductListParams, 'title'>;

const getInitialFilters = (params: ProductListParams | undefined): ProductListFilterState => {
  if (!params) return {};
  const { title: _title, ...filters } = params;
  return filters;
};

export function ProductListScreen({ navigation, route }: Props) {
  const [filters, setFilters] = useState<ProductListFilterState>(
    () => getInitialFilters(route.params),
  );
  const [filterVisible, setFilterVisible] = useState(false);
  const [sortVisible, setSortVisible] = useState(false);
  const favorites = useFavoriteStore((state) => state.favorites);
  const updatingFavoriteIds = useFavoriteStore((state) => state.updatingProductIds);
  const toggleFavorite = useFavoriteStore((state) => state.toggleFavorite);
  const { brands, categories } = useCatalogData();
  const favoriteProductIds = useMemo(
    () => new Set(favorites.map((item) => item.product.id)),
    [favorites],
  );

  const sort = filters.sort ?? 'newest';
  const query = useMemo<Omit<ProductQuery, 'limit' | 'page'>>(() => ({
    search: filters.search?.trim() || undefined,
    category: filters.category,
    brand: filters.brand,
    minPrice: filters.minPrice,
    maxPrice: filters.maxPrice,
    sort,
    featured: filters.featured,
    new: filters.isNew,
  }), [filters, sort]);
  const {
    products,
    pagination,
    error,
    loadMoreError,
    isLoading,
    isRefreshing,
    isLoadingMore,
    hasNextPage,
    loadMore,
    reload,
    refresh,
  } = useProductList(query);

  const filterValues = useMemo<ProductFilterValues>(() => ({
    category: filters.category,
    brand: filters.brand,
    minPrice: filters.minPrice,
    maxPrice: filters.maxPrice,
    featured: filters.featured,
    isNew: filters.isNew,
  }), [
    filters.brand,
    filters.category,
    filters.featured,
    filters.isNew,
    filters.maxPrice,
    filters.minPrice,
  ]);
  const quickCategories = useMemo(
    () => categories.filter((category) => category.parentId === null),
    [categories],
  );
  const activeFilterCount = [
    filters.category,
    filters.brand,
    filters.minPrice,
    filters.maxPrice,
    filters.featured,
    filters.isNew,
  ].filter((value) => value !== undefined).length;
  const selectedSortLabel = productSortOptions.find((option) => option.value === sort)?.label
    ?? 'Mới nhất';

  useLayoutEffect(() => {
    navigation.setOptions({ title: route.params?.title ?? 'Sản phẩm' });
  }, [navigation, route.params?.title]);

  const clearProductFilters = () => {
    setFilters((current) => ({ search: current.search, sort: current.sort }));
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

  const listHeader = (
    <View>
      {filters.search ? (
        <Text style={styles.searchSummary}>
          Kết quả cho “<Text style={styles.searchTerm}>{filters.search}</Text>”
        </Text>
      ) : null}

      {quickCategories.length > 0 ? (
        <ScrollView
          contentContainerStyle={styles.categoryChips}
          horizontal
          showsHorizontalScrollIndicator={false}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: filters.category === undefined }}
            onPress={() => setFilters((current) => ({ ...current, category: undefined }))}
            style={({ pressed }) => [
              styles.chip,
              filters.category === undefined && styles.selectedChip,
              pressed && styles.pressed,
            ]}
          >
            <Text style={[
              styles.chipText,
              filters.category === undefined && styles.selectedChipText,
            ]}>
              Tất cả
            </Text>
          </Pressable>
          {quickCategories.map((category) => {
            const selected = String(filters.category) === category.slug;
            return (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected }}
                key={category.id}
                onPress={() => setFilters((current) => ({
                  ...current,
                  category: category.slug,
                }))}
                style={({ pressed }) => [
                  styles.chip,
                  selected && styles.selectedChip,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={[styles.chipText, selected && styles.selectedChipText]}>
                  {category.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      ) : null}

      {error && products.length > 0 ? (
        <View accessibilityRole="alert" style={styles.inlineError}>
          <Text numberOfLines={2} style={styles.inlineErrorText}>{error}</Text>
          <Pressable hitSlop={8} onPress={() => void reload()}>
            <Text style={styles.retryText}>Thử lại</Text>
          </Pressable>
        </View>
      ) : null}

      <View style={styles.toolbar}>
        <Text style={styles.totalText}>{pagination.total} sản phẩm</Text>
        <View style={styles.toolbarActions}>
          <Pressable
            accessibilityLabel="Mở bộ lọc sản phẩm"
            accessibilityRole="button"
            onPress={() => setFilterVisible(true)}
            style={({ pressed }) => [styles.toolbarButton, pressed && styles.pressed]}
          >
            <Ionicons color={colors.primary} name="options-outline" size={19} />
            <Text style={styles.toolbarButtonText}>
              Lọc{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
            </Text>
          </Pressable>
          <Pressable
            accessibilityLabel={`Sắp xếp: ${selectedSortLabel}`}
            accessibilityRole="button"
            onPress={() => setSortVisible(true)}
            style={({ pressed }) => [styles.toolbarButton, pressed && styles.pressed]}
          >
            <Text numberOfLines={1} style={styles.toolbarButtonText}>{selectedSortLabel}</Text>
            <Ionicons color={colors.primary} name="chevron-down" size={17} />
          </Pressable>
        </View>
      </View>
    </View>
  );

  if (isLoading && products.length === 0) return <ProductListSkeleton />;

  if (error && products.length === 0) {
    return (
      <ErrorState
        description={error}
        onRetry={() => void reload()}
        style={styles.fullState}
        title="Không thể tải sản phẩm"
      />
    );
  }

  return (
    <>
      <FlatList
        columnWrapperStyle={styles.productRow}
        contentContainerStyle={styles.listContent}
        data={products}
        keyExtractor={(product) => String(product.id)}
        ListEmptyComponent={(
          <EmptyState
            actionLabel={activeFilterCount > 0 ? 'Xóa bộ lọc' : undefined}
            description="Hãy thử thay đổi danh mục, thương hiệu hoặc khoảng giá."
            icon="search-outline"
            onAction={activeFilterCount > 0 ? clearProductFilters : undefined}
            title="Không tìm thấy sản phẩm"
          />
        )}
        ListFooterComponent={(
          <View style={styles.footer}>
            {isLoadingMore ? <ActivityIndicator color={colors.primary} /> : null}
            {loadMoreError ? (
              <View style={styles.loadMoreError}>
                <Text numberOfLines={2} style={styles.loadMoreErrorText}>{loadMoreError}</Text>
                <Pressable hitSlop={8} onPress={() => void loadMore()}>
                  <Text style={styles.retryText}>Tải lại</Text>
                </Pressable>
              </View>
            ) : null}
            {!hasNextPage && products.length > 0 && !isLoadingMore ? (
              <Text style={styles.endText}>Bạn đã xem hết sản phẩm</Text>
            ) : null}
          </View>
        )}
        ListHeaderComponent={listHeader}
        numColumns={2}
        onEndReached={() => void loadMore()}
        onEndReachedThreshold={0.35}
        onRefresh={() => void refresh()}
        refreshing={isRefreshing}
        renderItem={({ item }) => (
          <ProductCard
            badgeText={getProductBadgeText(item)}
            imageSource={getProductImageSource(item)}
            isFavorite={favoriteProductIds.has(item.id)}
            isTogglingFavorite={updatingFavoriteIds.has(item.id)}
            name={item.name}
            onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
            onToggleFavorite={() => void handleToggleFavorite(item.id)}
            originalPrice={getProductOriginalPrice(item)}
            price={getProductPrice(item)}
            rating={item.ratingAvg}
            soldCount={item.soldCount}
            style={styles.productCard}
          />
        )}
        showsVerticalScrollIndicator={false}
      />

      <ProductFilterModal
        brands={brands}
        categories={categories}
        initialValues={filterValues}
        onApply={(values) => {
          setFilters((current) => ({ ...current, ...values }));
          setFilterVisible(false);
        }}
        onClose={() => setFilterVisible(false)}
        onReset={() => {
          clearProductFilters();
          setFilterVisible(false);
        }}
        visible={filterVisible}
      />
      <ProductSortModal
        onClose={() => setSortVisible(false)}
        onSelect={(value: ProductSort) => {
          setFilters((current) => ({ ...current, sort: value }));
          setSortVisible(false);
        }}
        selected={sort}
        visible={sortVisible}
      />
    </>
  );
}

const styles = StyleSheet.create({
  fullState: { flex: 1, backgroundColor: colors.background },
  listContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.md,
    paddingBottom: spacing.huge,
  },
  searchSummary: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.md },
  searchTerm: { color: colors.textPrimary, fontWeight: '600' },
  categoryChips: { gap: spacing.sm, paddingBottom: spacing.md },
  chip: {
    minHeight: 42,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.round,
    backgroundColor: colors.surface,
  },
  selectedChip: { borderColor: colors.primary, backgroundColor: colors.primary },
  chipText: { ...typography.bodySmallSemibold, color: colors.textSecondary },
  selectedChipText: { color: colors.textInverse },
  pressed: { opacity: 0.68 },
  inlineError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    marginTop: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.dangerSoft,
  },
  inlineErrorText: { ...typography.caption, flex: 1, color: colors.danger },
  retryText: { ...typography.captionSemibold, color: colors.danger },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginVertical: spacing.lg,
  },
  totalText: { ...typography.bodySmallSemibold, color: colors.textPrimary },
  toolbarActions: { flexDirection: 'row', flexShrink: 1, gap: spacing.sm },
  toolbarButton: {
    minHeight: 40,
    maxWidth: 140,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    borderRadius: radius.round,
    backgroundColor: colors.primarySoft,
  },
  toolbarButtonText: { ...typography.captionSemibold, flexShrink: 1, color: colors.primary },
  productRow: { gap: spacing.md, marginBottom: spacing.md },
  productCard: { flex: 1, maxWidth: '48%' },
  footer: { minHeight: 64, alignItems: 'center', justifyContent: 'center', padding: spacing.md },
  loadMoreError: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  loadMoreErrorText: { ...typography.caption, flexShrink: 1, color: colors.danger },
  endText: { ...typography.caption, color: colors.textMuted },
});
