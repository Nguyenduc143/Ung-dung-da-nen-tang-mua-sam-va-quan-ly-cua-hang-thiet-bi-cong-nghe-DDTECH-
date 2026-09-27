import { StyleSheet, View } from 'react-native';

import { LoadingSkeleton } from '@/components';
import { radius, spacing } from '@/theme';

export function CatalogLoadingState() {
  return (
    <View style={styles.container}>
      <LoadingSkeleton borderRadius={radius.lg} height={52} />
      <LoadingSkeleton borderRadius={radius.round} height={48} style={styles.tabs} />
      <LoadingSkeleton height={28} style={styles.heading} width={155} />
      <View style={styles.grid}>
        {[0, 1, 2, 3, 4, 5].map((item) => (
          <View key={item} style={styles.item}>
            <LoadingSkeleton borderRadius={radius.lg} height={72} width={72} />
            <LoadingSkeleton height={16} style={styles.label} width={72} />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.screen },
  tabs: { marginTop: spacing.lg },
  heading: { marginTop: spacing.xxxl },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xl, marginTop: spacing.lg },
  item: { alignItems: 'center' },
  label: { marginTop: spacing.sm },
});
