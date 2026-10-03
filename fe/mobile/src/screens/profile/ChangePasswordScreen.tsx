import { useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Alert, Keyboard, KeyboardAvoidingView, Platform, ScrollView,
  StyleSheet, Text, TextInput, View,
} from 'react-native';

import { getApiErrorMessage, getApiValidationErrors } from '@/api/axiosClient';
import { changePassword } from '@/api/users.api';
import { PrimaryButton, TextInputField } from '@/components';
import type { CustomerStackParamList } from '@/navigation/types';
import { useAuthStore } from '@/stores';
import { colors, radius, spacing, typography } from '@/theme';

type Props = NativeStackScreenProps<CustomerStackParamList, 'ChangePassword'>;
interface FormValues {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}
type FieldErrors = Partial<Record<keyof FormValues, string>>;
const initialValues: FormValues = { currentPassword: '', newPassword: '', confirmPassword: '' };

const validate = (values: FormValues): FieldErrors => {
  const errors: FieldErrors = {};
  if (!values.currentPassword) errors.currentPassword = 'Vui lòng nhập mật khẩu hiện tại.';
  else if (values.currentPassword.length > 72) errors.currentPassword = 'Mật khẩu không được quá 72 ký tự.';
  if (values.newPassword.length < 8) errors.newPassword = 'Mật khẩu mới phải có ít nhất 8 ký tự.';
  else if (values.newPassword.length > 72) errors.newPassword = 'Mật khẩu mới không được quá 72 ký tự.';
  else if (values.newPassword === values.currentPassword) errors.newPassword = 'Mật khẩu mới phải khác mật khẩu hiện tại.';
  if (!values.confirmPassword) errors.confirmPassword = 'Vui lòng xác nhận mật khẩu mới.';
  else if (values.confirmPassword !== values.newPassword) errors.confirmPassword = 'Mật khẩu xác nhận không khớp.';
  return errors;
};

export function ChangePasswordScreen({ navigation: _navigation }: Props) {
  const logout = useAuthStore((state) => state.logout);
  const [values, setValues] = useState<FormValues>(initialValues);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const newPasswordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);

  const updateValue = (key: keyof FormValues, value: string) => {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const handleSubmit = async () => {
    Keyboard.dismiss();
    const fieldErrors = validate(values);
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length > 0) return;

    setIsSubmitting(true);
    try {
      await changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      Alert.alert(
        'Đổi mật khẩu thành công',
        'Các phiên đăng nhập đã được thu hồi. Vui lòng đăng nhập lại bằng mật khẩu mới.',
        [{ text: 'Đăng nhập lại', onPress: () => void logout() }],
        { cancelable: false },
      );
    } catch (error) {
      const apiErrors = getApiValidationErrors(error);
      if (apiErrors) {
        setErrors({
          currentPassword: apiErrors.currentPassword?.[0],
          newPassword: apiErrors.newPassword?.[0],
        });
      }
      Alert.alert('Không thể đổi mật khẩu', getApiErrorMessage(error, 'Vui lòng kiểm tra thông tin và thử lại.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90} style={styles.keyboardView}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.intro}>
          <View style={styles.iconContainer}>
            <Ionicons color={colors.primary} name="shield-checkmark-outline" size={30} />
          </View>
          <View style={styles.introText}>
            <Text style={styles.title}>Bảo vệ tài khoản</Text>
            <Text style={styles.subtitle}>Sau khi đổi mật khẩu, bạn sẽ được đăng xuất khỏi tất cả thiết bị.</Text>
          </View>
        </View>

        <TextInputField autoCapitalize="none" autoComplete="current-password" blurOnSubmit={false} editable={!isSubmitting} error={errors.currentPassword} isPassword label="Mật khẩu hiện tại" leftIcon="lock-closed-outline" maxLength={72} onChangeText={(value) => updateValue('currentPassword', value)} onSubmitEditing={() => newPasswordRef.current?.focus()} placeholder="Nhập mật khẩu hiện tại" required returnKeyType="next" textContentType="password" value={values.currentPassword} />
        <TextInputField autoCapitalize="none" autoComplete="new-password" blurOnSubmit={false} editable={!isSubmitting} error={errors.newPassword} helperText="Từ 8 đến 72 ký tự và khác mật khẩu hiện tại." isPassword label="Mật khẩu mới" leftIcon="key-outline" maxLength={72} onChangeText={(value) => updateValue('newPassword', value)} onSubmitEditing={() => confirmPasswordRef.current?.focus()} placeholder="Nhập mật khẩu mới" ref={newPasswordRef} required returnKeyType="next" textContentType="newPassword" value={values.newPassword} />
        <TextInputField autoCapitalize="none" autoComplete="new-password" editable={!isSubmitting} error={errors.confirmPassword} isPassword label="Xác nhận mật khẩu mới" leftIcon="shield-outline" maxLength={72} onChangeText={(value) => updateValue('confirmPassword', value)} onSubmitEditing={() => void handleSubmit()} placeholder="Nhập lại mật khẩu mới" ref={confirmPasswordRef} required returnKeyType="done" textContentType="newPassword" value={values.confirmPassword} />

        <PrimaryButton loading={isSubmitting} onPress={() => void handleSubmit()} style={styles.submitButton} title="Đổi mật khẩu" />
        <Text style={styles.securityNote}>Không chia sẻ mật khẩu hoặc mã xác thực với bất kỳ ai.</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardView: { flex: 1 },
  content: { gap: spacing.xl, padding: spacing.screen, paddingBottom: spacing.huge, backgroundColor: colors.background },
  intro: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg, borderRadius: radius.lg, backgroundColor: colors.primarySoft },
  iconContainer: { width: 54, height: 54, alignItems: 'center', justifyContent: 'center', borderRadius: radius.round, backgroundColor: colors.surface },
  introText: { flex: 1 },
  title: { ...typography.bodySemibold, color: colors.textPrimary },
  subtitle: { ...typography.bodySmall, color: colors.textSecondary, marginTop: spacing.xs },
  submitButton: { marginTop: spacing.sm },
  securityNote: { ...typography.caption, color: colors.textSecondary, textAlign: 'center' },
});
