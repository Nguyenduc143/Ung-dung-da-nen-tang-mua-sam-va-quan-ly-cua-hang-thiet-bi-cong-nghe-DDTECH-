import { Ionicons } from '@expo/vector-icons';
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';

import { colors, radius, spacing, typography } from '@/theme';

export interface SearchBarProps extends Omit<TextInputProps, 'style'> {
  onFilterPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function SearchBar({
  onChangeText,
  onFilterPress,
  placeholder = 'Tìm sản phẩm...',
  style,
  value,
  ...inputProps
}: SearchBarProps) {
  return (
    <View style={[styles.container, style]}>
      <Ionicons color={colors.textSecondary} name="search-outline" size={24} />
      <TextInput
        accessibilityLabel="Tìm kiếm sản phẩm"
        autoCapitalize="none"
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        returnKeyType="search"
        style={styles.input}
        value={value}
        {...inputProps}
      />
      {value ? (
        <Pressable
          accessibilityLabel="Xóa nội dung tìm kiếm"
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => onChangeText?.('')}
        >
          <Ionicons color={colors.textMuted} name="close-circle" size={20} />
        </Pressable>
      ) : null}
      {onFilterPress ? (
        <Pressable
          accessibilityLabel="Mở bộ lọc"
          accessibilityRole="button"
          hitSlop={8}
          onPress={onFilterPress}
          style={({ pressed }) => [styles.filterButton, pressed && styles.pressed]}
        >
          <Ionicons color={colors.primary} name="options-outline" size={22} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  input: { ...typography.body, flex: 1, color: colors.textPrimary, paddingVertical: spacing.md },
  filterButton: {
    width: 36,
    height: 36,
    marginRight: -spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
  },
  pressed: { opacity: 0.7 },
});
