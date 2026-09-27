import { forwardRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';

import { colors, radius, spacing, typography } from '@/theme';
import type { IoniconName } from './iconTypes';

export interface TextInputFieldProps extends Omit<TextInputProps, 'style'> {
  containerStyle?: StyleProp<ViewStyle>;
  error?: string;
  helperText?: string;
  isPassword?: boolean;
  label?: string;
  leftIcon?: IoniconName;
  required?: boolean;
}

export const TextInputField = forwardRef<TextInput, TextInputFieldProps>(function TextInputField(
  {
    containerStyle,
    editable = true,
    error,
    helperText,
    isPassword = false,
    label,
    leftIcon,
    onBlur,
    onFocus,
    required = false,
    secureTextEntry,
    ...inputProps
  },
  ref,
) {
  const [focused, setFocused] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const shouldHidePassword = isPassword ? !passwordVisible : secureTextEntry;

  return (
    <View style={containerStyle}>
      {label ? (
        <Text style={styles.label}>
          {label}{required ? <Text style={styles.required}> *</Text> : null}
        </Text>
      ) : null}
      <View
        style={[
          styles.field,
          focused && styles.focused,
          Boolean(error) && styles.errorField,
          !editable && styles.disabled,
        ]}
      >
        {leftIcon ? <Ionicons color={colors.textSecondary} name={leftIcon} size={22} /> : null}
        <TextInput
          accessibilityLabel={inputProps.accessibilityLabel ?? label}
          editable={editable}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          placeholderTextColor={colors.textMuted}
          ref={ref}
          secureTextEntry={shouldHidePassword}
          style={styles.input}
          {...inputProps}
        />
        {isPassword ? (
          <Pressable
            accessibilityLabel={passwordVisible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => setPasswordVisible((visible) => !visible)}
          >
            <Ionicons
              color={colors.textSecondary}
              name={passwordVisible ? 'eye-off-outline' : 'eye-outline'}
              size={22}
            />
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {!error && helperText ? <Text style={styles.helperText}>{helperText}</Text> : null}
    </View>
  );
});

const styles = StyleSheet.create({
  label: { ...typography.bodySmallSemibold, color: colors.textPrimary, marginBottom: spacing.sm },
  required: { color: colors.primary },
  field: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  focused: { borderColor: colors.primary },
  errorField: { borderColor: colors.danger },
  disabled: { backgroundColor: colors.disabledBackground, opacity: 0.72 },
  input: { ...typography.body, flex: 1, color: colors.textPrimary, paddingVertical: spacing.md },
  helperText: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs },
  errorText: { ...typography.caption, color: colors.danger, marginTop: spacing.xs },
});
