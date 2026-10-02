import { createHmac, timingSafeEqual } from 'node:crypto';

export type VnpayParams = Record<string, string>;

const encodeForm = (value: string): string => encodeURIComponent(value)
  .replace(/%20/g, '+')
  .replace(/[!'()*]/g, (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`);

export const serializeVnpayParams = (params: VnpayParams): string => Object.entries(params)
  .filter(([, value]) => value !== '')
  .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
  .map(([key, value]) => `${encodeForm(key)}=${encodeForm(value)}`)
  .join('&');

export const signVnpayParams = (params: VnpayParams, secret: string): string => createHmac('sha512', secret)
  .update(serializeVnpayParams(params), 'utf8')
  .digest('hex');

export const buildVnpayUrl = (
  paymentUrl: string,
  params: VnpayParams,
  secret: string,
): string => {
  const query = serializeVnpayParams(params);
  const signature = createHmac('sha512', secret).update(query, 'utf8').digest('hex');
  return `${paymentUrl}?${query}&vnp_SecureHash=${signature}`;
};

export const normalizeVnpayQuery = (query: Record<string, unknown>): VnpayParams => {
  const params: VnpayParams = {};
  for (const [key, value] of Object.entries(query)) {
    if (!key.startsWith('vnp_') || key === 'vnp_SecureHashType') continue;
    if (typeof value === 'string') params[key] = value;
  }
  return params;
};

export const verifyVnpaySignature = (
  paramsWithSignature: VnpayParams,
  secret: string,
): boolean => {
  const signature = paramsWithSignature.vnp_SecureHash;
  if (!signature || !/^[a-fA-F0-9]{128}$/.test(signature)) return false;

  const params = { ...paramsWithSignature };
  delete params.vnp_SecureHash;
  const expected = signVnpayParams(params, secret);
  const actualBuffer = Buffer.from(signature.toLowerCase(), 'hex');
  const expectedBuffer = Buffer.from(expected, 'hex');
  return actualBuffer.length === expectedBuffer.length
    && timingSafeEqual(actualBuffer, expectedBuffer);
};

export const formatVnpayDate = (date: Date): string => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? '';
  return `${part('year')}${part('month')}${part('day')}${part('hour')}${part('minute')}${part('second')}`;
};

export const addMinutes = (date: Date, minutes: number): Date => new Date(date.getTime() + minutes * 60_000);

export const normalizeIpAddress = (value: string | undefined): string => {
  if (!value || value === '::1') return '127.0.0.1';
  const first = value.split(',')[0]?.trim() || '127.0.0.1';
  return first.startsWith('::ffff:') ? first.slice(7) : first;
};

export const createVnpayTransactionReference = (orderId: number, now = new Date()): string => (
  `D${orderId}T${now.getTime()}`
);

export const getOrderIdFromTransactionReference = (reference: string): number | null => {
  const match = /^D([1-9]\d*)T\d+$/.exec(reference);
  if (!match) return null;
  const orderId = Number(match[1]);
  return Number.isSafeInteger(orderId) ? orderId : null;
};
