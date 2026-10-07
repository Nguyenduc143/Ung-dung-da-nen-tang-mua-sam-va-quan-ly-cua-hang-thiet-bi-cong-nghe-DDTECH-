import { describe, expect, it, vi } from 'vitest';
import { resolveMediaUrl } from '../utils/mediaUrl';

describe('resolveMediaUrl', () => {
  const apiUrl = 'http://localhost:5000/api';

  it('serves relative uploaded images from the API host', () => {
    expect(resolveMediaUrl('/uploads/catalog-real-260-20261007/product-590.jpg', apiUrl))
      .toBe('http://localhost:5000/uploads/catalog-real-260-20261007/product-590.jpg');
    expect(resolveMediaUrl('uploads/product.png', apiUrl))
      .toBe('http://localhost:5000/uploads/product.png');
  });

  it('rewrites an old uploads host while preserving query strings and fragments', () => {
    expect(resolveMediaUrl('http://192.168.0.1:5000/uploads/a.jpg?v=2#preview', 'https://example.ngrok.app/api/'))
      .toBe('https://example.ngrok.app/uploads/a.jpg?v=2#preview');
  });

  it('preserves third-party images and upload previews', () => {
    for (const url of ['https://cdn.example.com/a.jpg', 'blob:http://localhost:5173/preview', 'data:image/png;base64,AAAA']) {
      expect(resolveMediaUrl(url, apiUrl)).toBe(url);
    }
    expect(resolveMediaUrl('https://cdn.example.com/uploads-other/a.jpg', apiUrl))
      .toBe('https://cdn.example.com/uploads-other/a.jpg');
  });

  it('handles missing values and invalid configuration', () => {
    for (const value of [null, undefined, '', '  ']) expect(resolveMediaUrl(value, apiUrl)).toBeUndefined();
    expect(resolveMediaUrl(' /uploads/a.jpg ', '')).toBe('/uploads/a.jpg');
    expect(resolveMediaUrl('/uploads/a.jpg', 'http://[')).toBe('/uploads/a.jpg');
  });

  it('reads the configured API URL by default', () => {
    vi.stubEnv('VITE_API_URL', 'https://backend.example.com/api');
    try { expect(resolveMediaUrl('/uploads/a.png')).toBe('https://backend.example.com/uploads/a.png'); }
    finally { vi.unstubAllEnvs(); }
  });

  it('supports a same-origin API proxy', () => {
    expect(resolveMediaUrl('/uploads/a.jpg', '/api'))
      .toBe(`${window.location.origin}/uploads/a.jpg`);
  });
});
