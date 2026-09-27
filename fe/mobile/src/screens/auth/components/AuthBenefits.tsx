import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '@/theme';
import type { IoniconName } from '@/components';

interface Benefit {
  icon: IoniconName;
  title: string;
  description: string;
}

const benefits: Benefit[] = [
  { icon: 'shield-checkmark-outline', title: 'Chính hãng', description: 'Sản phẩm uy tín' },
  { icon: 'rocket-outline', title: 'Giao hàng nhanh', description: 'Trên toàn quốc' },
  { icon: 'headset-outline', title: 'Tận tâm', description: 'Hỗ trợ khách hàng' },
];

export function AuthBenefits() {
  return (
    <View accessibilityLabel="Quyền lợi mua sắm tại DDTECH" style={styles.container}>
      {benefits.map((benefit) => (
        <View key={benefit.title} style={styles.item}>
          <View style={styles.iconContainer}>
            <Ionicons color={colors.primary} name={benefit.icon} size={22} />
          </View>
          <Text numberOfLines={1} style={styles.title}>{benefit.title}</Text>
          <Text numberOfLines={1} style={styles.description}>{benefit.description}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginTop: spacing.xxxl,
    gap: spacing.sm,
  },
  item: { flex: 1, alignItems: 'center' },
  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
    marginBottom: spacing.sm,
  },
  title: { ...typography.captionSemibold, color: colors.textPrimary, textAlign: 'center' },
  description: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 10,
    textAlign: 'center',
  },
});
