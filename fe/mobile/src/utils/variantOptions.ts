import type { ProductVariant } from '@/types';

const text = (value: unknown): string => typeof value === 'string' ? value.trim() : '';
const colorAliases: Record<string, string> = {
  black: 'Đen', white: 'Trắng', red: 'Đỏ', blue: 'Xanh dương',
  grey: 'Xám', gray: 'Xám', pink: 'Hồng', graphite: 'Graphite',
};

export interface VariantOption {
  variant: ProductVariant;
  color: string | null;
  configuration: string | null;
}

/** Split only the color explicitly recorded for this exact variant. */
export const getVariantOption = (variant: ProductVariant): VariantOption => {
  const attributes = variant.attributes ?? {};
  let rawColor = text(attributes['Màu sắc']) || text(attributes.color) || text(attributes.colour);
  if (!rawColor) {
    rawColor = variant.variantName.match(/(?:^|\s\/\s)(Đen|Trắng|Đỏ|Xám|Hồng|Black|White|Red|Blue|Grey|Gray)$/i)?.[1] ?? '';
  }
  const color = rawColor ? colorAliases[rawColor.toLowerCase()] ?? rawColor : null;
  let configuration = variant.variantName.trim();
  if (rawColor) {
    const escaped = [...new Set([rawColor, color!])]
      .map((value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
    configuration = configuration.replace(new RegExp(`(?:^|\\s*/\\s*|\\s+-\\s+|\\s+)(?:Màu\\s+)?(?:${escaped})$`, 'i'), '').trim();
    // Legacy data can use an English attribute with a Vietnamese display label.
    if (configuration.toLowerCase() === color?.toLowerCase()) configuration = '';
  }
  return { variant, color, configuration: configuration || null };
};
