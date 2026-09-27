import { FlatList, StyleSheet, Text, View } from 'react-native';

import { ProductCard } from '@/components';
import { colors, radius, spacing, typography } from '@/theme';
import type { ProductListItem } from '@/types';
import {
  getProductDiscountPercent,
  getProductImageSource,
  getProductOriginalPrice,
  getProductPrice,
} from '@/utils';
import { HomeSectionHeader } from './HomeSectionHeader';

interface HomeProductSectionProps {
  emptyMessage: string;
  products: ProductListItem[];
  title: string;
  badgeFallback?: string;
  onProductPress: (product: ProductListItem) => void;
  favoriteProductIds: ReadonlySet<number>;
  updatingFavoriteIds: ReadonlySet<number>;
  onToggleFavorite: (productId: number) => void;
  onSeeAll?: () => void;
}

export function HomeProductSection({
  badgeFallback,
  emptyMessage,
  favoriteProductIds,
  products,
  title,
  onProductPress,
  onToggleFavorite,
  onSeeAll,
  updatingFavoriteIds,
}: HomeProductSectionProps) {
  return (
    <View style={styles.section}>
      <HomeSectionHeader onAction={onSeeAll} title={title} />
      {products.length > 0 ? (
        <FlatList
          contentContainerStyle={styles.listContent}
          data={products}
          horizontal
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          keyExtractor={(product) => String(product.id)}
          renderItem={({ item }) => {
            const discount = getProductDiscountPercent(item);
            return (
              <ProductCard
                badgeText={discount > 0 ? `-${discount}%` : badgeFallback}
                imageSource={getProductImageSource(item)}
                isFavorite={favoriteProductIds.has(item.id)}
                isTogglingFavorite={updatingFavoriteIds.has(item.id)}
                name={item.name}
                onPress={() => onProductPress(item)}
                onToggleFavorite={() => onToggleFavorite(item.id)}
                originalPrice={getProductOriginalPrice(item)}
                price={getProductPrice(item)}
                rating={item.ratingAvg}
                soldCount={item.soldCount}
                style={styles.card}
              />
            );
          }}
          showsHorizontalScrollIndicator={false}
        />
      ) : (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>{emptyMessage}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: spacing.xxxl },
  listContent: { paddingHorizontal: spacing.screen, paddingBottom: spacing.sm },
  separator: { width: spacing.md },
  card: { width: 188, flex: 0 },
  empty: {
    marginHorizontal: spacing.screen,
    padding: spacing.xl,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
  },
  emptyText: { ...typography.bodySmall, color: colors.textSecondary, textAlign: 'center' },
});
