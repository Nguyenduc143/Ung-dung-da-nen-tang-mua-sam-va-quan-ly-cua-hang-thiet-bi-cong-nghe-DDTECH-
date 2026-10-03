import { useCallback, useState, type ReactNode } from 'react';
import { Ionicons } from '@expo/vector-icons';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { getApiErrorMessage } from '@/api/axiosClient';
import { getProfile } from '@/api/users.api';
import { ErrorState, LoadingSkeleton } from '@/components';
import type { CustomerStackParamList, MainTabParamList } from '@/navigation/types';
import { useAuthStore } from '@/stores';
import { colors, radius, shadows, spacing, typography } from '@/theme';
import type { UserProfile } from '@/types';

type Props = BottomTabScreenProps<MainTabParamList, 'AccountTab'>;

interface MenuItemProps {
  icon: ReactNode;
  label: string;
  onPress: () => void;
  subtitle?: string;
  tone?: 'default' | 'danger';
}

function MenuItem({ icon, label, onPress, subtitle, tone = 'default' }: MenuItemProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.menuItem, pressed && styles.pressed]}
    >
      <View style={[styles.menuIcon, tone === 'danger' && styles.dangerIcon]}>{icon}</View>
      <View style={styles.menuContent}>
        <Text style={[styles.menuLabel, tone === 'danger' && styles.dangerLabel]}>{label}</Text>
        {subtitle ? <Text style={styles.menuSubtitle}>{subtitle}</Text> : null}
      </View>
      <Ionicons color={tone === 'danger' ? colors.danger : colors.textMuted} name="chevron-forward" size={20} />
    </Pressable>
  );
}

function ProfileSkeleton() {
  return (
    <View style={styles.skeleton}>
      <View style={styles.skeletonProfile}>
        <LoadingSkeleton borderRadius={radius.round} height={88} width={88} />
        <LoadingSkeleton height={22} width="52%" />
        <LoadingSkeleton height={16} width="66%" />
      </View>
      <LoadingSkeleton height={290} />
      <LoadingSkeleton height={180} />
    </View>
  );
}

export function ProfileScreen({ navigation }: Props) {
  const rootNavigation = navigation.getParent<NativeStackNavigationProp<CustomerStackParamList>>();
  const storedUser = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const logout = useAuthStore((state) => state.logout);
  const logoutAll = useAuthStore((state) => state.logoutAll);
  const isSubmitting = useAuthStore((state) => state.isSubmitting);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getProfile();
      setProfile(data);
      setUser(data);
      setError(null);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Không thể tải thông tin tài khoản.'));
    } finally {
      setIsLoading(false);
    }
  }, [setUser]);

  useFocusEffect(useCallback(() => {
    void loadProfile();
  }, [loadProfile]));

  const confirmLogout = () => {
    Alert.alert('Đăng xuất?', 'Bạn sẽ cần đăng nhập lại để tiếp tục mua sắm.', [
      { style: 'cancel', text: 'Hủy' },
      { style: 'destructive', text: 'Đăng xuất', onPress: () => void logout() },
    ]);
  };

  const confirmLogoutAll = () => {
    Alert.alert('Đăng xuất khỏi mọi thiết bị?', 'Tất cả phiên đăng nhập hiện tại sẽ bị thu hồi.', [
      { style: 'cancel', text: 'Hủy' },
      {
        style: 'destructive',
        text: 'Đăng xuất tất cả',
        onPress: () => void logoutAll().catch((requestError) => {
          Alert.alert('Không thể đăng xuất', getApiErrorMessage(requestError));
        }),
      },
    ]);
  };

  if (isLoading && !profile) return <ProfileSkeleton />;
  if (error && !profile && !storedUser) {
    return <ErrorState description={error} onRetry={() => void loadProfile()} style={styles.fullState} title="Không thể tải tài khoản" />;
  }

  const user = profile ?? storedUser;
  if (!user) return null;

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.profileCard}>
        <View style={styles.avatarContainer}>
          {user.avatarUrl ? (
            <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
          ) : (
            <Text style={styles.avatarText}>{user.fullName.trim().charAt(0).toUpperCase()}</Text>
          )}
        </View>
        <Text style={styles.name}>{user.fullName}</Text>
        <Text style={styles.email}>{user.email}</Text>
        {user.phone ? <Text style={styles.phone}>{user.phone}</Text> : null}
        <Pressable
          onPress={() => rootNavigation?.navigate('EditProfile')}
          style={({ pressed }) => [styles.editButton, pressed && styles.pressed]}
        >
          <Ionicons color={colors.primary} name="create-outline" size={18} />
          <Text style={styles.editButtonText}>Chỉnh sửa thông tin</Text>
        </Pressable>
      </View>

      {error ? (
        <Pressable accessibilityRole="alert" onPress={() => void loadProfile()} style={styles.inlineError}>
          <Text style={styles.inlineErrorText}>{error}</Text>
          <Text style={styles.retryText}>Thử lại</Text>
        </Pressable>
      ) : null}

      <View style={styles.menuGroup}>
        <MenuItem icon={<Ionicons color={colors.primary} name="person-outline" size={22} />} label="Thông tin cá nhân" onPress={() => rootNavigation?.navigate('EditProfile')} />
        <View style={styles.divider} />
        <MenuItem icon={<Ionicons color={colors.primary} name="location-outline" size={22} />} label="Địa chỉ giao hàng" onPress={() => rootNavigation?.navigate('AddressList')} />
        <View style={styles.divider} />
        <MenuItem icon={<Ionicons color={colors.primary} name="cube-outline" size={22} />} label="Đơn hàng của tôi" onPress={() => navigation.navigate('OrdersTab')} />
        <View style={styles.divider} />
        <MenuItem icon={<Ionicons color={colors.primary} name="heart-outline" size={22} />} label="Sản phẩm yêu thích" onPress={() => rootNavigation?.navigate('Favorites')} />
        <View style={styles.divider} />
        <MenuItem icon={<Ionicons color={colors.primary} name="notifications-outline" size={22} />} label="Thông báo" onPress={() => rootNavigation?.navigate('Notifications')} />
      </View>

      <View style={styles.menuGroup}>
        <MenuItem icon={<Ionicons color={colors.primary} name="key-outline" size={22} />} label="Đổi mật khẩu" onPress={() => rootNavigation?.navigate('ChangePassword')} />
        <View style={styles.divider} />
        <MenuItem icon={<Ionicons color={colors.danger} name="log-out-outline" size={22} />} label={isSubmitting ? 'Đang đăng xuất...' : 'Đăng xuất'} onPress={confirmLogout} tone="danger" />
        <View style={styles.divider} />
        <MenuItem icon={<Ionicons color={colors.danger} name="phone-portrait-outline" size={22} />} label="Đăng xuất mọi thiết bị" onPress={confirmLogoutAll} subtitle="Thu hồi tất cả phiên đăng nhập" tone="danger" />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  fullState: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.screen, paddingBottom: spacing.huge, gap: spacing.lg, backgroundColor: colors.background },
  profileCard: { alignItems: 'center', padding: spacing.xxl, borderRadius: radius.xl, backgroundColor: colors.surface, ...shadows.card },
  avatarContainer: { width: 92, height: 92, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderWidth: 3, borderColor: colors.primaryBorder, borderRadius: radius.round, backgroundColor: colors.primarySoft },
  avatar: { width: '100%', height: '100%' },
  avatarText: { ...typography.titleLarge, color: colors.primary },
  name: { ...typography.titleSmall, color: colors.textPrimary, marginTop: spacing.lg },
  email: { ...typography.bodySmall, color: colors.textSecondary, marginTop: spacing.xs },
  phone: { ...typography.bodySmall, color: colors.textSecondary, marginTop: spacing.xxs },
  editButton: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, marginTop: spacing.lg, borderRadius: radius.round, backgroundColor: colors.primarySoft },
  editButtonText: { ...typography.bodySmallSemibold, color: colors.primary },
  inlineError: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.dangerSoft },
  inlineErrorText: { ...typography.caption, flex: 1, color: colors.danger },
  retryText: { ...typography.captionSemibold, color: colors.danger },
  menuGroup: { overflow: 'hidden', borderRadius: radius.lg, backgroundColor: colors.surface, ...shadows.card },
  menuItem: { minHeight: 68, flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  menuIcon: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md, backgroundColor: colors.primarySoft },
  dangerIcon: { backgroundColor: colors.dangerSoft },
  menuContent: { flex: 1 },
  menuLabel: { ...typography.bodySemibold, color: colors.textPrimary },
  dangerLabel: { color: colors.danger },
  menuSubtitle: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xxs },
  divider: { height: 1, marginLeft: 68, backgroundColor: colors.divider },
  pressed: { opacity: 0.68 },
  skeleton: { flex: 1, padding: spacing.screen, gap: spacing.lg, backgroundColor: colors.background },
  skeletonProfile: { alignItems: 'center', gap: spacing.md, padding: spacing.xxl, borderRadius: radius.xl, backgroundColor: colors.surface },
});
