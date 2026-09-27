import { ScrollView, StyleSheet, View } from 'react-native';

import { LoadingSkeleton } from '@/components';
import { colors, spacing } from '@/theme';

export function ProductDetailSkeleton() {
  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <LoadingSkeleton borderRadius={0} height={330} />
      <View style={styles.section}>
        <LoadingSkeleton height={28} width="90%" />
        <LoadingSkeleton height={20} width="48%" />
        <LoadingSkeleton height={32} width="55%" />
        <LoadingSkeleton height={48} />
      </View>
      <View style={styles.section}>
        <LoadingSkeleton height={24} width="44%" />
        <LoadingSkeleton height={92} />
      </View>
      <View style={styles.section}>
        <LoadingSkeleton height={24} width="52%" />
        <LoadingSkeleton height={140} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.md, paddingBottom: spacing.huge, backgroundColor: colors.background },
  section: { gap: spacing.lg, padding: spacing.screen, backgroundColor: colors.surface },
});
