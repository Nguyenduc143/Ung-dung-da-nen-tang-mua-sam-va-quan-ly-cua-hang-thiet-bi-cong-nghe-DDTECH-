import { useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Keyboard, StyleSheet } from 'react-native';

import { forgotPassword } from '@/api/auth.api';
import { getApiErrorMessage } from '@/api/axiosClient';
import { PrimaryButton, TextInputField } from '@/components';
import type { AuthStackParamList } from '@/navigation/types';
import { spacing } from '@/theme';
import { normalizeEmail } from '@/utils';
import { AuthMessage } from './components/AuthMessage';
import { AuthScreenLayout } from './components/AuthScreenLayout';
import { AuthSwitchLink } from './components/AuthSwitchLink';

type Props = NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ForgotPasswordScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [fieldError, setFieldError] = useState<string>();
  const [requestError, setRequestError] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    Keyboard.dismiss();
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail || !EMAIL_PATTERN.test(normalizedEmail) || normalizedEmail.length > 191) {
      setFieldError('Email không hợp lệ.');
      return;
    }

    setFieldError(undefined);
    setRequestError(undefined);
    setIsSubmitting(true);
    try {
      await forgotPassword({ email: normalizedEmail });
      navigation.navigate('ResetPassword', {
        email: normalizedEmail,
      });
    } catch (error) {
      setRequestError(getApiErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthScreenLayout
      footer={(
        <AuthSwitchLink
          disabled={isSubmitting}
          label="Đã nhớ mật khẩu?"
          linkLabel="Quay lại đăng nhập"
          onPress={() => navigation.goBack()}
        />
      )}
      subtitle="Nhập email tài khoản để nhận mã xác nhận gồm 6 chữ số"
      title="Quên mật khẩu"
    >
      {requestError ? <AuthMessage message={requestError} /> : null}
      <TextInputField
        autoCapitalize="none"
        autoComplete="email"
        autoCorrect={false}
        containerStyle={styles.field}
        editable={!isSubmitting}
        error={fieldError}
        keyboardType="email-address"
        label="Email"
        leftIcon="mail-outline"
        maxLength={191}
        onChangeText={(value) => {
          setEmail(value);
          setFieldError(undefined);
          setRequestError(undefined);
        }}
        onSubmitEditing={() => void handleSubmit()}
        placeholder="example@email.com"
        required
        returnKeyType="done"
        textContentType="emailAddress"
        value={email}
      />
      <PrimaryButton
        loading={isSubmitting}
        onPress={() => void handleSubmit()}
        title="Gửi mã xác nhận"
      />
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({ field: { marginBottom: spacing.lg } });
