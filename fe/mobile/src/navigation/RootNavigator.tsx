import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { DefaultTheme, NavigationContainer, type Theme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useAuthStore } from '@/stores';
import { colors } from '@/theme';
import { AuthLoadingScreen } from './AuthLoadingScreen';
import { AuthNavigator } from './AuthNavigator';
import { MainStackNavigator } from './MainStackNavigator';
import { rootNavigationRef } from './authNavigation';
import type { RootStackParamList } from './types';
import { FloatingChatButton } from './FloatingChatButton';

const Stack = createNativeStackNavigator<RootStackParamList>();

const navigationTheme: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primary,
    background: colors.background,
    card: colors.surface,
    text: colors.textPrimary,
    border: colors.border,
    notification: colors.primary,
  },
};

export function RootNavigator() {
  const [routeName, setRouteName] = useState('HomeTab');
  const updateRoute = () => setRouteName(rootNavigationRef.getCurrentRoute()?.name ?? 'HomeTab');
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isInitialized = useAuthStore((state) => state.isInitialized);
  const restoreSession = useAuthStore((state) => state.restoreSession);

  useEffect(() => {
    void restoreSession();
  }, [restoreSession]);

  if (!isInitialized) return <AuthLoadingScreen />;

  return (
    <NavigationContainer ref={rootNavigationRef} theme={navigationTheme} onReady={updateRoute} onStateChange={updateRoute}>
      <View style={{ flex: 1 }}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen component={MainStackNavigator} name="Customer" />
        {!isAuthenticated ? (
          <Stack.Screen
            component={AuthNavigator}
            name="Auth"
            options={{ headerShown: true, title: 'Đăng nhập', headerBackButtonDisplayMode: 'minimal' }}
          />
        ) : null}
      </Stack.Navigator>
      <FloatingChatButton routeName={routeName} />
      </View>
    </NavigationContainer>
  );
}
