import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { getApiErrorMessage } from '@/api/axiosClient';
import { ErrorState, LoadingSkeleton, PrimaryButton, TextInputField } from '@/components';
import type { CustomerStackParamList } from '@/navigation/types';
import { useAddressStore } from '@/stores';
import { colors, radius, spacing, typography } from '@/theme';
import type { AddressType, CreateAddressInput } from '@/types';
import {
  normalizePhoneInput,
  validateAddressInput,
  type AddressFieldErrors,
} from '@/utils';

type Props = NativeStackScreenProps<CustomerStackParamList, 'AddressForm'>;

interface AddressFormValues {
  receiverName: string;
  receiverPhone: string;
  province: string;
  district: string;
  ward: string;
  addressLine: string;
  addressType: AddressType;
  isDefault: boolean;
}

const emptyValues: AddressFormValues = {
  receiverName: '',
  receiverPhone: '',
  province: '',
  district: '',
  ward: '',
  addressLine: '',
  addressType: 'HOME',
  isDefault: false,
};

const addressTypeOptions: Array<{
  icon: 'home-outline' | 'business-outline' | 'location-outline';
  label: string;
  value: AddressType;
}> = [
  { icon: 'home-outline', label: 'Nhà riêng', value: 'HOME' },
  { icon: 'business-outline', label: 'Văn phòng', value: 'OFFICE' },
  { icon: 'location-outline', label: 'Khác', value: 'OTHER' },
];

export function AddressFormScreen({ navigation, route }: Props) {
  const addressId = route.params?.addressId;
  const addresses = useAddressStore((state) => state.addresses);
  const isInitialized = useAddressStore((state) => state.isInitialized);
  const isLoading = useAddressStore((state) => state.isLoading);
  const isSubmitting = useAddressStore((state) => state.isSubmitting);
  const loadAddresses = useAddressStore((state) => state.loadAddresses);
  const createAddress = useAddressStore((state) => state.createAddress);
  const updateAddress = useAddressStore((state) => state.updateAddress);
  const setDefaultAddress = useAddressStore((state) => state.setDefaultAddress);
  const address = addresses.find((item) => item.id === addressId);
  const [values, setValues] = useState<AddressFormValues>(emptyValues);
  const [errors, setErrors] = useState<AddressFieldErrors>({});
  const hydratedRef = useRef(false);

  useLayoutEffect(() => {
    navigation.setOptions({ title: addressId ? 'Sửa địa chỉ' : 'Thêm địa chỉ' });
  }, [addressId, navigation]);

  useEffect(() => {
    if (!isInitialized) void loadAddresses().catch(() => undefined);
  }, [isInitialized, loadAddresses]);

  useEffect(() => {
    if (hydratedRef.current || !isInitialized) return;
    if (addressId && !address) return;

    if (address) {
      setValues({
        receiverName: address.receiverName,
        receiverPhone: address.receiverPhone,
        province: address.province,
        district: address.district,
        ward: address.ward ?? '',
        addressLine: address.addressLine,
        addressType: address.addressType,
        isDefault: address.isDefault,
      });
    } else {
      setValues({ ...emptyValues, isDefault: addresses.length === 0 });
    }
    hydratedRef.current = true;
  }, [address, addressId, addresses.length, isInitialized]);

  const updateValue = <Key extends keyof AddressFormValues>(
    key: Key,
    value: AddressFormValues[Key],
  ) => {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const handleSubmit = async () => {
    const input: CreateAddressInput = {
      receiverName: values.receiverName.trim(),
      receiverPhone: values.receiverPhone.trim(),
      province: values.province.trim(),
      district: values.district.trim(),
      ward: values.ward.trim() || null,
      addressLine: values.addressLine.trim(),
      addressType: values.addressType,
      isDefault: values.isDefault,
    };
    const validationErrors = validateAddressInput(input);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      if (addressId) {
        const { isDefault: _isDefault, ...updateInput } = input;
        await updateAddress(addressId, updateInput);
        if (values.isDefault && !address?.isDefault) await setDefaultAddress(addressId);
      } else {
        await createAddress(input);
      }
      navigation.goBack();
    } catch (submitError) {
      Alert.alert(
        addressId ? 'Không thể cập nhật địa chỉ' : 'Không thể thêm địa chỉ',
        getApiErrorMessage(submitError, 'Vui lòng kiểm tra thông tin và thử lại.'),
      );
    }
  };

  if (isLoading || !hydratedRef.current) {
    if (isInitialized && addressId && !address) {
      return (
        <ErrorState
          description="Địa chỉ này không tồn tại hoặc đã bị xóa."
          onRetry={() => navigation.goBack()}
          retryLabel="Quay lại"
          style={styles.fullState}
          title="Không tìm thấy địa chỉ"
        />
      );
    }
    return (
      <View style={styles.loadingContainer}>
        {[0, 1, 2, 3, 4, 5].map((item) => (
          <LoadingSkeleton borderRadius={radius.md} height={54} key={item} />
        ))}
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
      style={styles.keyboardView}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.intro}>
          <View style={styles.introIcon}>
            <Ionicons color={colors.primary} name="location-outline" size={27} />
          </View>
          <View style={styles.introText}>
            <Text style={styles.title}>Thông tin người nhận</Text>
            <Text style={styles.subtitle}>Vui lòng nhập chính xác để giao hàng thuận lợi.</Text>
          </View>
        </View>

        <TextInputField
          autoCapitalize="words"
          error={errors.receiverName}
          label="Họ và tên người nhận"
          leftIcon="person-outline"
          maxLength={100}
          onChangeText={(value) => updateValue('receiverName', value)}
          placeholder="Nguyễn Văn An"
          required
          returnKeyType="next"
          value={values.receiverName}
        />
        <TextInputField
          error={errors.receiverPhone}
          keyboardType="phone-pad"
          label="Số điện thoại"
          leftIcon="call-outline"
          maxLength={12}
          onChangeText={(value) => updateValue('receiverPhone', normalizePhoneInput(value))}
          placeholder="0901234567"
          required
          returnKeyType="next"
          value={values.receiverPhone}
        />

        <View style={styles.row}>
          <TextInputField
            autoCapitalize="words"
            containerStyle={styles.halfField}
            error={errors.province}
            label="Tỉnh/Thành phố"
            maxLength={100}
            onChangeText={(value) => updateValue('province', value)}
            placeholder="Hà Nội"
            required
            value={values.province}
          />
          <TextInputField
            autoCapitalize="words"
            containerStyle={styles.halfField}
            error={errors.district}
            label="Quận/Huyện"
            maxLength={100}
            onChangeText={(value) => updateValue('district', value)}
            placeholder="Cầu Giấy"
            required
            value={values.district}
          />
        </View>
        <TextInputField
          autoCapitalize="words"
          error={errors.ward}
          label="Phường/Xã"
          maxLength={100}
          onChangeText={(value) => updateValue('ward', value)}
          placeholder="Dịch Vọng (không bắt buộc)"
          value={values.ward}
        />
        <TextInputField
          autoCapitalize="sentences"
          error={errors.addressLine}
          label="Địa chỉ cụ thể"
          leftIcon="map-outline"
          maxLength={255}
          onChangeText={(value) => updateValue('addressLine', value)}
          placeholder="Số nhà, tên đường, tòa nhà..."
          required
          value={values.addressLine}
        />

        <View>
          <Text style={styles.fieldLabel}>Loại địa chỉ</Text>
          <View style={styles.typeRow}>
            {addressTypeOptions.map((option) => {
              const selected = values.addressType === option.value;
              return (
                <Pressable
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected }}
                  key={option.value}
                  onPress={() => updateValue('addressType', option.value)}
                  style={({ pressed }) => [
                    styles.typeOption,
                    selected && styles.selectedType,
                    pressed && styles.pressed,
                  ]}
                >
                  <Ionicons
                    color={selected ? colors.primary : colors.textSecondary}
                    name={option.icon}
                    size={21}
                  />
                  <Text style={[styles.typeText, selected && styles.selectedTypeText]}>
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: values.isDefault, disabled: Boolean(address?.isDefault) }}
          disabled={Boolean(address?.isDefault)}
          onPress={() => updateValue('isDefault', !values.isDefault)}
          style={({ pressed }) => [styles.defaultRow, pressed && styles.pressed]}
        >
          <Ionicons
            color={values.isDefault ? colors.primary : colors.textMuted}
            name={values.isDefault ? 'checkbox' : 'square-outline'}
            size={25}
          />
          <View style={styles.defaultTextContainer}>
            <Text style={styles.defaultTitle}>Đặt làm địa chỉ mặc định</Text>
            <Text style={styles.defaultHint}>
              {address?.isDefault
                ? 'Địa chỉ này hiện đang là mặc định.'
                : 'Ưu tiên địa chỉ này khi thanh toán.'}
            </Text>
          </View>
        </Pressable>

        <PrimaryButton
          loading={isSubmitting}
          onPress={() => void handleSubmit()}
          style={styles.submitButton}
          title={addressId ? 'Lưu thay đổi' : 'Thêm địa chỉ'}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardView: { flex: 1 },
  fullState: { flex: 1, backgroundColor: colors.background },
  loadingContainer: { flex: 1, gap: spacing.xxl, padding: spacing.screen },
  content: { gap: spacing.xl, padding: spacing.screen, paddingBottom: spacing.huge },
  intro: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.primarySoft,
  },
  introIcon: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.round,
    backgroundColor: colors.surface,
  },
  introText: { flex: 1 },
  title: { ...typography.bodySemibold, color: colors.textPrimary },
  subtitle: { ...typography.bodySmall, color: colors.textSecondary, marginTop: spacing.xs },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  halfField: { flex: 1 },
  fieldLabel: { ...typography.bodySmallSemibold, color: colors.textPrimary, marginBottom: spacing.sm },
  typeRow: { flexDirection: 'row', gap: spacing.sm },
  typeOption: {
    minHeight: 48,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  selectedType: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  typeText: { ...typography.captionSemibold, color: colors.textSecondary },
  selectedTypeText: { color: colors.primary },
  defaultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  defaultTextContainer: { flex: 1 },
  defaultTitle: { ...typography.bodySemibold, color: colors.textPrimary },
  defaultHint: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs },
  submitButton: { marginTop: spacing.sm },
  pressed: { opacity: 0.68 },
});
