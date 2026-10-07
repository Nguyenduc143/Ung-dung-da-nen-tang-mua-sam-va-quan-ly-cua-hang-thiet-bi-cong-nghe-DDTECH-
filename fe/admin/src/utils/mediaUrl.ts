/** Resolve backend-owned uploads using the configured API host, not the admin host. */
export const resolveMediaUrl = (
  value: string | null | undefined,
  apiBaseUrl: string | undefined = import.meta.env.VITE_API_URL,
): string | undefined => {
  const url = value?.trim();
  if (!url) return undefined;
  if (!apiBaseUrl) return url;

  try {
    const apiOrigin = new URL(apiBaseUrl, window.location.origin).origin;
    const parsed = new URL(url, `${apiOrigin}/`);
    if (parsed.pathname === '/uploads' || parsed.pathname.startsWith('/uploads/')) {
      return `${apiOrigin}${parsed.pathname}${parsed.search}${parsed.hash}`;
    }
  } catch {
    return url;
  }

  // Keep third-party images and local blob/data previews unchanged.
  return url;
};
