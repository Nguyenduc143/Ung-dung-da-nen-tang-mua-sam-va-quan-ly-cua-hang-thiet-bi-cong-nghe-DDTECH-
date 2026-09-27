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

import { colors, fontWeights, radius, shadows, spacing, typography } from '@/theme';
import type { IoniconName } from './iconTypes';

export interface CategoryCardProps {
  name: string;
  onPress: () => void;
  icon?: IoniconName;
  imageSource?: ImageSourcePropType;
  selected?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function CategoryCard({
  name,
  onPress,
  icon = 'grid-outline',
  imageSource,
  selected = false,
  style,
}: CategoryCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [styles.container, pressed && styles.pressed, style]}
    >
      <View style={[styles.visual, selected && styles.selectedVisual]}>
        {imageSource ? (
          <Image resizeMode="contain" source={imageSource} style={styles.image} />
        ) : (
          <Ionicons color={selected ? colors.textInverse : colors.textPrimary} name={icon} size={30} />
        )}
      </View>
      <Text numberOfLines={2} style={[styles.name, selected && styles.selectedName]}>{name}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { width: 88, alignItems: 'center', gap: spacing.sm },
  pressed: { opacity: 0.72 },
  visual: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    ...shadows.card,
  },
  selectedVisual: { backgroundColor: colors.primary, borderColor: colors.primary },
  image: { width: '74%', height: '74%' },
  name: { ...typography.bodySmall, color: colors.textPrimary, textAlign: 'center' },
  selectedName: { color: colors.primary, fontWeight: fontWeights.semibold },
});
