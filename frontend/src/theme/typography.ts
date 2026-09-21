export const typography = {
  sizes: {
    xs: 11,
    s: 13,
    m: 15,
    l: 18,
    xl: 22,
    xxl: 28,
  },
  weights: {
    regular: "400" as const,
    medium: "500" as const,
    semibold: "600" as const,
    bold: "700" as const,
  },
};

export type Typography = typeof typography;
