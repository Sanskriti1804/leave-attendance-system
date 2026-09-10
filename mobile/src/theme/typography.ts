export const typography = {
  sizes: {
    xs: 12,
    s: 14,
    m: 16,
    l: 20,
    xl: 24,
    xxl: 32,
  },
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
};

export type Typography = typeof typography;
