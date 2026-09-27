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
  ProductDetailScreen,
  ProductListScreen,
  ReviewsScreen,
  SearchScreen,
  WriteReviewScreen,
} from '@/screens';
import { colors, fontWeights } from '@/theme';
import { useCartStore, useFavoriteStore } from '@/stores';
import { MainTabNavigator } from './MainTabNavigator';
import type { CustomerStackParamList } from './types';

const Stack = createNativeStackNavigator<CustomerStackParamList>();

export function MainStackNavigator() {
  const loadFavorites = useFavoriteStore((state) => state.loadFavorites);
  const loadCart = useCartStore((state) => state.loadCart);

  useEffect(() => {
    void loadFavorites().catch(() => undefined);
    void loadCart().catch(() => undefined);
  }, [loadCart, loadFavorites]);

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
      <Stack.Screen component={FavoritesScreen} name="Favorites" options={{ title: 'Sản phẩm yêu thích' }} />
      <Stack.Screen component={AddressListScreen} name="AddressList" options={{ title: 'Địa chỉ giao hàng' }} />
      <Stack.Screen component={AddressFormScreen} name="AddressForm" options={{ title: 'Thông tin địa chỉ' }} />
      <Stack.Screen component={CheckoutScreen} name="Checkout" options={{ title: 'Thanh toán' }} />
      <Stack.Screen component={OrderDetailScreen} name="OrderDetail" options={{ title: 'Chi tiết đơn hàng' }} />
      <Stack.Screen component={NotificationsScreen} name="Notifications" options={{ title: 'Thông báo' }} />
      <Stack.Screen component={ReviewsScreen} name="Reviews" options={{ title: 'Đánh giá sản phẩm' }} />
      <Stack.Screen component={WriteReviewScreen} name="WriteReview" options={{ title: 'Viết đánh giá' }} />
      <Stack.Screen component={EditProfileScreen} name="EditProfile" options={{ title: 'Thông tin cá nhân' }} />
      <Stack.Screen component={ChangePasswordScreen} name="ChangePassword" options={{ title: 'Đổi mật khẩu' }} />
    </Stack.Navigator>
  );
}
