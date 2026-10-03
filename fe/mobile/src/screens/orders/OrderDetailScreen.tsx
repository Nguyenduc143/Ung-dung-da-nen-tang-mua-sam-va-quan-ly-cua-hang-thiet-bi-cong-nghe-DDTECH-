import { useCallback, useEffect, useLayoutEffect, useRef, useState, type PropsWithChildren, type ReactNode } from 'react';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as WebBrowser from 'expo-web-browser';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { cancelOrder, getOrderDetail } from '@/api/orders.api';
import { getApiErrorMessage, isApiError } from '@/api/axiosClient';
import * as paymentsApi from '@/api/payments.api';
import {
  ErrorState,
  LoadingSkeleton,
  PriceDisplay,
  PrimaryButton,
  SecondaryButton,
  StatusBadge,
  TextInputField,
  type StatusBadgeTone,
} from '@/components';
import type { CustomerStackParamList } from '@/navigation/types';
import { subscribeRealtime } from '@/socket';
import { colors, radius, shadows, spacing, typography } from '@/theme';
import type {
  OrderDetailData,
  OrderItem,
  OrderStatus,
  PaymentMethod,
  PaymentRecord,
  PaymentStatus,
} from '@/types';
import { resolveMediaUrl } from '@/utils';

type Props = NativeStackScreenProps<CustomerStackParamList, 'OrderDetail'>;

const dateFormatter = new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

const statusPresentation: Record<OrderStatus, { label: string; tone: StatusBadgeTone }> = {
  PENDING: { label: 'Chờ xác nhận', tone: 'warning' },
  CONFIRMED: { label: 'Đã xác nhận', tone: 'info' },
  PROCESSING: { label: 'Đang xử lý', tone: 'purple' },
  SHIPPING: { label: 'Đang giao', tone: 'info' },
  DELIVERED: { label: 'Đã giao', tone: 'success' },
  CANCELLED: { label: 'Đã hủy', tone: 'danger' },
};

const paymentMethodLabels: Record<PaymentMethod, string> = {
  COD: 'Thanh toán khi nhận hàng',
  VNPAY: 'VNPay',
  MOMO: 'Ví MoMo',
  ZALOPAY: 'ZaloPay',
};

const paymentStatusPresentation: Record<PaymentStatus, { label: string; tone: StatusBadgeTone }> = {
  UNPAID: { label: 'Chưa thanh toán', tone: 'warning' },
  PAID: { label: 'Đã thanh toán', tone: 'success' },
  FAILED: { label: 'Thanh toán thất bại', tone: 'danger' },
  REFUNDED: { label: 'Đã hoàn tiền', tone: 'info' },
};

const formatDate = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Không xác định' : dateFormatter.format(date);
};

interface SectionProps extends PropsWithChildren {
  icon: ReactNode;
  title: string;
}

function Section({ children, icon, title }: SectionProps) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionIcon}>{icon}</View>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function InfoRow({ label, value, valueTone }: { label: string; value: string; valueTone?: 'default' | 'danger' | 'success' }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text
        style={[
          styles.infoValue,
          valueTone === 'danger' && styles.dangerText,
          valueTone === 'success' && styles.successText,
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

interface OrderItemCardProps {
  item: OrderItem;
  onPress?: () => void;
  onReview?: () => void;
}

function OrderItemCard({ item, onPress, onReview }: OrderItemCardProps) {
  const imageUrl = resolveMediaUrl(item.productImage);
  return (
    <View style={styles.itemContainer}>
      <Pressable
        accessibilityRole={onPress ? 'button' : undefined}
        disabled={!onPress}
        onPress={onPress}
        style={({ pressed }) => [styles.itemCard, pressed && styles.pressed]}
      >
        <View style={styles.itemImageContainer}>
          {imageUrl ? (
            <Image resizeMode="contain" source={{ uri: imageUrl }} style={styles.itemImage} />
          ) : (
            <Ionicons color={colors.textMuted} name="cube-outline" size={32} />
          )}
        </View>
        <View style={styles.itemContent}>
          <Text numberOfLines={2} style={styles.itemName}>{item.productName}</Text>
          {item.variantName ? <Text style={styles.itemVariant}>{item.variantName}</Text> : null}
          <Text style={styles.itemSku}>SKU: {item.productSku}</Text>
          <View style={styles.itemPriceRow}>
            <PriceDisplay
              direction="row"
              originalPrice={item.originalPrice}
              price={item.price}
              size="small"
            />
            <Text style={styles.itemQuantity}>x{item.quantity}</Text>
          </View>
          <View style={styles.itemSubtotalRow}>
            <Text style={styles.itemSubtotalLabel}>Thành tiền</Text>
            <PriceDisplay price={item.subtotal} size="small" />
          </View>
        </View>
      </Pressable>
      {onReview ? (
        <Pressable
          accessibilityLabel={`Đánh giá ${item.productName}`}
          accessibilityRole="button"
          onPress={onReview}
          style={({ pressed }) => [styles.reviewButton, pressed && styles.reviewButtonPressed]}
        >
          <Ionicons color={colors.rating} name="star-outline" size={19} />
          <Text style={styles.reviewButtonText}>Đánh giá sản phẩm</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function DetailSkeleton() {
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.heroCard}>
        <LoadingSkeleton height={26} width="58%" />
        <LoadingSkeleton borderRadius={radius.round} height={28} width={110} />
        <LoadingSkeleton height={16} width="72%" />
      </View>
      {[0, 1, 2, 3].map((item) => (
        <View key={item} style={styles.section}>
          <LoadingSkeleton height={22} width="48%" />
          <LoadingSkeleton height={16} width="100%" />
          <LoadingSkeleton height={16} width="78%" />
        </View>
      ))}
    </ScrollView>
  );
}

interface CancelModalProps {
  error: string | null;
  isSubmitting: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  visible: boolean;
}

function CancelOrderModal({ error, isSubmitting, onClose, onConfirm, visible }: CancelModalProps) {
  const [reason, setReason] = useState('');
  const [validationError, setValidationError] = useState<string>();

  useEffect(() => {
    if (!visible) {
      setReason('');
      setValidationError(undefined);
    }
  }, [visible]);

  const submit = () => {
    const normalized = reason.trim();
    if (normalized.length < 3) {
      setValidationError('Vui lòng nhập lý do hủy ít nhất 3 ký tự.');
      return;
    }
    onConfirm(normalized);
  };

  return (
    <Modal
      animationType="slide"
      onRequestClose={() => !isSubmitting && onClose()}
      statusBarTranslucent
      transparent
      visible={visible}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}
      >
        <Pressable accessibilityLabel="Đóng hộp thoại hủy đơn" onPress={onClose} style={styles.modalBackdrop} />
        <SafeAreaView edges={['bottom']} style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <View style={styles.modalTitleRow}>
            <View style={styles.modalTitleContent}>
              <Text style={styles.modalTitle}>Hủy đơn hàng</Text>
              <Text style={styles.modalSubtitle}>Hành động này sẽ hoàn lại tồn kho của sản phẩm.</Text>
            </View>
            <Pressable accessibilityLabel="Đóng" disabled={isSubmitting} hitSlop={8} onPress={onClose}>
              <Ionicons color={colors.textSecondary} name="close" size={26} />
            </Pressable>
          </View>
          <TextInputField
            autoFocus
            containerStyle={styles.reasonField}
            editable={!isSubmitting}
            error={validationError}
            label="Lý do hủy"
            maxLength={255}
            multiline
            onChangeText={(value) => {
              setReason(value);
              setValidationError(undefined);
            }}
            placeholder="Ví dụ: Tôi muốn thay đổi sản phẩm"
            value={reason}
          />
          {error ? <Text accessibilityRole="alert" style={styles.cancelError}>{error}</Text> : null}
          <View style={styles.modalActions}>
            <SecondaryButton
              disabled={isSubmitting}
              onPress={onClose}
              style={styles.modalButton}
              title="Giữ đơn hàng"
            />
            <PrimaryButton
              loading={isSubmitting}
              onPress={submit}
              style={[styles.modalButton, styles.cancelConfirmButton]}
              title="Xác nhận hủy"
            />
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export function OrderDetailScreen({ navigation, route }: Props) {
  const { orderId } = route.params;
  const [detail, setDetail] = useState<OrderDetailData | null>(null);
  const [payment, setPayment] = useState<PaymentRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCancelModalVisible, setCancelModalVisible] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isPaymentLoading, setIsPaymentLoading] = useState(true);
  const [isCreatingPayment, setIsCreatingPayment] = useState(false);
  const requestIdRef = useRef(0);
  const paymentRequestIdRef = useRef(0);

  const loadDetail = useCallback(async (refresh = false) => {
    const requestId = ++requestIdRef.current;
    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);
    try {
      const data = await getOrderDetail(orderId);
      if (requestId !== requestIdRef.current) return;
      setDetail(data);
      setError(null);
    } catch (requestError) {
      if (requestId !== requestIdRef.current) return;
      setError(getApiErrorMessage(requestError, 'Không thể tải chi tiết đơn hàng.'));
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, [orderId]);

  const loadPayment = useCallback(async () => {
    const requestId = ++paymentRequestIdRef.current;
    setIsPaymentLoading(true);
    try {
      const data = await paymentsApi.getPayment(orderId);
      if (requestId !== paymentRequestIdRef.current) return;
      setPayment(data.payment);
      setPaymentError(null);
    } catch (requestError) {
      if (requestId !== paymentRequestIdRef.current) return;
      if (isApiError(requestError) && requestError.response?.status === 404) {
        setPayment(null);
        setPaymentError(null);
      } else {
        setPaymentError(getApiErrorMessage(requestError, 'Không thể tải thông tin thanh toán.'));
      }
    } finally {
      if (requestId === paymentRequestIdRef.current) setIsPaymentLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    void loadDetail();
    void loadPayment();
    return () => {
      requestIdRef.current += 1;
      paymentRequestIdRef.current += 1;
    };
  }, [loadDetail, loadPayment]);

  useEffect(() => {
    const unsubscribeOrder = subscribeRealtime('order:updated', (event) => {
      if (event.orderId === orderId) void loadDetail(true);
    });
    const refreshPayment = (event: { orderId: number }) => {
      if (event.orderId !== orderId) return;
      void loadPayment();
      void loadDetail(true);
    };
    const unsubscribePayment = subscribeRealtime('payment:updated', refreshPayment);
    const unsubscribePaymentCreated = subscribeRealtime('payment:created', refreshPayment);
    return () => {
      unsubscribeOrder();
      unsubscribePayment();
      unsubscribePaymentCreated();
    };
  }, [loadDetail, loadPayment, orderId]);

  useLayoutEffect(() => {
    navigation.setOptions({ title: detail?.order.orderCode ?? 'Chi tiết đơn hàng' });
  }, [detail?.order.orderCode, navigation]);

  const handleCancel = async (reason: string) => {
    setIsCancelling(true);
    setCancelError(null);
    try {
      const data = await cancelOrder(orderId, reason);
      setDetail(data);
      setCancelModalVisible(false);
      Alert.alert('Đã hủy đơn hàng', 'Trạng thái đơn hàng đã được cập nhật.');
    } catch (requestError) {
      setCancelError(getApiErrorMessage(requestError, 'Không thể hủy đơn hàng.'));
    } finally {
      setIsCancelling(false);
    }
  };

  const handleCreatePayment = async () => {
    setIsCreatingPayment(true);
    setPaymentError(null);
    try {
      const result = await paymentsApi.createPayment(orderId);
      setPayment(result.payment);
      if (detail?.order.paymentMethod === 'VNPAY') {
        if (!result.paymentUrl) {
          setPaymentError('Máy chủ chưa trả về đường dẫn thanh toán VNPAY.');
          return;
        }
        const browserResult = await WebBrowser.openAuthSessionAsync(
          result.paymentUrl,
          'ddtech://payment-result',
        );
        await Promise.all([loadDetail(true), loadPayment()]);
        if (browserResult.type !== 'success') {
          Alert.alert('Chưa hoàn tất thanh toán', 'Bạn có thể nhấn thanh toán lại khi sẵn sàng.');
        }
      } else {
        Alert.alert('Đã khởi tạo thanh toán', 'Bạn sẽ thanh toán cho nhân viên giao hàng khi nhận đơn.');
      }
    } catch (requestError) {
      setPaymentError(getApiErrorMessage(requestError, 'Không thể khởi tạo thanh toán.'));
    } finally {
      setIsCreatingPayment(false);
    }
  };

  if (isLoading && !detail) return <DetailSkeleton />;

  if (error && !detail) {
    return (
      <ErrorState
        description={error}
        onRetry={() => void loadDetail()}
        style={styles.fullState}
        title="Không thể tải đơn hàng"
      />
    );
  }

  if (!detail) return null;

  const { items, order, statusHistory } = detail;
  const status = statusPresentation[order.status];
  const paymentStatus = paymentStatusPresentation[order.paymentStatus];
  const canCancel = (order.status === 'PENDING' || order.status === 'CONFIRMED')
    && order.paymentStatus !== 'PAID';

  return (
    <>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={(
          <RefreshControl
            colors={[colors.primary]}
            onRefresh={() => {
              void loadDetail(true);
              void loadPayment();
            }}
            refreshing={isRefreshing}
            tintColor={colors.primary}
          />
        )}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View style={styles.heroTitleGroup}>
              <Text style={styles.orderLabel}>Mã đơn hàng</Text>
              <Text selectable style={styles.orderCode}>{order.orderCode}</Text>
            </View>
            <StatusBadge label={status.label} tone={status.tone} />
          </View>
          <View style={styles.orderDateRow}>
            <Ionicons color={colors.textSecondary} name="calendar-outline" size={17} />
            <Text style={styles.orderDate}>Đặt lúc {formatDate(order.createdAt)}</Text>
          </View>
          {error ? (
            <View accessibilityRole="alert" style={styles.inlineError}>
              <Text style={styles.inlineErrorText}>{error}</Text>
              <Pressable onPress={() => void loadDetail(true)}><Text style={styles.retryText}>Tải lại</Text></Pressable>
            </View>
          ) : null}
        </View>

        <Section icon={<Ionicons color={colors.primary} name="git-branch-outline" size={21} />} title="Trạng thái đơn hàng">
          {statusHistory.length > 0 ? statusHistory.map((history, index) => {
            const presentation = statusPresentation[history.toStatus];
            const isLast = index === statusHistory.length - 1;
            return (
              <View key={history.id} style={styles.timelineRow}>
                <View style={styles.timelineMarker}>
                  <View style={[styles.timelineDot, isLast && styles.timelineDotActive]} />
                  {!isLast ? <View style={styles.timelineLine} /> : null}
                </View>
                <View style={[styles.timelineContent, !isLast && styles.timelineContentSpaced]}>
                  <View style={styles.timelineTitleRow}>
                    <Text style={[styles.timelineTitle, isLast && styles.timelineTitleActive]}>{presentation.label}</Text>
                    <Text style={styles.timelineDate}>{formatDate(history.createdAt)}</Text>
                  </View>
                  {history.note ? <Text style={styles.timelineNote}>{history.note}</Text> : null}
                  {history.changedByName ? <Text style={styles.timelineActor}>Cập nhật bởi {history.changedByName}</Text> : null}
                </View>
              </View>
            );
          }) : <Text style={styles.mutedText}>Chưa có lịch sử trạng thái.</Text>}
        </Section>

        <Section icon={<Ionicons color={colors.primary} name="location-outline" size={22} />} title="Thông tin nhận hàng">
          <View style={styles.receiverRow}>
            <View style={styles.receiverIcon}>
              <Ionicons color={colors.primary} name="person-outline" size={22} />
            </View>
            <View style={styles.receiverContent}>
              <Text style={styles.receiverName}>{order.receiverName}</Text>
              <Text style={styles.receiverPhone}>{order.receiverPhone}</Text>
              <Text style={styles.receiverAddress}>{order.shippingAddress}</Text>
            </View>
          </View>
          {order.note ? (
            <View style={styles.noteBox}>
              <Text style={styles.noteLabel}>Ghi chú</Text>
              <Text style={styles.noteText}>{order.note}</Text>
            </View>
          ) : null}
        </Section>

        <Section icon={<Ionicons color={colors.primary} name="cube-outline" size={22} />} title={`Sản phẩm (${items.length})`}>
          {order.status === 'DELIVERED' ? (
            <View style={styles.reviewPrompt}>
              <Ionicons color={colors.success} name="checkmark-circle-outline" size={20} />
              <Text style={styles.reviewPromptText}>
                Đơn hàng đã giao. Hãy chia sẻ trải nghiệm của bạn về sản phẩm.
              </Text>
            </View>
          ) : null}
          {items.length > 0 ? items.map((item, index) => (
            <View key={item.id}>
              {index > 0 ? <View style={styles.divider} /> : null}
              <OrderItemCard
                item={item}
                onPress={item.productId ? () => navigation.navigate('ProductDetail', { productId: item.productId! }) : undefined}
                onReview={order.status === 'DELIVERED'
                  && item.productId !== null
                  && item.isReviewed !== true
                  && items.findIndex((candidate) => candidate.productId === item.productId) === index
                  ? () => navigation.navigate('WriteReview', {
                      productId: item.productId!,
                      orderId: order.id,
                    })
                  : undefined}
              />
            </View>
          )) : <Text style={styles.mutedText}>Không có thông tin sản phẩm.</Text>}
        </Section>

        <Section icon={<Ionicons color={colors.primary} name="car-outline" size={22} />} title="Vận chuyển">
          <InfoRow label="Phương thức" value={order.shippingMethod?.name ?? 'Không xác định'} />
          <InfoRow label="Phí vận chuyển" value={order.shippingFee > 0 ? `${order.shippingFee.toLocaleString('vi-VN')}đ` : 'Miễn phí'} />
        </Section>

        <Section icon={<Ionicons color={colors.primary} name="card-outline" size={22} />} title="Thanh toán">
          <InfoRow label="Phương thức" value={paymentMethodLabels[order.paymentMethod]} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Trạng thái</Text>
            <StatusBadge label={paymentStatus.label} tone={paymentStatus.tone} />
          </View>
          {isPaymentLoading ? (
            <View style={styles.paymentLoading}>
              <ActivityIndicator color={colors.primary} size="small" />
              <Text style={styles.paymentLoadingText}>Đang kiểm tra giao dịch...</Text>
            </View>
          ) : payment ? (
            <View style={styles.paymentRecord}>
              <InfoRow label="Số tiền" value={`${payment.amount.toLocaleString('vi-VN')}đ`} />
              <InfoRow label="Khởi tạo lúc" value={formatDate(payment.createdAt)} />
              {payment.transactionCode ? <InfoRow label="Mã giao dịch" value={payment.transactionCode} /> : null}
              {payment.paidAt ? <InfoRow label="Thanh toán lúc" value={formatDate(payment.paidAt)} /> : null}
            </View>
          ) : order.paymentMethod === 'COD' && order.status !== 'CANCELLED' ? (
            <SecondaryButton
              loading={isCreatingPayment}
              onPress={() => void handleCreatePayment()}
              title="Khởi tạo thanh toán COD"
            />
          ) : null}
          {order.paymentMethod === 'VNPAY'
            && order.paymentStatus !== 'PAID'
            && order.paymentStatus !== 'REFUNDED'
            && order.status !== 'CANCELLED' ? (
              <SecondaryButton
                loading={isCreatingPayment}
                onPress={() => void handleCreatePayment()}
                title={payment?.status === 'FAILED' ? 'Thử thanh toán VNPAY lại' : 'Thanh toán qua VNPAY'}
              />
            ) : null}
          {paymentError ? (
            <View accessibilityRole="alert" style={styles.paymentError}>
              <Text style={styles.paymentErrorText}>{paymentError}</Text>
              <Pressable hitSlop={8} onPress={() => void loadPayment()}>
                <Text style={styles.retryText}>Thử lại</Text>
              </Pressable>
            </View>
          ) : null}
        </Section>

        <Section icon={<Ionicons color={colors.primary} name="receipt-outline" size={22} />} title="Tổng thanh toán">
          <InfoRow label="Tạm tính" value={`${order.subtotal.toLocaleString('vi-VN')}đ`} />
          <InfoRow label="Phí vận chuyển" value={`${order.shippingFee.toLocaleString('vi-VN')}đ`} />
          {order.promotionCode ? <InfoRow label={`Khuyến mãi (${order.promotionCode})`} value={`-${order.discountAmount.toLocaleString('vi-VN')}đ`} valueTone="success" /> : null}
          <View style={styles.totalDivider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Tổng cộng</Text>
            <PriceDisplay price={order.totalAmount} size="large" />
          </View>
        </Section>

        {order.status === 'CANCELLED' && order.cancelReason ? (
          <View style={styles.cancelledBox}>
            <Ionicons color={colors.danger} name="close-circle-outline" size={23} />
            <View style={styles.cancelledContent}>
              <Text style={styles.cancelledTitle}>Đơn hàng đã hủy</Text>
              <Text style={styles.cancelledReason}>{order.cancelReason}</Text>
            </View>
          </View>
        ) : null}

        {canCancel ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setCancelError(null);
              setCancelModalVisible(true);
            }}
            style={({ pressed }) => [styles.cancelButton, pressed && styles.pressed]}
          >
            <Ionicons color={colors.danger} name="close-circle-outline" size={22} />
            <Text style={styles.cancelButtonText}>Hủy đơn hàng</Text>
          </Pressable>
        ) : null}
      </ScrollView>

      <CancelOrderModal
        error={cancelError}
        isSubmitting={isCancelling}
        onClose={() => !isCancelling && setCancelModalVisible(false)}
        onConfirm={(reason) => void handleCancel(reason)}
        visible={isCancelModalVisible}
      />
    </>
  );
}

const styles = StyleSheet.create({
  fullState: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.screen, paddingBottom: spacing.huge, gap: spacing.lg, backgroundColor: colors.background },
  heroCard: { padding: spacing.xl, borderRadius: radius.xl, backgroundColor: colors.textPrimary, gap: spacing.md, ...shadows.card },
  heroTopRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.md },
  heroTitleGroup: { flex: 1 },
  orderLabel: { ...typography.caption, color: colors.textMuted },
  orderCode: { ...typography.titleSmall, color: colors.textInverse, marginTop: spacing.xs },
  orderDateRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  orderDate: { ...typography.bodySmall, color: colors.borderStrong },
  inlineError: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.dangerSoft },
  inlineErrorText: { ...typography.caption, flex: 1, color: colors.danger },
  retryText: { ...typography.captionSemibold, color: colors.primary },
  section: { padding: spacing.lg, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, backgroundColor: colors.surface, gap: spacing.lg, ...shadows.card },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  sectionIcon: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md, backgroundColor: colors.primarySoft },
  sectionTitle: { ...typography.bodySemibold, flex: 1, color: colors.textPrimary },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.lg },
  infoLabel: { ...typography.bodySmall, flex: 1, color: colors.textSecondary },
  infoValue: { ...typography.bodySmallSemibold, flex: 1.4, color: colors.textPrimary, textAlign: 'right' },
  dangerText: { color: colors.danger },
  successText: { color: colors.success },
  receiverRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  receiverIcon: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: radius.round, backgroundColor: colors.primarySoft },
  receiverContent: { flex: 1 },
  receiverName: { ...typography.bodySemibold, color: colors.textPrimary },
  receiverPhone: { ...typography.bodySmall, color: colors.textSecondary, marginTop: spacing.xs },
  receiverAddress: { ...typography.body, color: colors.textPrimary, marginTop: spacing.sm },
  noteBox: { padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.surfaceMuted },
  noteLabel: { ...typography.captionSemibold, color: colors.textSecondary },
  noteText: { ...typography.bodySmall, color: colors.textPrimary, marginTop: spacing.xs },
  itemContainer: { gap: spacing.md },
  itemCard: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  itemImageContainer: { width: 88, height: 88, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderRadius: radius.md, backgroundColor: colors.surfaceMuted },
  itemImage: { width: '90%', height: '90%' },
  itemContent: { flex: 1 },
  itemName: { ...typography.bodySmallSemibold, color: colors.textPrimary },
  itemVariant: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs },
  itemSku: { ...typography.caption, color: colors.textMuted, marginTop: spacing.xs },
  itemPriceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm, marginTop: spacing.sm },
  itemQuantity: { ...typography.bodySmall, color: colors.textSecondary },
  itemSubtotalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.md },
  itemSubtotalLabel: { ...typography.caption, color: colors.textSecondary },
  reviewPrompt: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.successSoft,
  },
  reviewPromptText: { ...typography.bodySmall, flex: 1, color: colors.textPrimary },
  reviewButton: {
    minHeight: 42,
    alignSelf: 'flex-end',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.rating,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  reviewButtonPressed: { backgroundColor: colors.warningSoft, opacity: 0.8 },
  reviewButtonText: { ...typography.bodySmallSemibold, color: colors.warning },
  divider: { height: 1, marginVertical: spacing.lg, backgroundColor: colors.divider },
  timelineRow: { flexDirection: 'row', alignItems: 'stretch', gap: spacing.md },
  timelineMarker: { width: 16, alignItems: 'center' },
  timelineDot: { width: 12, height: 12, borderWidth: 3, borderColor: colors.borderStrong, borderRadius: radius.round, backgroundColor: colors.surface },
  timelineDotActive: { borderColor: colors.primary, backgroundColor: colors.primary },
  timelineLine: { width: 2, flex: 1, minHeight: 42, backgroundColor: colors.border },
  timelineContent: { flex: 1 },
  timelineContentSpaced: { paddingBottom: spacing.lg },
  timelineTitleRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.sm },
  timelineTitle: { ...typography.bodySmallSemibold, flex: 1, color: colors.textPrimary },
  timelineTitleActive: { color: colors.primary },
  timelineDate: { ...typography.caption, color: colors.textMuted },
  timelineNote: { ...typography.bodySmall, color: colors.textSecondary, marginTop: spacing.xs },
  timelineActor: { ...typography.caption, color: colors.textMuted, marginTop: spacing.xs },
  mutedText: { ...typography.bodySmall, color: colors.textMuted, textAlign: 'center' },
  paymentLoading: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  paymentLoadingText: { ...typography.bodySmall, color: colors.textSecondary },
  paymentRecord: { gap: spacing.md, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.surfaceMuted },
  paymentError: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.dangerSoft },
  paymentErrorText: { ...typography.caption, flex: 1, color: colors.danger },
  totalDivider: { height: 1, backgroundColor: colors.divider },
  totalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.lg },
  totalLabel: { ...typography.bodySemibold, color: colors.textPrimary },
  cancelledBox: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, padding: spacing.lg, borderRadius: radius.lg, backgroundColor: colors.dangerSoft },
  cancelledContent: { flex: 1 },
  cancelledTitle: { ...typography.bodySemibold, color: colors.danger },
  cancelledReason: { ...typography.bodySmall, color: colors.textPrimary, marginTop: spacing.xs },
  cancelButton: { minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, borderWidth: 1, borderColor: colors.danger, borderRadius: radius.md, backgroundColor: colors.surface },
  cancelButtonText: { ...typography.bodySemibold, color: colors.danger },
  pressed: { opacity: 0.72 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: colors.overlay,
  },
  modalSheet: { padding: spacing.screen, borderTopLeftRadius: radius.xxl, borderTopRightRadius: radius.xxl, backgroundColor: colors.surface, ...shadows.floating },
  modalHandle: { width: 44, height: 4, alignSelf: 'center', marginBottom: spacing.xl, borderRadius: radius.round, backgroundColor: colors.borderStrong },
  modalTitleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  modalTitleContent: { flex: 1 },
  modalTitle: { ...typography.titleSmall, color: colors.textPrimary },
  modalSubtitle: { ...typography.bodySmall, color: colors.textSecondary, marginTop: spacing.xs },
  reasonField: { marginTop: spacing.xl },
  cancelError: { ...typography.bodySmall, color: colors.danger, marginTop: spacing.md },
  modalActions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xl },
  modalButton: { flex: 1 },
  cancelConfirmButton: { backgroundColor: colors.danger, borderColor: colors.danger },
});
