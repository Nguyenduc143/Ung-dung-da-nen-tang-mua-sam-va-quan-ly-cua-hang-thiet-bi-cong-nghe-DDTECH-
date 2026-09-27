import * as SecureStore from 'expo-secure-store';

import { AUTH_SESSION_STORAGE_KEY } from '@/constants';
import type { TokenPair } from '@/types';

export type AuthSessionClearReason = 'expired' | 'invalid' | 'logout';
export type AuthSessionClearedListener = (reason: AuthSessionClearReason) => void;
export type AuthTokensChangedListener = (tokens: TokenPair | null) => void;

interface StoredTokenPair extends TokenPair {
  version: 1;
}

const sessionClearedListeners = new Set<AuthSessionClearedListener>();
const tokensChangedListeners = new Set<AuthTokensChangedListener>();

let cachedTokens: StoredTokenPair | null | undefined;
let readRequest: Promise<StoredTokenPair | null> | null = null;

const isStoredTokenPair = (value: unknown): value is StoredTokenPair => {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<StoredTokenPair>;
  return candidate.version === 1
    && typeof candidate.accessToken === 'string'
    && candidate.accessToken.length > 0
    && typeof candidate.refreshToken === 'string'
    && candidate.refreshToken.length > 0;
};

const removeInvalidStoredSession = async (): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync(AUTH_SESSION_STORAGE_KEY);
  } catch {
    // The invalid in-memory value is still discarded even if native storage is unavailable.
  }
};

const readStoredTokens = async (): Promise<StoredTokenPair | null> => {
  if (cachedTokens !== undefined) return cachedTokens;
  if (readRequest) return readRequest;

  readRequest = (async () => {
    try {
      const rawValue = await SecureStore.getItemAsync(AUTH_SESSION_STORAGE_KEY);
      if (!rawValue) {
        cachedTokens = null;
        return null;
      }

      const parsedValue: unknown = JSON.parse(rawValue);
      if (!isStoredTokenPair(parsedValue)) {
        cachedTokens = null;
        await removeInvalidStoredSession();
        return null;
      }

      cachedTokens = parsedValue;
      return parsedValue;
    } catch {
      cachedTokens = null;
      await removeInvalidStoredSession();
      return null;
    }
  })().finally(() => {
    readRequest = null;
  });

  return readRequest;
};

const notifySessionCleared = (reason: AuthSessionClearReason): void => {
  sessionClearedListeners.forEach((listener) => {
    try {
      listener(reason);
    } catch {
      // One subscriber must not prevent other session listeners from running.
    }
  });
};

const notifyTokensChanged = (tokens: TokenPair | null): void => {
  tokensChangedListeners.forEach((listener) => {
    try {
      listener(tokens);
    } catch {
      // Token persistence must not fail because a UI subscriber throws.
    }
  });
};

export const getStoredTokenPair = async (): Promise<TokenPair | null> => readStoredTokens();

export const getAccessToken = async (): Promise<string | null> => (
  (await readStoredTokens())?.accessToken ?? null
);

export const getRefreshToken = async (): Promise<string | null> => (
  (await readStoredTokens())?.refreshToken ?? null
);

export const hasStoredSession = async (): Promise<boolean> => (await readStoredTokens()) !== null;

export const saveTokenPair = async (tokens: TokenPair): Promise<void> => {
  const storedTokens: StoredTokenPair = {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    version: 1,
  };

  await SecureStore.setItemAsync(AUTH_SESSION_STORAGE_KEY, JSON.stringify(storedTokens));
  cachedTokens = storedTokens;
  notifyTokensChanged(storedTokens);
};

export const clearAuthSession = async (
  reason: AuthSessionClearReason = 'invalid',
  notify = true,
): Promise<void> => {
  const hadSession = (await readStoredTokens()) !== null;
  cachedTokens = null;

  try {
    await SecureStore.deleteItemAsync(AUTH_SESSION_STORAGE_KEY);
  } finally {
    notifyTokensChanged(null);
    if (notify && hadSession) notifySessionCleared(reason);
  }
};

export const subscribeToAuthSessionCleared = (
  listener: AuthSessionClearedListener,
): (() => void) => {
  sessionClearedListeners.add(listener);
  return () => sessionClearedListeners.delete(listener);
};

export const subscribeToAuthTokensChanged = (
  listener: AuthTokensChangedListener,
): (() => void) => {
  tokensChangedListeners.add(listener);
  return () => tokensChangedListeners.delete(listener);
};
