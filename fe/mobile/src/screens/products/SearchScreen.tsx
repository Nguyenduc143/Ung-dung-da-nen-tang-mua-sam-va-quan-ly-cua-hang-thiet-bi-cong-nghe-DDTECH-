import { useEffect, useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { EmptyState, ErrorState, LoadingSkeleton, ProductCard, SearchBar } from '@/components';
import { getApiErrorMessage } from '@/api/axiosClient';
import { useCatalogData, useDebouncedValue, useProductList } from '@/hooks';
import type { CustomerStackParamList } from '@/navigation/types';
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
  ActiveFilterChips,
  type ActiveFilterChip,
} from './components/ActiveFilterChips';
import {
  ProductFilterModal,
  type ProductFilterValues,
} from './components/ProductFilterModal';
import {
  ProductSortModal,
  productSortOptions,
} from './components/ProductSortModal';

type Props = NativeStackScreenProps<CustomerStackParamList, 'Search'>;

const currencyFormatter = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 });

const formatPrice = (value: number): string => `${currencyFormatter.format(value)}đ`;

export function SearchScreen({ navigation, route }: Props) {
  const [searchValue, setSearchValue] = useState(route.params?.query ?? '');
  const [filters, setFilters] = useState<ProductFilterValues>({});
  const [sort, setSort] = useState<ProductSort>('newest');
  const [filterVisible, setFilterVisible] = useState(false);
  const [sortVisible, setSortVisible] = useState(false);
  const favorites = useFavoriteStore((state) => state.favorites);
  const updatingFavoriteIds = useFavoriteStore((state) => state.updatingProductIds);
  const toggleFavorite = useFavoriteStore((state) => state.toggleFavorite);
  const debouncedSearch = useDebouncedValue(searchValue.trim(), 400);
  const { brands, categories } = useCatalogData();
  const favoriteProductIds = useMemo(
    () => new Set(favorites.map((item) => item.product.id)),
    [favorites],
  );

  useEffect(() => {
    if (route.params?.query !== undefined) setSearchValue(route.params.query);
  }, [route.params?.query]);

  const query = useMemo<Omit<ProductQuery, 'limit' | 'page'>>(() => ({
    search: debouncedSearch || undefined,
    category: filters.category,
    brand: filters.brand,
    minPrice: filters.minPrice,
    maxPrice: filters.maxPrice,
    featured: filters.featured,
    new: filters.isNew,
    sort,
  }), [debouncedSearch, filters, sort]);

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

  const activeChips = useMemo<ActiveFilterChip[]>(() => {
    const chips: ActiveFilterChip[] = [];
    if (filters.category !== undefined) {
      const category = categories.find((item) => (
        item.slug === String(filters.category) || item.id === Number(filters.category)
      ));
      chips.push({
        key: 'category',
        label: `Danh mục: ${category?.name ?? filters.category}`,
        onRemove: () => setFilters((current) => ({ ...current, category: undefined })),
      });
    }
    if (filters.brand !== undefined) {
      const brand = brands.find((item) => (
        item.slug === String(filters.brand) || item.id === Number(filters.brand)
      ));
      chips.push({
        key: 'brand',
        label: `Thương hiệu: ${brand?.name ?? filters.brand}`,
        onRemove: () => setFilters((current) => ({ ...current, brand: undefined })),
      });
    }
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      const range = filters.minPrice !== undefined && filters.maxPrice !== undefined
        ? `${formatPrice(filters.minPrice)} – ${formatPrice(filters.maxPrice)}`
        : filters.minPrice !== undefined
          ? `Từ ${formatPrice(filters.minPrice)}`
          : `Đến ${formatPrice(filters.maxPrice!)}`;
      chips.push({
        key: 'price',
        label: `Giá: ${range}`,
        onRemove: () => setFilters((current) => ({
          ...current,
          minPrice: undefined,
          maxPrice: undefined,
        })),
      });
    }
    if (filters.featured) {
      chips.push({
        key: 'featured',
        label: 'Sản phẩm nổi bật',
        onRemove: () => setFilters((current) => ({ ...current, featured: undefined })),
      });
    }
    if (filters.isNew) {
      chips.push({
        key: 'new',
        label: 'Sản phẩm mới',
        onRemove: () => setFilters((current) => ({ ...current, isNew: undefined })),
      });
    }
    return chips;
  }, [brands, categories, filters]);

  const selectedSortLabel = productSortOptions.find((option) => option.value === sort)?.label
    ?? 'Mới nhất';
  const isDebouncing = searchValue.trim() !== debouncedSearch;

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
    <View style={styles.headerContent}>
      <SearchBar
        autoFocus={!route.params?.query}
        onChangeText={setSearchValue}
        onFilterPress={() => setFilterVisible(true)}
        onSubmitEditing={() => Keyboard.dismiss()}
        placeholder="Tìm iPhone, laptop, tai nghe..."
        value={searchValue}
      />

      <ActiveFilterChips chips={activeChips} onReset={() => setFilters({})} />

      {error && products.length > 0 ? (
        <View accessibilityRole="alert" style={styles.inlineError}>
          <Text numberOfLines={2} style={styles.inlineErrorText}>{error}</Text>
          <Pressable hitSlop={8} onPress={() => void reload()}>
            <Text style={styles.retryText}>Thử lại</Text>
          </Pressable>
        </View>
      ) : null}

      <View style={styles.toolbar}>
        <View style={styles.resultCount}>
          <Text style={styles.totalText}>
            {debouncedSearch ? `${pagination.total} kết quả` : `${pagination.total} sản phẩm`}
          </Text>
          {isDebouncing ? <ActivityIndicator color={colors.primary} size="small" /> : null}
        </View>
        <Pressable
          accessibilityLabel={`Sắp xếp: ${selectedSortLabel}`}
          accessibilityRole="button"
          onPress={() => setSortVisible(true)}
          style={({ pressed }) => [styles.sortButton, pressed && styles.pressed]}
        >
          <Text numberOfLines={1} style={styles.sortButtonText}>{selectedSortLabel}</Text>
          <Ionicons color={colors.primary} name="chevron-down" size={17} />
        </Pressable>
      </View>
    </View>
  );

  const emptyContent = isLoading ? (
    <View style={styles.skeletonGrid}>
      {[0, 1, 2, 3, 4, 5].map((item) => (
        <LoadingSkeleton borderRadius={radius.lg} height={300} key={item} style={styles.skeletonCard} />
      ))}
    </View>
  ) : error ? (
    <ErrorState
      description={error}
      onRetry={() => void reload()}
      title="Không thể tìm kiếm sản phẩm"
    />
  ) : (
    <EmptyState
      actionLabel={activeChips.length > 0 ? 'Xóa bộ lọc' : undefined}
      description={debouncedSearch
        ? `Không có sản phẩm phù hợp với “${debouncedSearch}”. Hãy thử từ khóa khác.`
        : 'Hãy thử thay đổi danh mục, thương hiệu hoặc khoảng giá.'}
      icon="search-outline"
      onAction={activeChips.length > 0 ? () => setFilters({}) : undefined}
      title="Không tìm thấy sản phẩm"
    />
  );

  return (
    <>
      <FlatList
        columnWrapperStyle={products.length > 0 ? styles.productRow : undefined}
        contentContainerStyle={styles.listContent}
        data={products}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        keyExtractor={(product) => String(product.id)}
        ListEmptyComponent={emptyContent}
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
              <Text style={styles.endText}>Bạn đã xem hết kết quả</Text>
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
        initialValues={filters}
        onApply={(values) => {
          setFilters(values);
          setFilterVisible(false);
        }}
        onClose={() => setFilterVisible(false)}
        onReset={() => {
          setFilters({});
          setFilterVisible(false);
        }}
        visible={filterVisible}
      />
      <ProductSortModal
        onClose={() => setSortVisible(false)}
        onSelect={(value) => {
          setSort(value);
          setSortVisible(false);
        }}
        selected={sort}
        visible={sortVisible}
      />
    </>
  );
}

const styles = StyleSheet.create({
  listContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.md,
    paddingBottom: spacing.huge,
    backgroundColor: colors.background,
  },
  headerContent: { paddingTop: spacing.xs },
  inlineError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    marginTop: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.dangerSoft,
  },
  inlineErrorText: { ...typography.caption, flex: 1, color: colors.danger },
  retryText: { ...typography.captionSemibold, color: colors.danger },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginVertical: spacing.lg,
  },
  resultCount: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  totalText: { ...typography.bodySmallSemibold, color: colors.textPrimary },
  sortButton: {
    minHeight: 40,
    maxWidth: 172,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    borderRadius: radius.round,
    backgroundColor: colors.primarySoft,
  },
  sortButtonText: { ...typography.captionSemibold, flexShrink: 1, color: colors.primary },
  pressed: { opacity: 0.68 },
  productRow: { gap: spacing.md, marginBottom: spacing.md },
  productCard: { flex: 1, maxWidth: '48%' },
  skeletonGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  skeletonCard: { width: '48%' },
  footer: { minHeight: 64, alignItems: 'center', justifyContent: 'center', padding: spacing.md },
  loadMoreError: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  loadMoreErrorText: { ...typography.caption, flexShrink: 1, color: colors.danger },
  endText: { ...typography.caption, color: colors.textMuted },
});
