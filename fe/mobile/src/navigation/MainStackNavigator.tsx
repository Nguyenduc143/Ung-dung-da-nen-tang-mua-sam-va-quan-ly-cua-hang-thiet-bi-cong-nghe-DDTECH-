import { useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import {
  AddressFormScreen,
  AddressListScreen,
  ChangePasswordScreen,
  CheckoutScreen,
  EditProfileScreen,
  FavoritesScreen,
  NotificationsScreen,
  OrderDetailScreen,
  OrderReviewProductsScreen,
  ProductDetailScreen,
  ProductListScreen,
  ReviewsScreen,
  SearchScreen,
  WriteReviewScreen,
} from '@/screens';
import { colors, fontWeights } from '@/theme';
import { getUnreadNotificationCount } from '@/api/notifications.api';
import { useAuthStore, useBadgeStore, useCartStore, useFavoriteStore } from '@/stores';
import { connectRealtime, disconnectRealtime } from '@/socket';
import { MainTabNavigator } from './MainTabNavigator';
import { withAuthRequired } from './withAuthRequired';
import type { CustomerStackParamList } from './types';

const Stack = createNativeStackNavigator<CustomerStackParamList>();

const ProtectedFavorites = withAuthRequired(FavoritesScreen);
const ProtectedAddressList = withAuthRequired(AddressListScreen);
const ProtectedAddressForm = withAuthRequired(AddressFormScreen);
const ProtectedCheckout = withAuthRequired(CheckoutScreen);
const ProtectedOrderDetail = withAuthRequired(OrderDetailScreen);
const ProtectedOrderReviewProducts = withAuthRequired(OrderReviewProductsScreen);
const ProtectedNotifications = withAuthRequired(NotificationsScreen);
const ProtectedWriteReview = withAuthRequired(WriteReviewScreen);
const ProtectedEditProfile = withAuthRequired(EditProfileScreen);
const ProtectedChangePassword = withAuthRequired(ChangePasswordScreen);

export function MainStackNavigator() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const accessToken = useAuthStore((state) => state.accessToken);
  const loadFavorites = useFavoriteStore((state) => state.loadFavorites);
  const loadCart = useCartStore((state) => state.loadCart);
  const setUnreadNotificationCount = useBadgeStore((state) => state.setUnreadNotificationCount);

  useEffect(() => {
    void loadCart(true).catch(() => undefined);
    if (!isAuthenticated) return;
    void loadFavorites().catch(() => undefined);
    void getUnreadNotificationCount()
      .then(setUnreadNotificationCount)
      .catch(() => undefined);
  }, [isAuthenticated, loadCart, loadFavorites, setUnreadNotificationCount]);

  useEffect(() => {
    if (!accessToken) {
      disconnectRealtime();
      return undefined;
    }
    connectRealtime(accessToken);
    return disconnectRealtime;
  }, [accessToken]);

  return (
    <Stack.Navigator
      initialRouteName="MainTabs"
      screenOptions={{
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: colors.background },
        headerBackButtonDisplayMode: 'minimal',
        headerShadowVisible: false,
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.textPrimary,
        headerTitleStyle: { fontWeight: fontWeights.bold },
      }}
    >
      <Stack.Screen component={MainTabNavigator} name="MainTabs" options={{ headerShown: false }} />
      <Stack.Screen component={ProductListScreen} name="ProductList" options={{ title: 'Sản phẩm' }} />
      <Stack.Screen component={ProductDetailScreen} name="ProductDetail" options={{ title: 'Chi tiết sản phẩm' }} />
      <Stack.Screen component={SearchScreen} name="Search" options={{ title: 'Tìm kiếm' }} />
      <Stack.Screen component={ProtectedFavorites} name="Favorites" options={{ title: 'Sản phẩm yêu thích' }} />
      <Stack.Screen component={ProtectedAddressList} name="AddressList" options={{ title: 'Địa chỉ giao hàng' }} />
      <Stack.Screen component={ProtectedAddressForm} name="AddressForm" options={{ title: 'Thông tin địa chỉ' }} />
      <Stack.Screen component={ProtectedCheckout} name="Checkout" options={{ title: 'Thanh toán' }} />
      <Stack.Screen component={ProtectedOrderDetail} name="OrderDetail" options={{ title: 'Chi tiết đơn hàng' }} />
      <Stack.Screen component={ProtectedOrderReviewProducts} name="OrderReviewProducts" options={{ title: 'Sản phẩm cần đánh giá' }} />
      <Stack.Screen component={ProtectedNotifications} name="Notifications" options={{ title: 'Thông báo' }} />
      <Stack.Screen component={ReviewsScreen} name="Reviews" options={{ title: 'Đánh giá sản phẩm' }} />
      <Stack.Screen component={ProtectedWriteReview} name="WriteReview" options={{ title: 'Viết đánh giá' }} />
      <Stack.Screen component={ProtectedEditProfile} name="EditProfile" options={{ title: 'Thông tin cá nhân' }} />
      <Stack.Screen component={ProtectedChangePassword} name="ChangePassword" options={{ title: 'Đổi mật khẩu' }} />
    </Stack.Navigator>
  );
}
