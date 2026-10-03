import { StyleSheet, View } from 'react-native';

import { radius, spacing } from '@/theme';
import { LoadingSkeleton } from './LoadingSkeleton';

export interface ProductGridSkeletonProps {
  count?: number;
}

export function ProductGridSkeleton({ count = 6 }: ProductGridSkeletonProps) {
  return (
    <View style={styles.grid}>
      {Array.from({ length: count }, (_, index) => (
        <LoadingSkeleton borderRadius={radius.lg} height={300} key={index} style={styles.card} />
      ))}
    </View>
  );
}

export function ProductListSkeleton() {
  return (
    <View style={styles.container}>
      <LoadingSkeleton borderRadius={radius.round} height={44} />
      <View style={styles.toolbar}>
        <LoadingSkeleton height={22} width={105} />
        <LoadingSkeleton borderRadius={radius.round} height={40} width={125} />
      </View>
      <ProductGridSkeleton />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.screen },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: spacing.xl,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  card: { width: '48%' },
});
