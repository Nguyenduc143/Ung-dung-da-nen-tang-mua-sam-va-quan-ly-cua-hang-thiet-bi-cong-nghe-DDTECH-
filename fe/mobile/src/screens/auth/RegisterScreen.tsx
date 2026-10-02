import { useEffect, useRef, useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Keyboard, StyleSheet, TextInput } from 'react-native';

import { getApiValidationErrors } from '@/api/axiosClient';
import { PrimaryButton, TextInputField } from '@/components';
import type { AuthStackParamList } from '@/navigation/types';
import { useAuthStore } from '@/stores';
import { spacing } from '@/theme';
import {
  pickApiFieldErrors,
  toRegisterInput,
  validateRegisterForm,
  type FormErrors,
  type RegisterFormValues,
} from '@/utils';
import { AuthMessage } from './components/AuthMessage';
import { AuthScreenLayout } from './components/AuthScreenLayout';
import { AuthSwitchLink } from './components/AuthSwitchLink';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

const registerFields = ['fullName', 'phone', 'email', 'password'] as const;
const initialValues: RegisterFormValues = {
  fullName: '',
  phone: '',
  email: '',
  password: '',
  confirmPassword: '',
};

export function RegisterScreen({ navigation }: Props) {
  const [values, setValues] = useState<RegisterFormValues>(initialValues);
  const [fieldErrors, setFieldErrors] = useState<FormErrors<RegisterFormValues>>({});
  const [hasApiFieldErrors, setHasApiFieldErrors] = useState(false);
  const phoneRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);

  const register = useAuthStore((state) => state.register);
  const isSubmitting = useAuthStore((state) => state.isSubmitting);
  const error = useAuthStore((state) => state.error);
  const clearError = useAuthStore((state) => state.clearError);

  useEffect(() => {
    clearError();
    return clearError;
  }, [clearError]);

  const updateField = (field: keyof RegisterFormValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
    setHasApiFieldErrors(false);
    clearError();
  };

  const handleSubmit = async () => {
    Keyboard.dismiss();
    const validationErrors = validateRegisterForm(values);
    setFieldErrors(validationErrors);
    setHasApiFieldErrors(false);
    clearError();

    if (Object.keys(validationErrors).length > 0) return;

    const input = toRegisterInput(values);
    try {
      const data = await register(input);
      navigation.replace('VerifyRegistration', {
        email: input.email,
        developmentCode: data.developmentCode,
      });
    } catch (requestError) {
      const apiFieldErrors = pickApiFieldErrors(
        getApiValidationErrors(requestError),
        registerFields,
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
          label="Đã có tài khoản?"
          linkLabel="Đăng nhập"
          onPress={() => navigation.navigate('Login')}
        />
      )}
      subtitle="Tạo tài khoản để khám phá sản phẩm công nghệ chính hãng"
      title="Tạo tài khoản"
    >
      {error && !hasApiFieldErrors ? <AuthMessage message={error} /> : null}

      <TextInputField
        autoCapitalize="words"
        autoComplete="name"
        blurOnSubmit={false}
        containerStyle={styles.field}
        editable={!isSubmitting}
        error={fieldErrors.fullName}
        label="Họ và tên"
        leftIcon="person-outline"
        maxLength={100}
        onChangeText={(value) => updateField('fullName', value)}
        onSubmitEditing={() => phoneRef.current?.focus()}
        placeholder="Nguyễn Văn A"
        required
        returnKeyType="next"
        textContentType="name"
        value={values.fullName}
      />
      <TextInputField
        autoComplete="tel"
        blurOnSubmit={false}
        containerStyle={styles.field}
        editable={!isSubmitting}
        error={fieldErrors.phone}
        keyboardType="phone-pad"
        label="Số điện thoại"
        leftIcon="call-outline"
        maxLength={12}
        onChangeText={(value) => updateField('phone', value)}
        onSubmitEditing={() => emailRef.current?.focus()}
        placeholder="0912345678"
        ref={phoneRef}
        required
        returnKeyType="next"
        textContentType="telephoneNumber"
        value={values.phone}
      />
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
        ref={emailRef}
        required
        returnKeyType="next"
        textContentType="emailAddress"
        value={values.email}
      />
      <TextInputField
        autoCapitalize="none"
        autoComplete="new-password"
        blurOnSubmit={false}
        containerStyle={styles.field}
        editable={!isSubmitting}
        error={fieldErrors.password}
        helperText="Tối thiểu 8 ký tự"
        isPassword
        label="Mật khẩu"
        leftIcon="lock-closed-outline"
        maxLength={72}
        onChangeText={(value) => updateField('password', value)}
        onSubmitEditing={() => confirmPasswordRef.current?.focus()}
        placeholder="Tạo mật khẩu"
        ref={passwordRef}
        required
        returnKeyType="next"
        textContentType="newPassword"
        value={values.password}
      />
      <TextInputField
        autoCapitalize="none"
        autoComplete="new-password"
        containerStyle={styles.field}
        editable={!isSubmitting}
        error={fieldErrors.confirmPassword}
        isPassword
        label="Xác nhận mật khẩu"
        leftIcon="shield-checkmark-outline"
        maxLength={72}
        onChangeText={(value) => updateField('confirmPassword', value)}
        onSubmitEditing={() => void handleSubmit()}
        placeholder="Nhập lại mật khẩu"
        ref={confirmPasswordRef}
        required
        returnKeyType="done"
        textContentType="newPassword"
        value={values.confirmPassword}
      />
      <PrimaryButton
        loading={isSubmitting}
        onPress={() => void handleSubmit()}
        style={styles.submitButton}
        title="Đăng ký"
      />
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  field: { marginBottom: spacing.lg },
  submitButton: { marginTop: spacing.xs },
});
