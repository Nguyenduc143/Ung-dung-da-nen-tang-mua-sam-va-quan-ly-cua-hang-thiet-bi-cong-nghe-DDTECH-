import { StyleSheet, View } from 'react-native';

import { LoadingSkeleton } from '@/components';
import { radius, spacing } from '@/theme';

export function ProductListSkeleton() {
  return (
    <View style={styles.container}>
      <LoadingSkeleton borderRadius={radius.round} height={44} />
      <View style={styles.toolbar}>
        <LoadingSkeleton height={22} width={105} />
        <LoadingSkeleton borderRadius={radius.round} height={40} width={125} />
      </View>
      <View style={styles.grid}>
        {[0, 1, 2, 3, 4, 5].map((item) => (
          <LoadingSkeleton borderRadius={radius.lg} height={300} key={item} style={styles.card} />
        ))}
      </View>
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
