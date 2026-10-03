import { useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Keyboard, StyleSheet } from 'react-native';

import { resendRegistrationCode, verifyRegistration } from '@/api/auth.api';
import { getApiErrorMessage } from '@/api/axiosClient';
import { PrimaryButton, TextInputField } from '@/components';
import type { AuthStackParamList } from '@/navigation/types';
import { spacing } from '@/theme';
import { AuthMessage } from './components/AuthMessage';
import { AuthScreenLayout } from './components/AuthScreenLayout';
import { AuthSwitchLink } from './components/AuthSwitchLink';

type Props = NativeStackScreenProps<AuthStackParamList, 'VerifyRegistration'>;

export function RegistrationVerificationScreen({ navigation, route }: Props) {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string>();
  const [message, setMessage] = useState<string | undefined>(
    'Đã gửi mã xác nhận tới email của bạn.',
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    Keyboard.dismiss();
    const normalizedCode = code.trim();
    if (!/^\d{6}$/.test(normalizedCode)) {
      setError('Mã xác nhận phải gồm 6 chữ số.');
      return;
    }

    setError(undefined);
    setIsSubmitting(true);
    try {
      await verifyRegistration({ email: route.params.email, code: normalizedCode });
      navigation.replace('Login', { registeredEmail: route.params.email });
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    setError(undefined);
    setMessage(undefined);
    setIsSubmitting(true);
    try {
      await resendRegistrationCode({ email: route.params.email });
      setCode('');
      setMessage('Gửi lại mã thành công. Vui lòng kiểm tra email của bạn.');
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
      subtitle={`Nhập mã 6 số được gửi tới ${route.params.email}`}
      title="Xác nhận Gmail"
    >
      {message ? <AuthMessage message={message} tone="success" /> : null}
      {error ? <AuthMessage message={error} /> : null}
      <TextInputField
        autoCapitalize="none"
        autoComplete="off"
        containerStyle={styles.field}
        editable={!isSubmitting}
        keyboardType="number-pad"
        label="Mã xác nhận"
        leftIcon="mail-unread-outline"
        maxLength={6}
        onChangeText={(value) => {
          setCode(value.replace(/\D/g, ''));
          setError(undefined);
        }}
        onSubmitEditing={() => void handleSubmit()}
        placeholder="000000"
        required
        returnKeyType="done"
        textContentType="none"
        value={code}
      />
      <PrimaryButton
        loading={isSubmitting}
        onPress={() => void handleSubmit()}
        title="Xác nhận tài khoản"
      />
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({ field: { marginBottom: spacing.lg } });
