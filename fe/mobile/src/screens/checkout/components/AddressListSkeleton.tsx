import { StyleSheet, View } from 'react-native';

import { LoadingSkeleton } from '@/components';
import { radius, spacing } from '@/theme';

export function AddressListSkeleton() {
  return (
    <View style={styles.container}>
      <LoadingSkeleton borderRadius={radius.md} height={52} />
      {[0, 1, 2].map((item) => (
        <LoadingSkeleton borderRadius={radius.lg} height={210} key={item} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.lg, padding: spacing.screen },
});
