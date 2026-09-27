import { useMemo, useState } from 'react';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { BrandCard, CategoryCard, EmptyState, ErrorState, SearchBar } from '@/components';
import { useCatalogData } from '@/hooks';
import type { CustomerStackParamList, MainTabParamList } from '@/navigation/types';
import { colors, radius, spacing, typography } from '@/theme';
import type { Brand, Category } from '@/types';
import { CatalogLoadingState } from './components/CatalogLoadingState';
import { CategoryTree } from './components/CategoryTree';

type Props = BottomTabScreenProps<MainTabParamList, 'CategoriesTab'>;
type CatalogTab = 'categories' | 'brands';

const normalizeSearch = (value: string): string => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/đ/g, 'd')
  .replace(/Đ/g, 'D')
  .toLowerCase()
  .trim();

const includesQuery = (
  item: Pick<Category | Brand, 'description' | 'name'>,
  query: string,
): boolean => normalizeSearch(`${item.name} ${item.description ?? ''}`).includes(query);

export function CategoryScreen({ navigation }: Props) {
  const rootNavigation = navigation.getParent<NativeStackNavigationProp<CustomerStackParamList>>();
  const [activeTab, setActiveTab] = useState<CatalogTab>('categories');
  const [searchValue, setSearchValue] = useState('');
  const {
    brands,
    categories,
    error,
    isLoading,
    isRefreshing,
    reload,
    refresh,
  } = useCatalogData();

  const query = normalizeSearch(searchValue);
  const filteredCategories = useMemo(
    () => query ? categories.filter((category) => includesQuery(category, query)) : categories,
    [categories, query],
  );
  const filteredBrands = useMemo(
    () => query ? brands.filter((brand) => includesQuery(brand, query)) : brands,
    [brands, query],
  );
  const hasData = categories.length > 0 || brands.length > 0;

  const openCategory = (category: Category) => {
    rootNavigation?.navigate('ProductList', {
      category: category.slug,
      title: category.name,
    });
  };

  const openBrand = (brand: Brand) => {
    rootNavigation?.navigate('ProductList', {
      brand: brand.slug,
      title: brand.name,
    });
  };

  if (isLoading && !hasData) return <CatalogLoadingState />;

  if (error && !hasData) {
    return (
      <ErrorState
        description={error}
        onRetry={() => void reload()}
        style={styles.fullState}
        title="Không thể tải danh mục"
      />
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      keyboardDismissMode="on-drag"
      keyboardShouldPersistTaps="handled"
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
      {error ? (
        <View accessibilityRole="alert" style={styles.inlineError}>
          <Text numberOfLines={2} style={styles.inlineErrorText}>{error}</Text>
          <Pressable hitSlop={8} onPress={() => void reload()}>
            <Text style={styles.retryText}>Thử lại</Text>
          </Pressable>
        </View>
      ) : null}

      <SearchBar
        onChangeText={setSearchValue}
        placeholder="Tìm danh mục hoặc thương hiệu..."
        value={searchValue}
      />

      <View accessibilityRole="tablist" style={styles.tabs}>
        <Pressable
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'categories' }}
          onPress={() => setActiveTab('categories')}
          style={({ pressed }) => [
            styles.tab,
            activeTab === 'categories' && styles.activeTab,
            pressed && styles.pressed,
          ]}
        >
          <Text style={[styles.tabText, activeTab === 'categories' && styles.activeTabText]}>
            Danh mục ({categories.length})
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === 'brands' }}
          onPress={() => setActiveTab('brands')}
          style={({ pressed }) => [
            styles.tab,
            activeTab === 'brands' && styles.activeTab,
            pressed && styles.pressed,
          ]}
        >
          <Text style={[styles.tabText, activeTab === 'brands' && styles.activeTabText]}>
            Thương hiệu ({brands.length})
          </Text>
        </Pressable>
      </View>

      {activeTab === 'categories' ? (
        filteredCategories.length > 0 ? (
          query ? (
            <View>
              <Text style={styles.resultHeading}>Kết quả danh mục</Text>
              <View style={styles.categoryGrid}>
                {filteredCategories.map((category) => (
                  <CategoryCard
                    imageSource={category.imageUrl ? { uri: category.imageUrl } : undefined}
                    key={category.id}
                    name={category.name}
                    onPress={() => openCategory(category)}
                    style={styles.categoryCard}
                  />
                ))}
              </View>
            </View>
          ) : (
            <CategoryTree categories={categories} onCategoryPress={openCategory} />
          )
        ) : (
          <EmptyState
            description={query
              ? `Không có danh mục phù hợp với “${searchValue.trim()}”.`
              : 'Danh mục sẽ xuất hiện khi quản trị viên thêm dữ liệu.'}
            icon="grid-outline"
            title={query ? 'Không tìm thấy danh mục' : 'Chưa có danh mục'}
          />
        )
      ) : filteredBrands.length > 0 ? (
        <View>
          <Text style={styles.resultHeading}>
            {query ? 'Kết quả thương hiệu' : 'Tất cả thương hiệu'}
          </Text>
          <View style={styles.brandGrid}>
            {filteredBrands.map((brand) => (
              <BrandCard
                description={brand.description}
                imageSource={brand.logoUrl ? { uri: brand.logoUrl } : undefined}
                key={brand.id}
                name={brand.name}
                onPress={() => openBrand(brand)}
                style={styles.brandCard}
              />
            ))}
          </View>
        </View>
      ) : (
        <EmptyState
          description={query
            ? `Không có thương hiệu phù hợp với “${searchValue.trim()}”.`
            : 'Thương hiệu sẽ xuất hiện khi quản trị viên thêm dữ liệu.'}
          icon="business-outline"
          title={query ? 'Không tìm thấy thương hiệu' : 'Chưa có thương hiệu'}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.md,
    paddingBottom: spacing.huge,
  },
  fullState: { flex: 1, backgroundColor: colors.background },
  inlineError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.dangerSoft,
  },
  inlineErrorText: { ...typography.caption, flex: 1, color: colors.danger },
  retryText: { ...typography.captionSemibold, color: colors.danger },
  tabs: {
    flexDirection: 'row',
    padding: spacing.xs,
    borderRadius: radius.round,
    backgroundColor: colors.surfaceMuted,
    marginVertical: spacing.xl,
  },
  tab: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.round,
  },
  activeTab: { backgroundColor: colors.primary },
  tabText: { ...typography.bodySmallSemibold, color: colors.textSecondary },
  activeTabText: { color: colors.textInverse },
  pressed: { opacity: 0.72 },
  resultHeading: { ...typography.titleSmall, color: colors.textPrimary, marginBottom: spacing.lg },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  categoryCard: { width: '30%' },
  brandGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  brandCard: { width: '48%' },
});
