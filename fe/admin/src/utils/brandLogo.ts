// These locally sourced logos use white lettering. Custom uploads keep their own background.
const lightLogoIds = new Set([67, 71, 81, 82, 87, 89, 91, 92, 94, 96, 101, 107, 114, 117, 118, 129]);

export function brandLogoClassName(url?: string | null): string {
  const match = url?.match(/(?:^|\/)uploads\/brands\/catalog-20261007\/brand-(\d+)\.(?:svg|png|jpg|webp)(?:[?#].*)?$/);
  return match && lightLogoIds.has(Number(match[1]))
    ? 'brand-logo-cell brand-logo-cell--dark'
    : 'brand-logo-cell';
}
