import { createNavigationContainerRef } from '@react-navigation/native';

import { useAuthStore } from '@/stores';
import type { RootStackParamList } from './types';

export const rootNavigationRef = createNavigationContainerRef<RootStackParamList>();

export function requireLogin(): boolean {
  if (useAuthStore.getState().isAuthenticated) return true;
  if (rootNavigationRef.isReady()) rootNavigationRef.navigate('Auth');
  return false;
}
