import { useMemo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { CategoryCard } from '@/components';
import { colors, radius, spacing, typography } from '@/theme';
import type { Category } from '@/types';

interface CategoryNode extends Category {
  children: CategoryNode[];
}

interface CategoryTreeProps {
  categories: Category[];
  onCategoryPress: (category: Category) => void;
}

const buildCategoryTree = (categories: Category[]): CategoryNode[] => {
  const nodes = new Map<number, CategoryNode>();
  categories.forEach((category) => nodes.set(category.id, { ...category, children: [] }));

  const roots: CategoryNode[] = [];
  nodes.forEach((node) => {
    const parent = node.parentId === null ? undefined : nodes.get(node.parentId);
    if (parent && parent.id !== node.id) parent.children.push(node);
    else roots.push(node);
  });
  return roots;
};

function ChildCategoryRow({
  depth,
  node,
  onPress,
}: {
  depth: number;
  node: CategoryNode;
  onPress: (category: Category) => void;
}) {
  return (
    <>
      <Pressable
        accessibilityLabel={`Xem sản phẩm ${node.name}`}
        accessibilityRole="button"
        onPress={() => onPress(node)}
        style={({ pressed }) => [
          styles.childRow,
          { marginLeft: Math.min(depth, 3) * spacing.lg },
          pressed && styles.pressed,
        ]}
      >
        <View style={styles.childImageContainer}>
          {node.imageUrl ? (
            <Image resizeMode="contain" source={{ uri: node.imageUrl }} style={styles.childImage} />
          ) : (
            <Ionicons color={colors.textSecondary} name="grid-outline" size={24} />
          )}
        </View>
        <View style={styles.childContent}>
          <Text numberOfLines={1} style={styles.childName}>{node.name}</Text>
          {node.description ? (
            <Text numberOfLines={1} style={styles.childDescription}>{node.description}</Text>
          ) : null}
        </View>
        <Ionicons color={colors.textMuted} name="chevron-forward" size={20} />
      </Pressable>
      {node.children.map((child) => (
        <ChildCategoryRow
          depth={depth + 1}
          key={child.id}
          node={child}
          onPress={onPress}
        />
      ))}
    </>
  );
}

export function CategoryTree({ categories, onCategoryPress }: CategoryTreeProps) {
  const roots = useMemo(() => buildCategoryTree(categories), [categories]);
  const rootsWithChildren = roots.filter((root) => root.children.length > 0);

  return (
    <>
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

      {rootsWithChildren.length > 0 ? (
        <View style={styles.childrenSection}>
          <Text style={styles.heading}>Danh mục con</Text>
          {rootsWithChildren.map((root) => (
            <View key={root.id} style={styles.childGroup}>
              <Text style={styles.groupTitle}>{root.name}</Text>
              {root.children.map((child) => (
                <ChildCategoryRow
                  depth={0}
                  key={child.id}
                  node={child}
                  onPress={onCategoryPress}
                />
              ))}
            </View>
          ))}
        </View>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  heading: { ...typography.titleSmall, color: colors.textPrimary, marginBottom: spacing.lg },
  parentGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  parentCard: { width: '30%' },
  childrenSection: { marginTop: spacing.xxxl },
  childGroup: { marginBottom: spacing.xl },
  groupTitle: {
    ...typography.bodySmallSemibold,
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  childRow: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.divider,
  },
  pressed: { opacity: 0.65 },
  childImageContainer: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
  },
  childImage: { width: '78%', height: '78%' },
  childContent: { flex: 1 },
  childName: { ...typography.bodySmallSemibold, color: colors.textPrimary },
  childDescription: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xxs },
});
