import { Ionicons } from '@expo/vector-icons';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ImageSourcePropType,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { colors, radius, shadows, spacing, typography } from '@/theme';

export interface BrandCardProps {
  name: string;
  onPress: () => void;
  description?: string | null;
  imageSource?: ImageSourcePropType;
  style?: StyleProp<ViewStyle>;
}

export function BrandCard({
  description,
  imageSource,
  name,
  onPress,
  style,
}: BrandCardProps) {
  return (
    <Pressable
      accessibilityLabel={`Xem sản phẩm thương hiệu ${name}`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.container, pressed && styles.pressed, style]}
    >
      <View style={styles.logoContainer}>
        {imageSource ? (
          <Image resizeMode="contain" source={imageSource} style={styles.logo} />
        ) : (
          <Ionicons color={colors.textMuted} name="business-outline" size={34} />
        )}
      </View>
      <Text numberOfLines={1} style={styles.name}>{name}</Text>
      {description ? (
        <Text numberOfLines={2} style={styles.description}>{description}</Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 148,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    ...shadows.card,
  },
  pressed: { opacity: 0.72 },
  logoContainer: {
    height: 66,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
  },
  logo: { width: '78%', height: '70%' },
  name: { ...typography.bodySmallSemibold, color: colors.textPrimary, marginTop: spacing.md },
  description: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs },
});
