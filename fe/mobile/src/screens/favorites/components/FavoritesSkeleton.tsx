import { StyleSheet, View } from 'react-native';

import { LoadingSkeleton } from '@/components';
import { radius, spacing } from '@/theme';

export function FavoritesSkeleton() {
  return (
    <View style={styles.container}>
      <LoadingSkeleton height={20} width={145} />
      {[0, 1, 2].map((item) => (
        <LoadingSkeleton borderRadius={radius.lg} height={224} key={item} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.lg, padding: spacing.screen },
});
