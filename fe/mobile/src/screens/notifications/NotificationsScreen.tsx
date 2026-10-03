import { useCallback, useEffect, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { getApiErrorMessage } from '@/api/axiosClient';
import {
  getUnreadNotificationCount,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/api/notifications.api';
import { EmptyState, ErrorState, ListSkeleton, NotificationItem } from '@/components';
import type { IoniconName } from '@/components';
import type { CustomerStackParamList } from '@/navigation/types';
import { subscribeRealtime } from '@/socket';
import { useBadgeStore } from '@/stores';
import { colors, radius, spacing, typography } from '@/theme';
import type {
  AppNotification,
  NotificationPagination,
  NotificationType,
} from '@/types';
import type { StatusBadgeTone } from '@/components/StatusBadge';

type Props = NativeStackScreenProps<CustomerStackParamList, 'Notifications'>;
type FilterValue = 'ALL' | 'UNREAD' | NotificationType;
type LoadMode = 'initial' | 'refresh' | 'more';

const PAGE_SIZE = 20;
const initialPagination: NotificationPagination = {
  page: 1, limit: PAGE_SIZE, total: 0, totalPages: 0,
};
const filters: Array<{ label: string; value: FilterValue }> = [
  { label: 'Tất cả', value: 'ALL' },
  { label: 'Chưa đọc', value: 'UNREAD' },
  { label: 'Đơn hàng', value: 'ORDER' },
  { label: 'Thanh toán', value: 'PAYMENT' },
  { label: 'Khuyến mãi', value: 'PROMOTION' },
  { label: 'Đánh giá', value: 'REVIEW' },
  { label: 'Hệ thống', value: 'SYSTEM' },
];
const presentation: Record<NotificationType, {
  icon: IoniconName;
  tone: StatusBadgeTone;
}> = {
  ORDER: { icon: 'cube-outline', tone: 'info' },
  PAYMENT: { icon: 'card-outline', tone: 'success' },
  PROMOTION: { icon: 'pricetag-outline', tone: 'danger' },
  REVIEW: { icon: 'star-outline', tone: 'warning' },
  SYSTEM: { icon: 'notifications-outline', tone: 'purple' },
};

const mergeNotifications = (current: AppNotification[], incoming: AppNotification[]) => {
  const byId = new Map(current.map((notification) => [notification.id, notification]));
  incoming.forEach((notification) => byId.set(notification.id, notification));
  return [...byId.values()];
};

const formatTime = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (seconds < 60) return 'Vừa xong';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} ngày trước`;
  return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
};

export function NotificationsScreen({ navigation }: Props) {
  const unreadCount = useBadgeStore((state) => state.unreadNotificationCount);
  const setUnreadCount = useBadgeStore((state) => state.setUnreadNotificationCount);
  const [selectedFilter, setSelectedFilter] = useState<FilterValue>('ALL');
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [pagination, setPagination] = useState(initialPagination);
  const [error, setError] = useState<string | null>(null);
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const [pendingId, setPendingId] = useState<number | null>(null);
  const requestIdRef = useRef(0);
  const loadingMoreRef = useRef(false);

  const syncUnreadCount = useCallback(async () => {
    const count = await getUnreadNotificationCount();
    setUnreadCount(count);
  }, [setUnreadCount]);

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
      const data = await listNotifications({
        page,
        limit: PAGE_SIZE,
        unreadOnly: selectedFilter === 'UNREAD' ? true : undefined,
        type: selectedFilter !== 'ALL' && selectedFilter !== 'UNREAD'
          ? selectedFilter
          : undefined,
      });
      await syncUnreadCount().catch(() => undefined);
      if (requestId !== requestIdRef.current) return;
      setNotifications((current) => (
        page === 1 ? data.notifications : mergeNotifications(current, data.notifications)
      ));
      setPagination(data.pagination);
      setError(null);
      setLoadMoreError(null);
    } catch (requestError) {
      if (requestId !== requestIdRef.current) return;
      const message = getApiErrorMessage(requestError, 'Không thể tải danh sách thông báo.');
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
  }, [selectedFilter, syncUnreadCount]);

  useFocusEffect(useCallback(() => {
    setNotifications([]);
    setPagination(initialPagination);
    void loadPage(1, 'initial');
    return () => { requestIdRef.current += 1; };
  }, [loadPage]));

  useEffect(() => subscribeRealtime('notification:new', () => {
    void loadPage(1, 'refresh');
  }), [loadPage]);

  const navigateFromNotification = (notification: AppNotification) => {
    if (!notification.referenceId) return;
    const referenceType = notification.referenceType?.toLowerCase();
    if (referenceType === 'order' || (!referenceType && ['ORDER', 'PAYMENT'].includes(notification.type))) {
      navigation.navigate('OrderDetail', { orderId: notification.referenceId });
    } else if (referenceType === 'product') {
      navigation.navigate('ProductDetail', { productId: notification.referenceId });
    }
  };

  const handleNotificationPress = async (notification: AppNotification) => {
    if (pendingId !== null) return;
    if (notification.isRead) {
      navigateFromNotification(notification);
      return;
    }

    setPendingId(notification.id);
    try {
      const updated = await markNotificationRead(notification.id);
      setNotifications((current) => (
        selectedFilter === 'UNREAD'
          ? current.filter((item) => item.id !== notification.id)
          : current.map((item) => item.id === updated.id ? updated : item)
      ));
      setUnreadCount(Math.max(0, unreadCount - 1));
      navigateFromNotification(updated);
    } catch (requestError) {
      Alert.alert('Không thể mở thông báo', getApiErrorMessage(requestError, 'Vui lòng thử lại.'));
    } finally {
      setPendingId(null);
    }
  };

  const handleMarkAllRead = async () => {
    if (isMarkingAll || unreadCount === 0) return;
    setIsMarkingAll(true);
    try {
      await markAllNotificationsRead();
      setUnreadCount(0);
      if (selectedFilter === 'UNREAD') {
        setNotifications([]);
        setPagination(initialPagination);
      } else {
        const readAt = new Date().toISOString();
        setNotifications((current) => current.map((item) => ({ ...item, isRead: true, readAt })));
      }
    } catch (requestError) {
      Alert.alert('Không thể đánh dấu đã đọc', getApiErrorMessage(requestError, 'Vui lòng thử lại.'));
    } finally {
      setIsMarkingAll(false);
    }
  };

  const hasNextPage = pagination.page < pagination.totalPages;
  const loadMore = () => {
    if (!hasNextPage || isLoading || isRefreshing || isLoadingMore) return;
    void loadPage(pagination.page + 1, 'more');
  };
  const refresh = () => void loadPage(1, 'refresh');

  const filterBar = (
    <View style={styles.filterSection}>
      <ScrollView contentContainerStyle={styles.filterContent} horizontal showsHorizontalScrollIndicator={false}>
        {filters.map((filter) => {
          const selected = selectedFilter === filter.value;
          return (
            <Pressable accessibilityRole="button" accessibilityState={{ selected }} key={filter.value} onPress={() => setSelectedFilter(filter.value)} style={({ pressed }) => [styles.filterChip, selected && styles.filterChipSelected, pressed && styles.pressed]}>
              <Text style={[styles.filterLabel, selected && styles.filterLabelSelected]}>{filter.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );

  if (isLoading && notifications.length === 0) {
    return <View style={styles.screen}>{filterBar}<ListSkeleton count={5} variant="notification" /></View>;
  }
  if (error && notifications.length === 0) {
    return (
      <View style={styles.screen}>
        {filterBar}
        <ErrorState description={error} onRetry={() => void loadPage(1, 'initial')} style={styles.fullState} title="Không thể tải thông báo" />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      {filterBar}
      <FlatList
        contentContainerStyle={styles.listContent}
        data={notifications}
        keyExtractor={(item) => String(item.id)}
        ListEmptyComponent={<EmptyState description={selectedFilter === 'UNREAD' ? 'Bạn đã đọc tất cả thông báo.' : undefined} preset="notifications" title={selectedFilter === 'UNREAD' ? 'Không có thông báo chưa đọc' : undefined} />}
        ListFooterComponent={notifications.length > 0 ? (
          <View style={styles.footer}>
            {isLoadingMore ? <ActivityIndicator color={colors.primary} /> : null}
            {loadMoreError ? (
              <View style={styles.loadMoreError}>
                <Text numberOfLines={2} style={styles.loadMoreErrorText}>{loadMoreError}</Text>
                <Pressable hitSlop={8} onPress={loadMore}><Text style={styles.retryText}>Tải lại</Text></Pressable>
              </View>
            ) : null}
            {!hasNextPage && !isLoadingMore ? <Text style={styles.endText}>Bạn đã xem hết thông báo</Text> : null}
          </View>
        ) : null}
        ListHeaderComponent={(
          <View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryText}>{unreadCount} thông báo chưa đọc</Text>
              <Pressable accessibilityRole="button" disabled={isMarkingAll || unreadCount === 0} onPress={() => void handleMarkAllRead()} style={({ pressed }) => [styles.readAllButton, unreadCount === 0 && styles.disabled, pressed && styles.pressed]}>
                {isMarkingAll ? <ActivityIndicator color={colors.primary} size="small" /> : <Ionicons color={colors.primary} name="checkmark-done" size={18} />}
                <Text style={styles.readAllText}>Đọc tất cả</Text>
              </Pressable>
            </View>
            {error ? (
              <View accessibilityRole="alert" style={styles.inlineError}>
                <Text numberOfLines={2} style={styles.inlineErrorText}>{error}</Text>
                <Pressable hitSlop={8} onPress={refresh}><Text style={styles.retryText}>Thử lại</Text></Pressable>
              </View>
            ) : null}
          </View>
        )}
        onEndReached={loadMore}
        onEndReachedThreshold={0.35}
        onRefresh={refresh}
        refreshing={isRefreshing}
        renderItem={({ item }) => {
          const itemPresentation = presentation[item.type];
          return (
            <NotificationItem
              icon={itemPresentation.icon}
              isUnread={!item.isRead}
              message={item.message}
              onPress={() => void handleNotificationPress(item)}
              style={pendingId === item.id ? styles.pendingItem : undefined}
              time={formatTime(item.createdAt)}
              title={item.title}
              tone={itemPresentation.tone}
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
  fullState: { flex: 1 },
  filterSection: { borderBottomWidth: 1, borderBottomColor: colors.divider, backgroundColor: colors.background },
  filterContent: { paddingHorizontal: spacing.screen, paddingVertical: spacing.md, gap: spacing.sm },
  filterChip: { minHeight: 38, justifyContent: 'center', paddingHorizontal: spacing.lg, borderWidth: 1, borderColor: colors.border, borderRadius: radius.round, backgroundColor: colors.surface },
  filterChipSelected: { borderColor: colors.primary, backgroundColor: colors.primary },
  filterLabel: { ...typography.bodySmallSemibold, color: colors.textSecondary },
  filterLabelSelected: { color: colors.textInverse },
  listContent: { flexGrow: 1, paddingBottom: spacing.huge },
  summaryRow: { minHeight: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.screen },
  summaryText: { ...typography.bodySmallSemibold, color: colors.textSecondary },
  readAllButton: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, padding: spacing.sm },
  readAllText: { ...typography.bodySmallSemibold, color: colors.primary },
  disabled: { opacity: 0.45 },
  inlineError: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, marginHorizontal: spacing.screen, marginBottom: spacing.md, borderRadius: radius.md, backgroundColor: colors.dangerSoft },
  inlineErrorText: { ...typography.caption, flex: 1, color: colors.danger },
  retryText: { ...typography.captionSemibold, color: colors.primary },
  footer: { minHeight: 64, alignItems: 'center', justifyContent: 'center', padding: spacing.md },
  loadMoreError: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  loadMoreErrorText: { ...typography.caption, flexShrink: 1, color: colors.danger },
  endText: { ...typography.caption, color: colors.textMuted },
  pendingItem: { opacity: 0.55 },
  pressed: { opacity: 0.72 },
});
