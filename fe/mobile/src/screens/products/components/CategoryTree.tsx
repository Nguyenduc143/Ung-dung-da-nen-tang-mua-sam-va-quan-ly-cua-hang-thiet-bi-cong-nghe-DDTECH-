import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { CategoryCard } from '@/components';
import { colors, spacing, typography } from '@/theme';
import type { Category } from '@/types';

interface CategoryTreeProps {
  categories: Category[];
  onCategoryPress: (category: Category) => void;
}

export function CategoryTree({ categories, onCategoryPress }: CategoryTreeProps) {
  const roots = useMemo(
    () => categories.filter((category) => category.parentId === null),
    [categories],
  );

  return (
    <View>
      <Text style={styles.heading}>Danh mục sản phẩm</Text>
      <View style={styles.parentGrid}>
        {roots.map((category) => (
          <CategoryCard
            imageSource={category.imageUrl ? { uri: category.imageUrl } : undefined}
            key={category.id}
            name={category.name}
            onPress={() => onCategoryPress(category)}
            style={styles.parentCard}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  heading: { ...typography.titleSmall, color: colors.textPrimary, marginBottom: spacing.lg },
  parentGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  parentCard: { width: '30%' },
});
