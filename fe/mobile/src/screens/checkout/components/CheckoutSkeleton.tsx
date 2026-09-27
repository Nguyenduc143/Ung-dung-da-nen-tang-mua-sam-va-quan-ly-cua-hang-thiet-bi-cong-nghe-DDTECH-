import { ScrollView, StyleSheet, View } from 'react-native';

import { LoadingSkeleton } from '@/components';
import { colors, radius, spacing } from '@/theme';

export function CheckoutSkeleton() {
  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {[150, 210, 180, 130].map((height) => (
        <View key={height} style={[styles.card, { height }]}>
          <LoadingSkeleton height={20} width="55%" />
          <LoadingSkeleton height={14} width="90%" />
          <LoadingSkeleton height={14} width="70%" />
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.screen, gap: spacing.lg },
  card: {
    gap: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
  },
});
