import { useCallback, useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Alert, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView,
  StyleSheet, Text, View,
} from 'react-native';

import { getApiErrorMessage, getApiValidationErrors } from '@/api/axiosClient';
import { getProfile, updateProfile, uploadAvatar } from '@/api/users.api';
import { ErrorState, LoadingSkeleton, PrimaryButton, TextInputField } from '@/components';
import type { CustomerStackParamList } from '@/navigation/types';
import { useAuthStore } from '@/stores';
import { colors, radius, spacing, typography } from '@/theme';
import type { UpdateProfileInput, UserGender } from '@/types';

type Props = NativeStackScreenProps<CustomerStackParamList, 'EditProfile'>;
interface FormValues {
  fullName: string;
  email: string;
  phone: string;
  avatarUrl: string;
  gender: UserGender | null;
  dateOfBirth: string;
}
type FieldErrors = Partial<Record<keyof FormValues, string>>;

const emptyValues: FormValues = {
  fullName: '', email: '', phone: '', avatarUrl: '', gender: null, dateOfBirth: '',
};
const genderOptions: Array<{ label: string; value: UserGender | null }> = [
  { label: 'Không chọn', value: null },
  { label: 'Nam', value: 'MALE' },
  { label: 'Nữ', value: 'FEMALE' },
  { label: 'Khác', value: 'OTHER' },
];

const todayString = (): string => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};
const isValidDate = (value: string): boolean => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const [, year, month, day] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  return date.getFullYear() === Number(year)
    && date.getMonth() === Number(month) - 1
    && date.getDate() === Number(day);
};
const validate = (values: FormValues): FieldErrors => {
  const errors: FieldErrors = {};
  const name = values.fullName.trim();
  const phone = values.phone.trim();
  const birthDate = values.dateOfBirth.trim();
  if (name.length < 2) errors.fullName = 'Họ và tên phải có ít nhất 2 ký tự.';
  else if (name.length > 100) errors.fullName = 'Họ và tên không được quá 100 ký tự.';
  if (phone && !/^(?:\+84|0)\d{9}$/.test(phone)) {
    errors.phone = 'Số điện thoại phải có dạng 0xxxxxxxxx hoặc +84xxxxxxxxx.';
  }
  if (birthDate && !isValidDate(birthDate)) {
    errors.dateOfBirth = 'Ngày sinh phải đúng định dạng YYYY-MM-DD.';
  } else if (birthDate && birthDate > todayString()) {
    errors.dateOfBirth = 'Ngày sinh không được nằm trong tương lai.';
  }
  return errors;
};

export function EditProfileScreen({ navigation }: Props) {
  const setUser = useAuthStore((state) => state.setUser);
  const [values, setValues] = useState<FormValues>(emptyValues);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const loadProfile = useCallback(async () => {
    setIsLoading(true);
    try {
      const profile = await getProfile();
      setValues({
        fullName: profile.fullName,
        email: profile.email,
        phone: profile.phone ?? '',
        avatarUrl: profile.avatarUrl ?? '',
        gender: profile.gender,
        dateOfBirth: profile.dateOfBirth?.slice(0, 10) ?? '',
      });
      setUser(profile);
      setLoadError(null);
    } catch (error) {
      setLoadError(getApiErrorMessage(error, 'Không thể tải thông tin cá nhân.'));
    } finally {
      setIsLoading(false);
    }
  }, [setUser]);

  useEffect(() => { void loadProfile(); }, [loadProfile]);

  const updateValue = <Key extends keyof FormValues>(key: Key, value: FormValues[Key]) => {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const openImagePicker = async (source: 'camera' | 'library') => {
    try {
      const permission = source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Chưa có quyền truy cập',
          source === 'camera'
            ? 'Vui lòng cho phép DDTECH sử dụng máy ảnh trong cài đặt thiết bị.'
            : 'Vui lòng cho phép DDTECH truy cập thư viện ảnh trong cài đặt thiết bị.',
        );
        return;
      }

      const options: ImagePicker.ImagePickerOptions = {
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        preferredAssetRepresentationMode:
          ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
      };
      const result = source === 'camera'
        ? await ImagePicker.launchCameraAsync(options)
        : await ImagePicker.launchImageLibraryAsync(options);
      if (result.canceled) return;

      const asset = result.assets[0];
      if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
        Alert.alert('Ảnh quá lớn', 'Vui lòng chọn ảnh có dung lượng không quá 5 MB.');
        return;
      }
      const acceptedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (asset.mimeType && !acceptedTypes.includes(asset.mimeType)) {
        Alert.alert('Định dạng không hỗ trợ', 'Vui lòng chọn ảnh JPG, PNG hoặc WEBP.');
        return;
      }
      setSelectedAvatar(asset);
      setAvatarFailed(false);
    } catch (error) {
      Alert.alert('Không thể chọn ảnh', error instanceof Error ? error.message : 'Vui lòng thử lại.');
    }
  };

  const showAvatarOptions = () => {
    Alert.alert('Chọn ảnh đại diện', 'Bạn muốn lấy ảnh từ đâu?', [
      { text: 'Thư viện ảnh', onPress: () => void openImagePicker('library') },
      { text: 'Chụp ảnh', onPress: () => void openImagePicker('camera') },
      { style: 'cancel', text: 'Hủy' },
    ]);
  };

  const handleSubmit = async () => {
    const fieldErrors = validate(values);
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length > 0) return;

    const input: UpdateProfileInput = {
      fullName: values.fullName.trim(),
      phone: values.phone.trim() || null,
      gender: values.gender,
      dateOfBirth: values.dateOfBirth.trim() || null,
    };
    setIsSubmitting(true);
    let profileWasUpdated = false;
    try {
      let profile = await updateProfile(input);
      profileWasUpdated = true;
      setUser(profile);
      if (selectedAvatar) {
        setUploadProgress(0);
        profile = await uploadAvatar(selectedAvatar, setUploadProgress);
        setUser(profile);
      }
      Alert.alert('Cập nhật thành công', 'Thông tin cá nhân đã được lưu.', [
        { text: 'Đóng', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      const apiErrors = getApiValidationErrors(error);
      if (apiErrors) {
        setErrors({
          fullName: apiErrors.fullName?.[0], phone: apiErrors.phone?.[0],
          gender: apiErrors.gender?.[0],
          dateOfBirth: apiErrors.dateOfBirth?.[0],
        });
      }
      Alert.alert(
        selectedAvatar && profileWasUpdated ? 'Chưa thể tải ảnh lên' : 'Không thể cập nhật',
        selectedAvatar && profileWasUpdated
          ? `Thông tin khác đã được lưu. ${getApiErrorMessage(error, 'Vui lòng thử tải ảnh lại.')}`
          : getApiErrorMessage(error, 'Vui lòng kiểm tra thông tin và thử lại.'),
      );
    } finally {
      setIsSubmitting(false);
      setUploadProgress(null);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingSkeleton borderRadius={radius.round} height={96} width={96} />
        {[0, 1, 2, 3, 4].map((item) => <LoadingSkeleton borderRadius={radius.md} height={54} key={item} />)}
      </View>
    );
  }
  if (loadError) {
    return <ErrorState description={loadError} onRetry={() => void loadProfile()} style={styles.fullState} title="Không thể tải hồ sơ" />;
  }

  const avatarUrl = selectedAvatar?.uri ?? values.avatarUrl.trim();
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90} style={styles.keyboardView}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.avatarSection}>
          <Pressable
            accessibilityLabel="Chọn ảnh đại diện"
            accessibilityRole="button"
            disabled={isSubmitting}
            onPress={showAvatarOptions}
            style={({ pressed }) => [styles.avatarContainer, pressed && styles.pressed]}
          >
            {avatarUrl && !avatarFailed
              ? <Image onError={() => setAvatarFailed(true)} source={{ uri: avatarUrl }} style={styles.avatar} />
              : <Ionicons color={colors.primary} name="person-outline" size={44} />}
            <View style={styles.cameraBadge}>
              <Ionicons color={colors.textInverse} name="camera" size={16} />
            </View>
          </Pressable>
          <Pressable disabled={isSubmitting} onPress={showAvatarOptions} style={({ pressed }) => pressed && styles.pressed}>
            <Text style={styles.chooseAvatarText}>{selectedAvatar ? 'Chọn ảnh khác' : 'Chọn ảnh đại diện'}</Text>
          </Pressable>
          <Text style={styles.avatarHint}>JPG, PNG hoặc WEBP, dung lượng tối đa 5 MB.</Text>
          {uploadProgress !== null ? (
            <Text style={styles.uploadText}>Đang tải ảnh lên: {uploadProgress}%</Text>
          ) : null}
        </View>

        <TextInputField autoCapitalize="words" editable={!isSubmitting} error={errors.fullName} label="Họ và tên" leftIcon="person-outline" maxLength={100} onChangeText={(value) => updateValue('fullName', value)} placeholder="Nguyễn Văn An" required returnKeyType="next" value={values.fullName} />
        <TextInputField editable={false} helperText="Email đăng nhập không thể thay đổi." label="Email" leftIcon="mail-outline" value={values.email} />
        <TextInputField editable={!isSubmitting} error={errors.phone} keyboardType="phone-pad" label="Số điện thoại" leftIcon="call-outline" maxLength={12} onChangeText={(value) => updateValue('phone', value.replace(/[^\d+]/g, ''))} placeholder="0901234567" returnKeyType="next" value={values.phone} />
        <View>
          <Text style={styles.fieldLabel}>Giới tính</Text>
          <View style={styles.genderRow}>
            {genderOptions.map((option) => {
              const selected = values.gender === option.value;
              return (
                <Pressable accessibilityRole="radio" accessibilityState={{ checked: selected, disabled: isSubmitting }} disabled={isSubmitting} key={option.label} onPress={() => updateValue('gender', option.value)} style={({ pressed }) => [styles.genderOption, selected && styles.selectedOption, pressed && styles.pressed]}>
                  <Text style={[styles.genderText, selected && styles.selectedOptionText]}>{option.label}</Text>
                </Pressable>
              );
            })}
          </View>
          {errors.gender ? <Text style={styles.errorText}>{errors.gender}</Text> : null}
        </View>

        <TextInputField editable={!isSubmitting} error={errors.dateOfBirth} helperText="Định dạng: năm-tháng-ngày, ví dụ 2000-12-31." keyboardType="numbers-and-punctuation" label="Ngày sinh" leftIcon="calendar-outline" maxLength={10} onChangeText={(value) => updateValue('dateOfBirth', value)} placeholder="YYYY-MM-DD" returnKeyType="done" value={values.dateOfBirth} />
        <PrimaryButton loading={isSubmitting} onPress={() => void handleSubmit()} style={styles.submitButton} title="Lưu thay đổi" />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardView: { flex: 1 },
  fullState: { flex: 1, backgroundColor: colors.background },
  loadingContainer: { flex: 1, alignItems: 'center', gap: spacing.xxl, padding: spacing.screen, backgroundColor: colors.background },
  content: { gap: spacing.xl, padding: spacing.screen, paddingBottom: spacing.huge, backgroundColor: colors.background },
  avatarSection: { alignItems: 'center' },
  avatarContainer: { width: 96, height: 96, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderWidth: 3, borderColor: colors.primaryBorder, borderRadius: radius.round, backgroundColor: colors.primarySoft },
  avatar: { width: '100%', height: '100%' },
  cameraBadge: { position: 'absolute', right: 0, bottom: 0, width: 30, height: 30, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.surface, borderRadius: radius.round, backgroundColor: colors.primary },
  chooseAvatarText: { ...typography.bodySmallSemibold, color: colors.primary, marginTop: spacing.md },
  avatarHint: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.sm, textAlign: 'center' },
  uploadText: { ...typography.captionSemibold, color: colors.primary, marginTop: spacing.xs },
  fieldLabel: { ...typography.bodySmallSemibold, color: colors.textPrimary, marginBottom: spacing.sm },
  genderRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  genderOption: { minHeight: 42, justifyContent: 'center', paddingHorizontal: spacing.lg, borderWidth: 1, borderColor: colors.borderStrong, borderRadius: radius.round, backgroundColor: colors.surface },
  selectedOption: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  genderText: { ...typography.bodySmallSemibold, color: colors.textSecondary },
  selectedOptionText: { color: colors.primary },
  errorText: { ...typography.caption, color: colors.danger, marginTop: spacing.xs },
  submitButton: { marginTop: spacing.sm },
  pressed: { opacity: 0.68 },
});
