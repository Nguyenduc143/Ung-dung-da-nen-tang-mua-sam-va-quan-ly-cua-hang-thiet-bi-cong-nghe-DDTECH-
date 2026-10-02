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
  const [code, setCode] = useState(route.params.developmentCode ?? '');
  const [error, setError] = useState<string>();
  const [message, setMessage] = useState(
    route.params.developmentCode
      ? `Môi trường phát triển: mã xác nhận là ${route.params.developmentCode}`
      : 'Mã xác nhận đã được gửi tới Gmail của bạn.',
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
    setIsSubmitting(true);
    try {
      const data = await resendRegistrationCode({ email: route.params.email });
      if (data.developmentCode) setCode(data.developmentCode);
      setMessage(data.developmentCode
        ? `Đã gửi mã mới. Mã phát triển: ${data.developmentCode}`
        : 'Đã gửi lại mã xác nhận tới Gmail.');
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
        autoComplete="one-time-code"
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
        textContentType="oneTimeCode"
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
