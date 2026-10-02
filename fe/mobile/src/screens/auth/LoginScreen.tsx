import { useEffect, useRef, useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Keyboard, Pressable, StyleSheet, Text, TextInput } from 'react-native';

import { getApiValidationErrors } from '@/api/axiosClient';
import { PrimaryButton, TextInputField } from '@/components';
import type { AuthStackParamList } from '@/navigation/types';
import { useAuthStore } from '@/stores';
import { colors, spacing, typography } from '@/theme';
import {
  pickApiFieldErrors,
  toLoginInput,
  validateLoginForm,
  type FormErrors,
  type LoginFormValues,
} from '@/utils';
import { AuthMessage } from './components/AuthMessage';
import { AuthScreenLayout } from './components/AuthScreenLayout';
import { AuthSwitchLink } from './components/AuthSwitchLink';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

const loginFields = ['email', 'password'] as const;

export function LoginScreen({ navigation, route }: Props) {
  const registeredEmail = route.params?.registeredEmail;
  const [values, setValues] = useState<LoginFormValues>({
    email: registeredEmail ?? '',
    password: '',
  });
  const [fieldErrors, setFieldErrors] = useState<FormErrors<LoginFormValues>>({});
  const [hasApiFieldErrors, setHasApiFieldErrors] = useState(false);
  const [showSuccess, setShowSuccess] = useState(Boolean(registeredEmail));
  const passwordRef = useRef<TextInput>(null);

  const login = useAuthStore((state) => state.login);
  const isSubmitting = useAuthStore((state) => state.isSubmitting);
  const error = useAuthStore((state) => state.error);
  const clearError = useAuthStore((state) => state.clearError);

  useEffect(() => {
    clearError();
    return clearError;
  }, [clearError]);

  const updateField = (field: keyof LoginFormValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
    setHasApiFieldErrors(false);
    setShowSuccess(false);
    clearError();
  };

  const handleSubmit = async () => {
    Keyboard.dismiss();
    const validationErrors = validateLoginForm(values);
    setFieldErrors(validationErrors);
    setHasApiFieldErrors(false);
    clearError();

    if (Object.keys(validationErrors).length > 0) return;

    try {
      await login(toLoginInput(values));
    } catch (requestError) {
      const apiFieldErrors = pickApiFieldErrors(
        getApiValidationErrors(requestError),
        loginFields,
      );
      setFieldErrors(apiFieldErrors);
      setHasApiFieldErrors(Object.keys(apiFieldErrors).length > 0);
    }
  };

  return (
    <AuthScreenLayout
      footer={(
        <AuthSwitchLink
          disabled={isSubmitting}
          label="Chưa có tài khoản?"
          linkLabel="Đăng ký ngay"
          onPress={() => navigation.navigate('Register')}
        />
      )}
      subtitle="Đăng nhập để tiếp tục mua sắm cùng DDTECH"
      title="Chào mừng trở lại"
    >
      {showSuccess ? (
        <AuthMessage
          message={route.params?.passwordReset
            ? 'Đặt lại mật khẩu thành công. Hãy đăng nhập bằng mật khẩu mới.'
            : 'Đăng ký thành công. Hãy đăng nhập để bắt đầu mua sắm.'}
          tone="success"
        />
      ) : null}
      {error && !hasApiFieldErrors ? <AuthMessage message={error} /> : null}

      <TextInputField
        autoCapitalize="none"
        autoComplete="email"
        autoCorrect={false}
        blurOnSubmit={false}
        containerStyle={styles.field}
        editable={!isSubmitting}
        error={fieldErrors.email}
        keyboardType="email-address"
        label="Email"
        leftIcon="mail-outline"
        maxLength={191}
        onChangeText={(value) => updateField('email', value)}
        onSubmitEditing={() => passwordRef.current?.focus()}
        placeholder="example@email.com"
        required
        returnKeyType="next"
        textContentType="emailAddress"
        value={values.email}
      />
      <TextInputField
        autoCapitalize="none"
        autoComplete="current-password"
        containerStyle={styles.field}
        editable={!isSubmitting}
        error={fieldErrors.password}
        isPassword
        label="Mật khẩu"
        leftIcon="lock-closed-outline"
        maxLength={72}
        onChangeText={(value) => updateField('password', value)}
        onSubmitEditing={() => void handleSubmit()}
        placeholder="Nhập mật khẩu"
        ref={passwordRef}
        required
        returnKeyType="done"
        textContentType="password"
        value={values.password}
      />
      <Pressable
        accessibilityRole="button"
        disabled={isSubmitting}
        hitSlop={8}
        onPress={() => navigation.navigate('ForgotPassword')}
        style={({ pressed }) => [styles.forgotLink, pressed && styles.pressed]}
      >
        <Text style={styles.forgotText}>Quên mật khẩu?</Text>
      </Pressable>
      <PrimaryButton
        loading={isSubmitting}
        onPress={() => void handleSubmit()}
        style={styles.submitButton}
        title="Đăng nhập"
      />
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  field: { marginBottom: spacing.lg },
  forgotLink: { alignSelf: 'flex-end', marginTop: -spacing.sm, marginBottom: spacing.md },
  forgotText: { ...typography.bodySmallSemibold, color: colors.primary },
  pressed: { opacity: 0.65 },
  submitButton: { marginTop: spacing.xs },
});
