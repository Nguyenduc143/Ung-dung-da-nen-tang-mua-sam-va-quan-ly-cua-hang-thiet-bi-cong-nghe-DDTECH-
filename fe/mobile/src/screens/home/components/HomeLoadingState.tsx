import { StyleSheet, View } from 'react-native';

import { LoadingSkeleton } from '@/components';
import { radius, spacing } from '@/theme';

export function HomeLoadingState() {
  return (
    <View style={styles.container}>
      <LoadingSkeleton borderRadius={radius.lg} height={52} />
      <LoadingSkeleton borderRadius={radius.xl} height={224} style={styles.banner} />
      <LoadingSkeleton height={28} width={150} />
      <View style={styles.categories}>
        {[0, 1, 2, 3].map((item) => (
          <LoadingSkeleton borderRadius={radius.lg} height={72} key={item} width={72} />
        ))}
      </View>
      <LoadingSkeleton height={28} style={styles.sectionTitle} width={190} />
      <View style={styles.products}>
        <LoadingSkeleton borderRadius={radius.lg} height={292} width={188} />
        <LoadingSkeleton borderRadius={radius.lg} height={292} width={188} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: spacing.screen, paddingBottom: spacing.xxxl },
  banner: { marginTop: spacing.lg, marginBottom: spacing.xxxl },
  categories: { flexDirection: 'row', gap: spacing.lg, marginTop: spacing.lg },
  sectionTitle: { marginTop: spacing.xxxl },
  products: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
});
