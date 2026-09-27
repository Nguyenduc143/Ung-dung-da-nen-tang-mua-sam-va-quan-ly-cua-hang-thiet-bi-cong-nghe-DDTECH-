import type { TextStyle } from 'react-native';

export const fontSizes = {
  caption: 12,
  bodySmall: 14,
  body: 16,
  bodyLarge: 18,
  titleSmall: 20,
  title: 24,
  titleLarge: 30,
  display: 36,
} as const;

export const fontWeights = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
} as const satisfies Record<string, NonNullable<TextStyle['fontWeight']>>;

export const typography = {
  display: { fontSize: fontSizes.display, lineHeight: 44, fontWeight: fontWeights.extrabold },
  titleLarge: { fontSize: fontSizes.titleLarge, lineHeight: 38, fontWeight: fontWeights.bold },
  title: { fontSize: fontSizes.title, lineHeight: 32, fontWeight: fontWeights.bold },
  titleSmall: { fontSize: fontSizes.titleSmall, lineHeight: 28, fontWeight: fontWeights.semibold },
  bodyLarge: { fontSize: fontSizes.bodyLarge, lineHeight: 26, fontWeight: fontWeights.regular },
  body: { fontSize: fontSizes.body, lineHeight: 24, fontWeight: fontWeights.regular },
  bodyMedium: { fontSize: fontSizes.body, lineHeight: 24, fontWeight: fontWeights.medium },
  bodySemibold: { fontSize: fontSizes.body, lineHeight: 24, fontWeight: fontWeights.semibold },
  bodySmall: { fontSize: fontSizes.bodySmall, lineHeight: 20, fontWeight: fontWeights.regular },
  bodySmallSemibold: { fontSize: fontSizes.bodySmall, lineHeight: 20, fontWeight: fontWeights.semibold },
  caption: { fontSize: fontSizes.caption, lineHeight: 16, fontWeight: fontWeights.regular },
  captionSemibold: { fontSize: fontSizes.caption, lineHeight: 16, fontWeight: fontWeights.semibold },
} as const satisfies Record<string, TextStyle>;
