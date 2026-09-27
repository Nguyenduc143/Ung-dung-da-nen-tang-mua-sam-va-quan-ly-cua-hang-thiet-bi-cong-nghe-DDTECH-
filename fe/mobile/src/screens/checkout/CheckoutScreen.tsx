import { useCallback, useEffect, useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { getApiErrorMessage } from '@/api/axiosClient';
import * as ordersApi from '@/api/orders.api';
import * as promotionsApi from '@/api/promotions.api';
import { AddressCard, EmptyState, ErrorState, PrimaryButton } from '@/components';
import type { CustomerStackParamList } from '@/navigation/types';
import { useAddressStore, useCartStore } from '@/stores';
import { colors, radius, shadows, spacing, typography } from '@/theme';
import type { Address, PaymentMethod, PromotionValidationData, ShippingMethod } from '@/types';
import { CheckoutItemRow } from './components/CheckoutItemRow';
import { CheckoutOptionCard } from './components/CheckoutOptionCard';
import { CheckoutSection } from './components/CheckoutSection';
import { CheckoutSkeleton } from './components/CheckoutSkeleton';
import { VoucherPickerModal } from './components/VoucherPickerModal';

type Props = NativeStackScreenProps<CustomerStackParamList, 'Checkout'>;

const currencyFormatter = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 });
const formatCurrency = (value: number) => `${currencyFormatter.format(Math.max(0, value))}đ`;

const formatAddress = (address: Address): string => [
  address.addressLine,
  address.ward,
  address.district,
  address.province,
].filter(Boolean).join(', ');

const getShippingFeeEstimate = (method: ShippingMethod | undefined, subtotal: number): number => {
  if (!method) return 0;
  return method.freeThreshold !== null && subtotal >= method.freeThreshold ? 0 : method.baseFee;
};

export function CheckoutScreen({ navigation, route }: Props) {
  const cart = useCartStore((state) => state.cart);
  const cartError = useCartStore((state) => state.error);
  const isCartLoading = useCartStore((state) => state.isLoading);
  const selectedItemIds = useCartStore((state) => state.selectedItemIds);
  const loadCart = useCartStore((state) => state.loadCart);
  const resetCart = useCartStore((state) => state.resetCart);

  const addresses = useAddressStore((state) => state.addresses);
  const addressError = useAddressStore((state) => state.error);
  const isAddressLoading = useAddressStore((state) => state.isLoading);
  const loadAddresses = useAddressStore((state) => state.loadAddresses);

  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [shippingError, setShippingError] = useState<string | null>(null);
  const [isShippingLoading, setIsShippingLoading] = useState(true);
  const [shippingMethodId, setShippingMethodId] = useState<number | null>(null);
  const [paymentMethod] = useState<PaymentMethod>('COD');
  const [note, setNote] = useState('');
  const [voucherInput, setVoucherInput] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState<PromotionValidationData | null>(null);
  const [isValidatingVoucher, setIsValidatingVoucher] = useState(false);
  const [availableVouchers, setAvailableVouchers] = useState<PromotionValidationData[]>([]);
  const [voucherListError, setVoucherListError] = useState<string | null>(null);
  const [isVoucherListLoading, setIsVoucherListLoading] = useState(false);
  const [isVoucherPickerVisible, setIsVoucherPickerVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const requestedItemIds = useMemo(() => {
    const ids = route.params?.cartItemIds ?? Array.from(selectedItemIds);
    return [...new Set(ids)].sort((left, right) => left - right);
  }, [route.params?.cartItemIds, selectedItemIds]);
  const itemIdsKey = requestedItemIds.join(',');
  const checkoutItems = useMemo(() => {
    const requested = new Set(requestedItemIds);
    return cart?.items.filter((item) => requested.has(item.id)) ?? [];
  }, [cart?.items, itemIdsKey]);
  const selectedAddress = addresses.find((address) => address.id === route.params?.addressId)
    ?? addresses.find((address) => address.isDefault)
    ?? addresses[0];
  const shippingMethod = shippingMethods.find((method) => method.id === shippingMethodId);
  const subtotal = appliedVoucher?.subtotal
    ?? checkoutItems.reduce((total, item) => total + item.lineTotal, 0);
  const discountAmount = appliedVoucher?.discountAmount ?? 0;
  const shippingFee = getShippingFeeEstimate(shippingMethod, subtotal);
  const estimatedTotal = Math.max(0, subtotal + shippingFee - discountAmount);
  const hasInvalidItems = checkoutItems.some((item) => (
    !item.isAvailable || !item.hasSufficientStock || item.quantity > item.availableStock
  ));
  const hasMissingItems = requestedItemIds.length === 0
    || checkoutItems.length !== requestedItemIds.length;

  const loadShippingMethods = useCallback(async () => {
    setIsShippingLoading(true);
    setShippingError(null);
    try {
      const methods = await ordersApi.listShippingMethods();
      setShippingMethods(methods);
      setShippingMethodId((current) => (
        methods.some((method) => method.id === current) ? current : methods[0]?.id ?? null
      ));
    } catch (error) {
      setShippingError(getApiErrorMessage(error, 'Không thể tải phương thức vận chuyển.'));
    } finally {
      setIsShippingLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    void loadCart(true).catch(() => undefined);
    void loadAddresses().catch(() => undefined);
    void loadShippingMethods();
  }, [loadAddresses, loadCart, loadShippingMethods]));

  useEffect(() => {
    setAppliedVoucher(null);
    setAvailableVouchers([]);
  }, [itemIdsKey]);

  const loadAvailableVouchers = async () => {
    setIsVoucherListLoading(true);
    setVoucherListError(null);
    try {
      setAvailableVouchers(await promotionsApi.listAvailablePromotions(requestedItemIds));
    } catch (error) {
      setVoucherListError(getApiErrorMessage(error, 'Không thể tải danh sách voucher.'));
    } finally {
      setIsVoucherListLoading(false);
    }
  };

  const openVoucherPicker = () => {
    setIsVoucherPickerVisible(true);
    void loadAvailableVouchers();
  };

  const selectVoucher = (voucher: PromotionValidationData) => {
    setVoucherInput(voucher.promotion.code);
    setAppliedVoucher(voucher);
    setIsVoucherPickerVisible(false);
  };

  const openAddressPicker = () => {
    navigation.navigate('AddressList', {
      selectionMode: true,
      selectedAddressId: selectedAddress?.id,
      cartItemIds: requestedItemIds,
    });
  };

  const applyVoucher = async () => {
    const code = voucherInput.trim().toUpperCase();
    if (!code) {
      setAppliedVoucher(null);
      return;
    }
    if (hasMissingItems) {
      Alert.alert('Sản phẩm không hợp lệ', 'Vui lòng quay lại giỏ hàng và chọn lại sản phẩm.');
      return;
    }

    setIsValidatingVoucher(true);
    try {
      const validation = await promotionsApi.validatePromotion(code, requestedItemIds);
      setVoucherInput(validation.promotion.code);
      setAppliedVoucher(validation);
    } catch (error) {
      setAppliedVoucher(null);
      Alert.alert('Không thể áp dụng mã', getApiErrorMessage(error, 'Mã khuyến mãi không hợp lệ.'));
    } finally {
      setIsValidatingVoucher(false);
    }
  };

  const removeVoucher = () => {
    setAppliedVoucher(null);
    setVoucherInput('');
  };

  const submitOrder = async () => {
    if (!selectedAddress) {
      Alert.alert('Thiếu địa chỉ', 'Vui lòng thêm địa chỉ nhận hàng.');
      return;
    }
    if (!shippingMethodId) {
      Alert.alert('Thiếu phương thức vận chuyển', 'Vui lòng chọn phương thức vận chuyển.');
      return;
    }
    if (hasMissingItems || hasInvalidItems) {
      Alert.alert('Không thể đặt hàng', 'Giỏ hàng đã thay đổi hoặc có sản phẩm không còn đủ tồn kho.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await ordersApi.checkout({
        addressId: selectedAddress.id,
        cartItemIds: requestedItemIds,
        shippingMethodId,
        promotionCode: appliedVoucher?.promotion.code ?? null,
        paymentMethod,
        note: note.trim() || null,
      });
      resetCart();
      await loadCart(true).catch(() => undefined);
      navigation.replace('OrderDetail', { orderId: result.order.id });
      Alert.alert(
        'Đặt hàng thành công',
        `Đơn ${result.order.orderCode} đã được tạo với tổng tiền ${formatCurrency(result.order.totalAmount)}.`,
      );
    } catch (error) {
      Alert.alert('Không thể đặt hàng', getApiErrorMessage(error, 'Vui lòng kiểm tra lại thông tin.'));
      void loadCart(true).catch(() => undefined);
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmOrder = () => {
    Alert.alert(
      'Xác nhận đặt hàng',
      `Thanh toán khi nhận hàng. Tổng dự kiến ${formatCurrency(estimatedTotal)}.`,
      [
        { style: 'cancel', text: 'Kiểm tra lại' },
        { text: 'Đặt hàng', onPress: () => void submitOrder() },
      ],
    );
  };

  const isInitialLoading = (isCartLoading && !cart)
    || (isAddressLoading && addresses.length === 0)
    || (isShippingLoading && shippingMethods.length === 0);
  if (isInitialLoading) return <CheckoutSkeleton />;

  const blockingError = (!cart && cartError) || shippingError;
  if (blockingError) {
    return (
      <ErrorState
        description={blockingError}
        onRetry={() => {
          void loadCart(true).catch(() => undefined);
          void loadShippingMethods();
        }}
        style={styles.fullState}
        title="Không thể tải thông tin thanh toán"
      />
    );
  }

  if (hasMissingItems) {
    return (
      <EmptyState
        actionLabel="Quay lại giỏ hàng"
        description="Các sản phẩm đã chọn không còn trong giỏ hoặc giỏ hàng đã thay đổi."
        icon="cart-outline"
        onAction={() => navigation.navigate('MainTabs', { screen: 'CartTab' })}
        style={styles.fullState}
        title="Không có sản phẩm để thanh toán"
      />
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.screen}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <CheckoutSection
          action={selectedAddress ? (
            <Pressable hitSlop={8} onPress={openAddressPicker}>
              <Text style={styles.actionText}>Thay đổi</Text>
            </Pressable>
          ) : null}
          icon={<Ionicons color={colors.primary} name="location-outline" size={22} />}
          title="Địa chỉ nhận hàng"
        >
          {selectedAddress ? (
            <AddressCard
              address={formatAddress(selectedAddress)}
              isDefault={selectedAddress.isDefault}
              onPress={openAddressPicker}
              phone={selectedAddress.receiverPhone}
              receiverName={selectedAddress.receiverName}
              style={styles.innerCard}
            />
          ) : (
            <View>
              {addressError ? <Text style={styles.errorText}>{addressError}</Text> : null}
              <PrimaryButton
                icon={<Ionicons color={colors.textInverse} name="add" size={20} />}
                onPress={() => navigation.navigate('AddressForm')}
                title="Thêm địa chỉ nhận hàng"
              />
            </View>
          )}
        </CheckoutSection>

        <CheckoutSection
          icon={<Ionicons color={colors.primary} name="bag-handle-outline" size={22} />}
          title={`Sản phẩm (${checkoutItems.length})`}
        >
          <View style={styles.itemList}>
            {checkoutItems.map((item, index) => (
              <View key={item.id}>
                {index > 0 ? <View style={styles.divider} /> : null}
                <CheckoutItemRow item={item} />
              </View>
            ))}
          </View>
          {hasInvalidItems ? (
            <View style={styles.warningBox}>
              <Ionicons color={colors.warning} name="warning-outline" size={19} />
              <Text style={styles.warningText}>Có sản phẩm hết hàng hoặc không đủ tồn kho.</Text>
            </View>
          ) : null}
        </CheckoutSection>

        <CheckoutSection
          icon={<Ionicons color={colors.primary} name="car-outline" size={23} />}
          title="Phương thức vận chuyển"
        >
          <View style={styles.optionList}>
            {shippingMethods.map((method) => {
              const fee = getShippingFeeEstimate(method, subtotal);
              const delivery = method.estimatedDaysMin === method.estimatedDaysMax
                ? `${method.estimatedDaysMin} ngày`
                : `${method.estimatedDaysMin}–${method.estimatedDaysMax} ngày`;
              return (
                <CheckoutOptionCard
                  description={method.description ?? `Dự kiến giao trong ${delivery}`}
                  key={method.id}
                  label={method.name}
                  meta={fee === 0 ? 'Miễn phí' : formatCurrency(fee)}
                  onPress={() => setShippingMethodId(method.id)}
                  selected={shippingMethodId === method.id}
                />
              );
            })}
          </View>
        </CheckoutSection>

        <CheckoutSection
          action={(
            <Pressable hitSlop={8} onPress={openVoucherPicker}>
              <Text style={styles.actionText}>Chọn voucher</Text>
            </Pressable>
          )}
          icon={<Ionicons color={colors.primary} name="ticket-outline" size={22} />}
          title="Mã khuyến mãi"
        >
          <View style={styles.voucherRow}>
            <TextInput
              autoCapitalize="characters"
              editable={!isValidatingVoucher}
              maxLength={50}
              onChangeText={(value) => {
                setVoucherInput(value);
                if (appliedVoucher) setAppliedVoucher(null);
              }}
              onSubmitEditing={() => void applyVoucher()}
              placeholder="Nhập mã voucher"
              placeholderTextColor={colors.textMuted}
              returnKeyType="done"
              style={styles.voucherInput}
              value={voucherInput}
            />
            <PrimaryButton
              fullWidth={false}
              loading={isValidatingVoucher}
              onPress={() => void applyVoucher()}
              style={styles.voucherButton}
              title="Áp dụng"
            />
          </View>
          {appliedVoucher ? (
            <View style={styles.appliedVoucher}>
              <Ionicons color={colors.success} name="checkmark-circle" size={20} />
              <View style={styles.appliedVoucherContent}>
                <Text style={styles.appliedVoucherTitle}>{appliedVoucher.promotion.name}</Text>
                <Text style={styles.appliedVoucherText}>
                  Đã giảm {formatCurrency(appliedVoucher.discountAmount)}
                </Text>
              </View>
              <Pressable hitSlop={8} onPress={removeVoucher}>
                <Ionicons color={colors.textSecondary} name="close-circle" size={22} />
              </Pressable>
            </View>
          ) : null}
        </CheckoutSection>

        <CheckoutSection
          icon={<Ionicons color={colors.primary} name="wallet-outline" size={22} />}
          title="Phương thức thanh toán"
        >
          <View style={styles.optionList}>
            <CheckoutOptionCard
              description="Thanh toán trực tiếp cho nhân viên giao hàng"
              label="Thanh toán khi nhận hàng (COD)"
              onPress={() => undefined}
              selected
            />
            <CheckoutOptionCard
              description="Cổng thanh toán đang được tích hợp"
              disabled
              label="Ví điện tử / Ngân hàng"
              meta="Sắp có"
              onPress={() => undefined}
              selected={false}
            />
          </View>
        </CheckoutSection>

        <CheckoutSection
          icon={<Ionicons color={colors.primary} name="document-text-outline" size={22} />}
          title="Ghi chú đơn hàng"
        >
          <TextInput
            maxLength={500}
            multiline
            onChangeText={setNote}
            placeholder="Ví dụ: Giao giờ hành chính, gọi trước khi giao..."
            placeholderTextColor={colors.textMuted}
            style={styles.noteInput}
            textAlignVertical="top"
            value={note}
          />
          <Text style={styles.characterCount}>{note.length}/500</Text>
        </CheckoutSection>

        <CheckoutSection
          icon={<Ionicons color={colors.primary} name="receipt-outline" size={22} />}
          title="Tóm tắt thanh toán"
        >
          <View style={styles.summaryRows}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tạm tính</Text>
              <Text numberOfLines={1} style={styles.summaryValue}>{formatCurrency(subtotal)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Phí vận chuyển</Text>
              <Text numberOfLines={1} style={[styles.summaryValue, shippingFee === 0 && styles.freeText]}>
                {shippingFee === 0 ? 'Miễn phí' : formatCurrency(shippingFee)}
              </Text>
            </View>
            {discountAmount > 0 ? (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Giảm giá</Text>
                <Text numberOfLines={1} style={styles.discountText}>-{formatCurrency(discountAmount)}</Text>
              </View>
            ) : null}
            <View style={styles.totalDivider} />
            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>Tổng dự kiến</Text>
              <Text adjustsFontSizeToFit minimumFontScale={0.82} numberOfLines={1} style={styles.totalValue}>
                {formatCurrency(estimatedTotal)}
              </Text>
            </View>
            <Text style={styles.serverNote}>
              Giá, ưu đãi và tổng tiền chính thức sẽ được máy chủ kiểm tra lại khi đặt hàng.
            </Text>
          </View>
        </CheckoutSection>
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.footerSummary}>
          <Text numberOfLines={1} style={styles.footerLabel}>Tổng dự kiến</Text>
          <Text adjustsFontSizeToFit minimumFontScale={0.78} numberOfLines={1} style={styles.footerTotal}>
            {formatCurrency(estimatedTotal)}
          </Text>
        </View>
        <PrimaryButton
          disabled={!selectedAddress || !shippingMethodId || hasInvalidItems || hasMissingItems}
          fullWidth={false}
          loading={isSubmitting}
          onPress={confirmOrder}
          style={styles.orderButton}
          title="Đặt hàng"
        />
      </View>
      <VoucherPickerModal
        error={voucherListError}
        isLoading={isVoucherListLoading}
        onClose={() => setIsVoucherPickerVisible(false)}
        onRetry={() => void loadAvailableVouchers()}
        onSelect={selectVoucher}
        selectedCode={appliedVoucher?.promotion.code}
        visible={isVoucherPickerVisible}
        vouchers={availableVouchers}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  fullState: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.screen, paddingBottom: spacing.xxl, gap: spacing.lg },
  actionText: { ...typography.bodySmallSemibold, color: colors.primary },
  innerCard: { borderWidth: 0, padding: 0, shadowOpacity: 0, elevation: 0 },
  itemList: { gap: spacing.lg },
  divider: { height: 1, marginVertical: spacing.lg, backgroundColor: colors.divider },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    marginTop: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.warningSoft,
  },
  warningText: { ...typography.caption, flex: 1, color: colors.warning },
  errorText: { ...typography.bodySmall, color: colors.danger, marginBottom: spacing.md },
  optionList: { gap: spacing.md },
  voucherRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  voucherInput: {
    flex: 1,
    minHeight: 52,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    color: colors.textPrimary,
    ...typography.body,
  },
  voucherButton: { minHeight: 52, paddingHorizontal: spacing.lg },
  appliedVoucher: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    marginTop: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.successSoft,
  },
  appliedVoucherContent: { flex: 1 },
  appliedVoucherTitle: { ...typography.bodySmallSemibold, color: colors.success },
  appliedVoucherText: { ...typography.caption, color: colors.success, marginTop: spacing.xxs },
  noteInput: {
    minHeight: 104,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
    color: colors.textPrimary,
    ...typography.bodySmall,
  },
  characterCount: { ...typography.caption, alignSelf: 'flex-end', color: colors.textMuted, marginTop: spacing.xs },
  summaryRows: { gap: spacing.md },
  summaryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.lg },
  summaryLabel: { ...typography.bodySmall, flex: 1, color: colors.textSecondary },
  summaryValue: {
    ...typography.bodySmallSemibold,
    minWidth: 96,
    flexShrink: 0,
    color: colors.textPrimary,
    textAlign: 'right',
  },
  freeText: { color: colors.success },
  discountText: {
    ...typography.bodySmallSemibold,
    minWidth: 96,
    flexShrink: 0,
    color: colors.success,
    textAlign: 'right',
  },
  totalDivider: { height: 1, backgroundColor: colors.divider },
  totalLabel: { ...typography.bodySemibold, color: colors.textPrimary },
  totalValue: { ...typography.titleSmall, flex: 1, color: colors.primary, textAlign: 'right' },
  serverNote: { ...typography.caption, color: colors.textMuted },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.lg,
    paddingHorizontal: spacing.screen,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
    ...shadows.floating,
  },
  footerSummary: { flex: 1, minWidth: 0 },
  footerLabel: { ...typography.caption, color: colors.textSecondary },
  footerTotal: { ...typography.titleSmall, color: colors.primary },
  orderButton: { minWidth: 150 },
});
