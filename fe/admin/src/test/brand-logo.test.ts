import { describe, expect, it } from 'vitest';
import { brandLogoClassName } from '../utils/brandLogo';

describe('brand logo presentation', () => {
  it('gives white catalog logos a dark background', () => {
    expect(brandLogoClassName('/uploads/brands/catalog-20261007/brand-71.png')).toContain('--dark');
    expect(brandLogoClassName('http://localhost:5000/uploads/brands/catalog-20261007/brand-117.svg')).toContain('--dark');
  });
  it('keeps colored logos and replacement uploads on the normal background', () => {
    expect(brandLogoClassName('/uploads/brands/catalog-20261007/brand-1.svg')).toBe('brand-logo-cell');
    expect(brandLogoClassName('/uploads/brands/custom-71.png')).toBe('brand-logo-cell');
    expect(brandLogoClassName(null)).toBe('brand-logo-cell');
    expect(brandLogoClassName('blob:local-preview')).toBe('brand-logo-cell');
  });
});
