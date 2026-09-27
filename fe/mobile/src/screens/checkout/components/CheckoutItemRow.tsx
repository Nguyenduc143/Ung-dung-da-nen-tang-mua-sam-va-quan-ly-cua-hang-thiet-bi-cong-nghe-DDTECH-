import { Ionicons } from '@expo/vector-icons';
import { Image, StyleSheet, Text, View } from 'react-native';

import { PriceDisplay } from '@/components';
import { colors, radius, spacing, typography } from '@/theme';
import type { CartItem } from '@/types';

interface CheckoutItemRowProps {
  item: CartItem;
}

export function CheckoutItemRow({ item }: CheckoutItemRowProps) {
  return (
    <View style={styles.row}>
      <View style={styles.imageBox}>
        {item.imageUrl ? (
          <Image resizeMode="contain" source={{ uri: item.imageUrl }} style={styles.image} />
        ) : (
          <Ionicons color={colors.textMuted} name="image-outline" size={30} />
        )}
      </View>
      <View style={styles.content}>
        <Text numberOfLines={2} style={styles.name}>{item.product.name}</Text>
        {item.variant ? (
          <Text numberOfLines={1} style={styles.variant}>{item.variant.variantName}</Text>
        ) : null}
        <View style={styles.footer}>
          <Text style={styles.quantity}>x{item.quantity}</Text>
          <PriceDisplay direction="row" price={item.lineTotal} size="small" />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.md },
  imageBox: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
  },
  image: { width: '90%', height: '90%' },
  content: { flex: 1, minHeight: 72 },
  name: { ...typography.bodySmallSemibold, color: colors.textPrimary },
  variant: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs },
  footer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  quantity: { ...typography.bodySmall, color: colors.textSecondary },
});
