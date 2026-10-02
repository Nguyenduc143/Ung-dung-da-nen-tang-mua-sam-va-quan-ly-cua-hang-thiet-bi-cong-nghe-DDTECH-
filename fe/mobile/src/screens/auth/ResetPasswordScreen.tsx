import { useRef, useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Keyboard, StyleSheet, TextInput } from 'react-native';

import { forgotPassword, resetPassword } from '@/api/auth.api';
import { getApiErrorMessage } from '@/api/axiosClient';
import { PrimaryButton, TextInputField } from '@/components';
import type { AuthStackParamList } from '@/navigation/types';
import { spacing } from '@/theme';
import { AuthMessage } from './components/AuthMessage';
import { AuthScreenLayout } from './components/AuthScreenLayout';
import { AuthSwitchLink } from './components/AuthSwitchLink';

type Props = NativeStackScreenProps<AuthStackParamList, 'ResetPassword'>;

export function ResetPasswordScreen({ navigation, route }: Props) {
  const [code, setCode] = useState(route.params.developmentCode ?? '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string>();
  const [message, setMessage] = useState(
    route.params.developmentCode
      ? `Môi trường phát triển: mã xác nhận là ${route.params.developmentCode}`
      : 'Nếu email tồn tại, mã xác nhận đã được gửi.',
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);

  const handleSubmit = async () => {
    Keyboard.dismiss();
    if (!/^\d{6}$/.test(code.trim())) return setError('Mã xác nhận phải gồm 6 chữ số.');
    if (newPassword.length < 8 || newPassword.length > 72) {
      return setError('Mật khẩu mới phải có từ 8 đến 72 ký tự.');
    }
    if (confirmPassword !== newPassword) return setError('Mật khẩu xác nhận không khớp.');

    setError(undefined);
    setIsSubmitting(true);
    try {
      await resetPassword({ email: route.params.email, code: code.trim(), newPassword });
      navigation.navigate('Login', {
        registeredEmail: route.params.email,
        passwordReset: true,
      });
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    setError(undefined);
    setIsSubmitting(true);
    try {
      const data = await forgotPassword({ email: route.params.email });
      if (data.developmentCode) setCode(data.developmentCode);
      setMessage(data.developmentCode
        ? `Đã gửi mã mới. Mã phát triển: ${data.developmentCode}`
        : 'Đã gửi lại mã xác nhận.');
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthScreenLayout
      footer={(
        <AuthSwitchLink
          disabled={isSubmitting}
          label="Chưa nhận được mã?"
          linkLabel="Gửi lại"
          onPress={() => void handleResend()}
        />
      )}
      subtitle={`Mã xác nhận được gửi tới ${route.params.email}`}
      title="Tạo mật khẩu mới"
    >
      {message ? <AuthMessage message={message} tone="success" /> : null}
      {error ? <AuthMessage message={error} /> : null}
      <TextInputField
        autoCapitalize="none"
        autoComplete="one-time-code"
        containerStyle={styles.field}
        editable={!isSubmitting}
        keyboardType="number-pad"
        label="Mã xác nhận"
        leftIcon="keypad-outline"
        maxLength={6}
        onChangeText={(value) => { setCode(value.replace(/\D/g, '')); setError(undefined); }}
        onSubmitEditing={() => passwordRef.current?.focus()}
        placeholder="000000"
        required
        returnKeyType="next"
        textContentType="oneTimeCode"
        value={code}
      />
      <TextInputField
        autoCapitalize="none"
        autoComplete="new-password"
        containerStyle={styles.field}
        editable={!isSubmitting}
        isPassword
        label="Mật khẩu mới"
        leftIcon="lock-closed-outline"
        maxLength={72}
        onChangeText={(value) => { setNewPassword(value); setError(undefined); }}
        onSubmitEditing={() => confirmPasswordRef.current?.focus()}
        placeholder="Tối thiểu 8 ký tự"
        ref={passwordRef}
        required
        returnKeyType="next"
        textContentType="newPassword"
        value={newPassword}
      />
      <TextInputField
        autoCapitalize="none"
        autoComplete="new-password"
        containerStyle={styles.field}
        editable={!isSubmitting}
        isPassword
        label="Xác nhận mật khẩu mới"
        leftIcon="shield-checkmark-outline"
        maxLength={72}
        onChangeText={(value) => { setConfirmPassword(value); setError(undefined); }}
        onSubmitEditing={() => void handleSubmit()}
        placeholder="Nhập lại mật khẩu mới"
        ref={confirmPasswordRef}
        required
        returnKeyType="done"
        textContentType="newPassword"
        value={confirmPassword}
      />
      <PrimaryButton
        loading={isSubmitting}
        onPress={() => void handleSubmit()}
        title="Đặt lại mật khẩu"
      />
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({ field: { marginBottom: spacing.lg } });
