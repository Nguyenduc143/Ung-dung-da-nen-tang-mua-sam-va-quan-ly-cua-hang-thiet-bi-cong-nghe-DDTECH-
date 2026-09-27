import { useCallback, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { getApiErrorMessage } from '@/api/axiosClient';
import { listMyOrders } from '@/api/orders.api';
import { EmptyState, ErrorState, LoadingSkeleton, OrderCard } from '@/components';
import type { CustomerStackParamList, MainTabParamList } from '@/navigation/types';
import { colors, radius, spacing, typography } from '@/theme';
import type { OrderListItem, OrderPagination, OrderStatus } from '@/types';
import { resolveMediaUrl } from '@/utils';

type Props = BottomTabScreenProps<MainTabParamList, 'OrdersTab'>;
type OrderFilter = 'ALL' | OrderStatus;
type LoadMode = 'initial' | 'refresh' | 'more';

const PAGE_SIZE = 10;
const initialPagination: OrderPagination = { page: 1, limit: PAGE_SIZE, total: 0, totalPages: 0 };
const dateFormatter = new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

const filters: Array<{ label: string; value: OrderFilter }> = [
  { label: 'Tất cả', value: 'ALL' },
  { label: 'Chờ xác nhận', value: 'PENDING' },
  { label: 'Đã xác nhận', value: 'CONFIRMED' },
  { label: 'Đang xử lý', value: 'PROCESSING' },
  { label: 'Đang giao', value: 'SHIPPING' },
  { label: 'Đã giao', value: 'DELIVERED' },
  { label: 'Đã hủy', value: 'CANCELLED' },
];

const statusPresentation: Record<OrderStatus, {
  label: string;
  tone: 'warning' | 'info' | 'purple' | 'success' | 'danger';
}> = {
  PENDING: { label: 'Chờ xác nhận', tone: 'warning' },
  CONFIRMED: { label: 'Đã xác nhận', tone: 'info' },
  PROCESSING: { label: 'Đang xử lý', tone: 'purple' },
  SHIPPING: { label: 'Đang giao', tone: 'info' },
  DELIVERED: { label: 'Đã giao', tone: 'success' },
  CANCELLED: { label: 'Đã hủy', tone: 'danger' },
};

const mergeOrders = (current: OrderListItem[], incoming: OrderListItem[]) => {
  const byId = new Map(current.map((order) => [order.id, order]));
  incoming.forEach((order) => byId.set(order.id, order));
  return [...byId.values()];
};

function OrdersSkeleton() {
  return (
    <View style={styles.skeletonList}>
      {[0, 1, 2].map((item) => (
        <View key={item} style={styles.skeletonCard}>
          <View style={styles.skeletonHeader}>
            <View style={styles.skeletonTitleGroup}>
              <LoadingSkeleton height={18} width="55%" />
              <LoadingSkeleton height={14} width="72%" />
            </View>
            <LoadingSkeleton borderRadius={radius.round} height={28} width={92} />
          </View>
          <View style={styles.skeletonProduct}>
            <LoadingSkeleton height={92} width={92} />
            <View style={styles.skeletonProductContent}>
              <LoadingSkeleton height={18} width="82%" />
              <LoadingSkeleton height={14} width="62%" />
              <LoadingSkeleton height={14} width="28%" />
            </View>
          </View>
          <LoadingSkeleton height={18} width="46%" />
        </View>
      ))}
    </View>
  );
}

export function OrdersScreen({ navigation }: Props) {
  const rootNavigation = navigation.getParent<NativeStackNavigationProp<CustomerStackParamList>>();
  const [selectedFilter, setSelectedFilter] = useState<OrderFilter>('ALL');
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [pagination, setPagination] = useState(initialPagination);
  const [error, setError] = useState<string | null>(null);
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const requestIdRef = useRef(0);
  const loadingMoreRef = useRef(false);

  const loadPage = useCallback(async (page: number, mode: LoadMode) => {
    if (mode === 'more') {
      if (loadingMoreRef.current) return;
      loadingMoreRef.current = true;
      setIsLoadingMore(true);
      setLoadMoreError(null);
    } else if (mode === 'refresh') {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
      setError(null);
    }

    const requestId = ++requestIdRef.current;
    try {
      const data = await listMyOrders({
        page,
        limit: PAGE_SIZE,
        status: selectedFilter === 'ALL' ? undefined : selectedFilter,
      });
      if (requestId !== requestIdRef.current) return;
      setOrders((current) => page === 1 ? data.orders : mergeOrders(current, data.orders));
      setPagination(data.pagination);
      setError(null);
      setLoadMoreError(null);
    } catch (requestError) {
      if (requestId !== requestIdRef.current) return;
      const message = getApiErrorMessage(requestError, 'Không thể tải danh sách đơn hàng.');
      if (mode === 'more') setLoadMoreError(message);
      else setError(message);
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
      if (mode === 'more') {
        loadingMoreRef.current = false;
        setIsLoadingMore(false);
      }
    }
  }, [selectedFilter]);

  useFocusEffect(useCallback(() => {
    setOrders([]);
    setPagination(initialPagination);
    void loadPage(1, 'initial');
    return () => { requestIdRef.current += 1; };
  }, [loadPage]));

  const hasNextPage = pagination.page < pagination.totalPages;
  const loadMore = () => {
    if (!hasNextPage || isLoading || isRefreshing || isLoadingMore) return;
    void loadPage(pagination.page + 1, 'more');
  };
  const refresh = () => void loadPage(1, 'refresh');

  const filterBar = (
    <View style={styles.filterSection}>
      <ScrollView
        contentContainerStyle={styles.filterContent}
        horizontal
        showsHorizontalScrollIndicator={false}
      >
        {filters.map((filter) => {
          const selected = selectedFilter === filter.value;
          return (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected }}
              key={filter.value}
              onPress={() => setSelectedFilter(filter.value)}
              style={({ pressed }) => [
                styles.filterChip,
                selected && styles.filterChipSelected,
                pressed && styles.pressed,
              ]}
            >
              <Text style={[styles.filterLabel, selected && styles.filterLabelSelected]}>
                {filter.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );

  if (isLoading && orders.length === 0) {
    return <View style={styles.screen}>{filterBar}<OrdersSkeleton /></View>;
  }

  if (error && orders.length === 0) {
    return (
      <View style={styles.screen}>
        {filterBar}
        <ErrorState
          description={error}
          onRetry={() => void loadPage(1, 'initial')}
          style={styles.fullState}
          title="Không thể tải đơn hàng"
        />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      {filterBar}
      <FlatList
        contentContainerStyle={styles.listContent}
        data={orders}
        keyExtractor={(item) => String(item.id)}
        ListEmptyComponent={(
          <EmptyState
            actionLabel={selectedFilter === 'ALL' ? 'Tiếp tục mua sắm' : undefined}
            description={selectedFilter === 'ALL'
              ? 'Các đơn hàng bạn đã đặt sẽ xuất hiện tại đây.'
              : 'Không có đơn hàng nào ở trạng thái này.'}
            icon="receipt-outline"
            onAction={selectedFilter === 'ALL'
              ? () => rootNavigation?.navigate('ProductList')
              : undefined}
            title={selectedFilter === 'ALL' ? 'Bạn chưa có đơn hàng' : 'Không có đơn hàng'}
          />
        )}
        ListFooterComponent={orders.length > 0 ? (
          <View style={styles.footer}>
            {isLoadingMore ? <ActivityIndicator color={colors.primary} /> : null}
            {loadMoreError ? (
              <View style={styles.loadMoreError}>
                <Text numberOfLines={2} style={styles.loadMoreErrorText}>{loadMoreError}</Text>
                <Pressable hitSlop={8} onPress={loadMore}>
                  <Text style={styles.retryText}>Tải lại</Text>
                </Pressable>
              </View>
            ) : null}
            {!hasNextPage && !isLoadingMore ? (
              <Text style={styles.endText}>Bạn đã xem hết đơn hàng</Text>
            ) : null}
          </View>
        ) : null}
        ListHeaderComponent={orders.length > 0 ? (
          <View>
            <View style={styles.summaryRow}>
              <View style={styles.summaryTitle}>
                <Ionicons color={colors.primary} name="receipt-outline" size={20} />
                <Text style={styles.summaryText}>{pagination.total} đơn hàng</Text>
              </View>
              <Pressable accessibilityLabel="Tải lại đơn hàng" hitSlop={8} onPress={refresh}>
                <Ionicons color={colors.textSecondary} name="refresh" size={22} />
              </Pressable>
            </View>
            {error ? (
              <View accessibilityRole="alert" style={styles.inlineError}>
                <Text numberOfLines={2} style={styles.inlineErrorText}>{error}</Text>
                <Pressable hitSlop={8} onPress={refresh}>
                  <Text style={styles.retryText}>Thử lại</Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        ) : null}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        onEndReached={loadMore}
        onEndReachedThreshold={0.35}
        onRefresh={refresh}
        refreshing={isRefreshing}
        renderItem={({ item }) => {
          const preview = item.previewItem;
          const imageUrl = resolveMediaUrl(preview?.productImage);
          const presentation = statusPresentation[item.status];
          const remainingItems = Math.max(0, item.itemCount - 1);
          const summary = [
            preview?.variantName,
            remainingItems > 0 ? `và ${remainingItems} sản phẩm khác` : null,
          ].filter(Boolean).join(' · ');

          return (
            <OrderCard
              code={item.orderCode}
              date={dateFormatter.format(new Date(item.createdAt))}
              imageSource={imageUrl ? { uri: imageUrl } : undefined}
              onPress={() => rootNavigation?.navigate('OrderDetail', { orderId: item.id })}
              productName={preview?.productName ?? 'Thông tin sản phẩm trong đơn hàng'}
              productSummary={summary || undefined}
              quantity={item.totalQuantity || undefined}
              statusLabel={presentation.label}
              statusTone={presentation.tone}
              total={item.totalAmount}
            />
          );
        }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  filterSection: { borderBottomWidth: 1, borderBottomColor: colors.divider, backgroundColor: colors.background },
  filterContent: { paddingHorizontal: spacing.screen, paddingVertical: spacing.md, gap: spacing.sm },
  filterChip: {
    minHeight: 38,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.round,
    backgroundColor: colors.surface,
  },
  filterChipSelected: { borderColor: colors.primary, backgroundColor: colors.primary },
  filterLabel: { ...typography.bodySmallSemibold, color: colors.textSecondary },
  filterLabelSelected: { color: colors.textInverse },
  listContent: { flexGrow: 1, padding: spacing.screen, paddingBottom: spacing.huge },
  fullState: { flex: 1 },
  summaryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.lg },
  summaryTitle: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  summaryText: { ...typography.bodySemibold, color: colors.textPrimary },
  inlineError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.dangerSoft,
  },
  inlineErrorText: { ...typography.caption, flex: 1, color: colors.danger },
  retryText: { ...typography.captionSemibold, color: colors.primary },
  separator: { height: spacing.lg },
  footer: { minHeight: 64, alignItems: 'center', justifyContent: 'center', padding: spacing.md },
  loadMoreError: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  loadMoreErrorText: { ...typography.caption, flexShrink: 1, color: colors.danger },
  endText: { ...typography.caption, color: colors.textMuted },
  pressed: { opacity: 0.72 },
  skeletonList: { padding: spacing.screen, gap: spacing.lg },
  skeletonCard: {
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    gap: spacing.lg,
  },
  skeletonHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.md },
  skeletonTitleGroup: { flex: 1, gap: spacing.sm },
  skeletonProduct: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  skeletonProductContent: { flex: 1, gap: spacing.sm },
});
