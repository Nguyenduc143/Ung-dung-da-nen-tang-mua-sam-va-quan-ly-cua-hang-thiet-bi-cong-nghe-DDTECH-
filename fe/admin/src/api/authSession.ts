import type { TokenPair } from '../types/auth';

const STORAGE_KEY = 'ddtech.admin.tokens';

export const AUTH_SESSION_CLEARED_EVENT = 'ddtech:auth-session-cleared';

export type AuthSessionClearReason = 'logout' | 'expired' | 'invalid';

interface StoredTokenPair extends TokenPair {
  version: 1;
}

let cachedTokens: StoredTokenPair | null | undefined;
let persistTokens = true;

const hasBrowserStorage = (): boolean => typeof window !== 'undefined' && Boolean(window.localStorage);

const isStoredTokenPair = (value: unknown): value is StoredTokenPair => {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<StoredTokenPair>;
  return candidate.version === 1
    && typeof candidate.accessToken === 'string'
    && candidate.accessToken.length > 0
    && typeof candidate.refreshToken === 'string'
    && candidate.refreshToken.length > 0;
};

const readStoredTokens = (): StoredTokenPair | null => {
  if (cachedTokens !== undefined) return cachedTokens;
  if (!hasBrowserStorage()) return null;

  try {
    const localValue = window.localStorage.getItem(STORAGE_KEY);
    const sessionValue = window.sessionStorage.getItem(STORAGE_KEY);
    const rawValue = localValue ?? sessionValue;
    persistTokens = Boolean(localValue);
    const parsedValue: unknown = rawValue ? JSON.parse(rawValue) : null;
    cachedTokens = isStoredTokenPair(parsedValue) ? parsedValue : null;
    if (rawValue && !cachedTokens) {
      window.localStorage.removeItem(STORAGE_KEY);
      window.sessionStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    cachedTokens = null;
    window.localStorage.removeItem(STORAGE_KEY);
  }

  return cachedTokens;
};

export const getAccessToken = (): string | null => readStoredTokens()?.accessToken ?? null;

export const getRefreshToken = (): string | null => readStoredTokens()?.refreshToken ?? null;

export const saveTokenPair = (tokens: TokenPair, persistent = persistTokens): void => {
  persistTokens = persistent;
  cachedTokens = {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    version: 1,
  };
  if (hasBrowserStorage()) {
    const primaryStorage = persistent ? window.localStorage : window.sessionStorage;
    const secondaryStorage = persistent ? window.sessionStorage : window.localStorage;
    primaryStorage.setItem(STORAGE_KEY, JSON.stringify(cachedTokens));
    secondaryStorage.removeItem(STORAGE_KEY);
  }
};

export const clearAuthSession = (
  reason: AuthSessionClearReason = 'invalid',
  notify = true,
): void => {
  cachedTokens = null;
  if (!hasBrowserStorage()) return;

  window.localStorage.removeItem(STORAGE_KEY);
  window.sessionStorage.removeItem(STORAGE_KEY);
  if (notify) {
    window.dispatchEvent(new CustomEvent<AuthSessionClearReason>(
      AUTH_SESSION_CLEARED_EVENT,
      { detail: reason },
    ));
  }
};

export const hasStoredSession = (): boolean => readStoredTokens() !== null;
