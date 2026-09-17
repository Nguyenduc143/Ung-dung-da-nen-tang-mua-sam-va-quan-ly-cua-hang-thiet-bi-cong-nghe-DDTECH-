import { useEffect } from 'react';

import { AUTH_SESSION_CLEARED_EVENT } from '../api/authSession';
import { useAuthStore } from '../stores/authStore';

export const useAuthBootstrap = (): void => {
  const initialize = useAuthStore((state) => state.initialize);
  const resetSession = useAuthStore((state) => state.resetSession);

  useEffect(() => {
    void initialize();

    const handleSessionCleared = () => resetSession();
    window.addEventListener(AUTH_SESSION_CLEARED_EVENT, handleSessionCleared);
    return () => window.removeEventListener(AUTH_SESSION_CLEARED_EVENT, handleSessionCleared);
  }, [initialize, resetSession]);
};
