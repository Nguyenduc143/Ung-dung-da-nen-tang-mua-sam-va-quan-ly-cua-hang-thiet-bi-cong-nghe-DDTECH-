const apiUrl = process.env.EXPO_PUBLIC_API_URL?.trim();

const getApiOrigin = (): string => {
  if (!apiUrl) return '';
  try {
    return new URL(apiUrl).origin;
  } catch {
    return '';
  }
};

const apiOrigin = getApiOrigin();

/**
 * Uploaded media may have been persisted with localhost or an old LAN host.
 * Always serve backend-owned `/uploads` paths from the API host configured for this device.
 */
export const resolveMediaUrl = (value: string | null | undefined): string | null => {
  const url = value?.trim();
  if (!url) return null;
  if (!apiOrigin) return url;

  try {
    const parsed = new URL(url, `${apiOrigin}/`);
    if (parsed.pathname === '/uploads' || parsed.pathname.startsWith('/uploads/')) {
      return `${apiOrigin}${parsed.pathname}${parsed.search}${parsed.hash}`;
    }
  } catch {
    return url;
  }

  return url;
};
