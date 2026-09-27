import Constants from 'expo-constants';

const normalizeHttpUrl = (value: string | undefined, variableName: string): string => {
  const normalized = value?.trim().replace(/\/+$/, '');
  if (!normalized || !/^https?:\/\/[^\s]+$/i.test(normalized)) {
    throw new Error(`Thiếu hoặc sai biến môi trường ${variableName}`);
  }
  return normalized;
};

const isPrivateHost = (hostname: string): boolean => {
  const normalized = hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (normalized === 'localhost' || normalized === '127.0.0.1' || normalized === '::1') {
    return true;
  }
  if (/^10\./.test(normalized) || /^192\.168\./.test(normalized)) return true;

  const match = normalized.match(/^172\.(\d{1,2})\./);
  return Boolean(match && Number(match[1]) >= 16 && Number(match[1]) <= 31);
};

const getHostname = (value: string | null | undefined): string | null => {
  if (!value) return null;
  try {
    const url = new URL(/^[a-z][a-z\d+.-]*:\/\//i.test(value) ? value : `http://${value}`);
    return url.hostname || null;
  } catch {
    return null;
  }
};

const getMetroHostname = (): string | null => {
  if (!__DEV__) return null;
  return getHostname(
    Constants.expoConfig?.hostUri
      ?? Constants.platform?.hostUri
      ?? Constants.linkingUri,
  );
};

const useMetroHostInDevelopment = (configuredUrl: string): string => {
  const metroHostname = getMetroHostname();
  if (!metroHostname || !isPrivateHost(metroHostname)) return configuredUrl;

  try {
    const url = new URL(configuredUrl);
    if (!isPrivateHost(url.hostname)) return configuredUrl;
    const normalizedHost = metroHostname.replace(/^\[|\]$/g, '');
    const host = normalizedHost.includes(':') ? `[${normalizedHost}]` : normalizedHost;
    const port = url.port ? `:${url.port}` : '';
    return `${url.protocol}//${host}${port}${url.pathname}${url.search}${url.hash}`
      .replace(/\/+$/, '');
  } catch {
    return configuredUrl;
  }
};

const configuredApiUrl = normalizeHttpUrl(
  process.env.EXPO_PUBLIC_API_URL,
  'EXPO_PUBLIC_API_URL',
);
const configuredSocketUrl = normalizeHttpUrl(
  process.env.EXPO_PUBLIC_SOCKET_URL,
  'EXPO_PUBLIC_SOCKET_URL',
);

export const API_BASE_URL = useMetroHostInDevelopment(configuredApiUrl);
export const SOCKET_BASE_URL = useMetroHostInDevelopment(configuredSocketUrl);
