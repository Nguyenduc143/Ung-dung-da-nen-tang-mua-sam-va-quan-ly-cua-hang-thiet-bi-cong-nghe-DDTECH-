import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { IoniconName } from '@/components';
import {
  CartScreen,
  CategoryScreen,
  HomeScreen,
  OrdersScreen,
  ProfileScreen,
} from '@/screens';
import { useBadgeStore } from '@/stores';
import { colors, fontWeights, shadows, spacing } from '@/theme';
import { HeaderNotificationButton } from './HeaderNotificationButton';
import type { CustomerStackParamList, MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

const tabIcons: Record<keyof MainTabParamList, { active: IoniconName; inactive: IoniconName }> = {
  HomeTab: { active: 'home', inactive: 'home-outline' },
  CategoriesTab: { active: 'grid', inactive: 'grid-outline' },
  CartTab: { active: 'cart', inactive: 'cart-outline' },
  OrdersTab: { active: 'cube', inactive: 'cube-outline' },
  AccountTab: { active: 'person', inactive: 'person-outline' },
};

const formatBadgeCount = (count: number): number | string | undefined => {
  if (count <= 0) return undefined;
  return count > 99 ? '99+' : count;
};

export function MainTabNavigator() {
  const insets = useSafeAreaInsets();
  const rootNavigation = useNavigation<NativeStackNavigationProp<CustomerStackParamList>>();
  const cartItemCount = useBadgeStore((state) => state.cartItemCount);
  const unreadNotificationCount = useBadgeStore((state) => state.unreadNotificationCount);

  return (
    <Tab.Navigator
      initialRouteName="HomeTab"
      screenOptions={({ route }) => ({
        headerRight: () => (
          <HeaderNotificationButton
            count={unreadNotificationCount}
            onPress={() => rootNavigation.navigate('Notifications')}
          />
        ),
        headerRightContainerStyle: { paddingRight: spacing.screen },
        headerShadowVisible: false,
        headerStyle: { backgroundColor: colors.background },
        headerTitleAlign: 'left',
        headerTitleStyle: { color: colors.textPrimary, fontWeight: fontWeights.bold },
        tabBarActiveTintColor: colors.primary,
        tabBarBadgeStyle: {
          backgroundColor: colors.primary,
          color: colors.textInverse,
          fontWeight: fontWeights.semibold,
        },
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarHideOnKeyboard: true,
        tabBarIcon: ({ color, focused, size }) => {
          const icon = tabIcons[route.name];
          return <Ionicons color={color} name={focused ? icon.active : icon.inactive} size={size} />;
        },
        tabBarLabelStyle: { fontSize: 12, fontWeight: fontWeights.medium },
        tabBarStyle: {
          minHeight: 64 + insets.bottom,
          paddingTop: spacing.sm,
          paddingBottom: Math.max(insets.bottom, spacing.sm),
          borderTopWidth: 0,
          backgroundColor: colors.surface,
          ...shadows.floating,
        },
      })}
    >
      <Tab.Screen
        component={HomeScreen}
        name="HomeTab"
        options={{ headerShown: false, title: 'Trang chủ' }}
      />
      <Tab.Screen component={CategoryScreen} name="CategoriesTab" options={{ title: 'Danh mục' }} />
      <Tab.Screen
        component={CartScreen}
        name="CartTab"
        options={{ tabBarBadge: formatBadgeCount(cartItemCount), title: 'Giỏ hàng' }}
      />
      <Tab.Screen component={OrdersScreen} name="OrdersTab" options={{ title: 'Đơn hàng' }} />
      <Tab.Screen component={ProfileScreen} name="AccountTab" options={{ title: 'Tài khoản' }} />
    </Tab.Navigator>
  );
}
