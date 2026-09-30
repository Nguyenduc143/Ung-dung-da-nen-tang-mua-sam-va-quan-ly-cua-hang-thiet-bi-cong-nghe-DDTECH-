import { StyleSheet, View } from 'react-native';

import { colors, radius, spacing } from '@/theme';
import { LoadingSkeleton } from './LoadingSkeleton';

export type ListSkeletonVariant = 'default' | 'notification' | 'order';

export interface ListSkeletonProps {
  count?: number;
  variant?: ListSkeletonVariant;
}

export function ListSkeleton({ count = 4, variant = 'default' }: ListSkeletonProps) {
  return (
    <View style={[styles.list, variant === 'notification' && styles.notificationList]}>
      {Array.from({ length: count }, (_, index) => (
        variant === 'order' ? (
          <View key={index} style={styles.orderCard}>
            <View style={styles.orderHeader}>
              <View style={styles.textGroup}>
                <LoadingSkeleton height={18} width="55%" />
                <LoadingSkeleton height={14} width="72%" />
              </View>
              <LoadingSkeleton borderRadius={radius.round} height={28} width={92} />
            </View>
            <View style={styles.row}>
              <LoadingSkeleton borderRadius={radius.md} height={92} width={92} />
              <View style={styles.textGroup}>
                <LoadingSkeleton height={18} width="82%" />
                <LoadingSkeleton height={14} width="62%" />
                <LoadingSkeleton height={14} width="28%" />
              </View>
            </View>
            <LoadingSkeleton height={18} width="46%" />
          </View>
        ) : (
          <View key={index} style={[styles.rowItem, variant === 'notification' && styles.notificationRow]}>
            <LoadingSkeleton borderRadius={radius.md} height={50} width={50} />
            <View style={styles.textGroup}>
              <LoadingSkeleton height={16} width="58%" />
              <LoadingSkeleton height={14} width="92%" />
              <LoadingSkeleton height={14} width="70%" />
            </View>
          </View>
        )
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.screen, gap: spacing.lg },
  notificationList: { padding: 0, paddingTop: spacing.lg, gap: 0 },
  rowItem: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
  },
  notificationRow: { borderRadius: 0, borderBottomWidth: 1, borderBottomColor: colors.divider },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  textGroup: { flex: 1, gap: spacing.sm },
  orderCard: {
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    gap: spacing.lg,
  },
  orderHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
});
