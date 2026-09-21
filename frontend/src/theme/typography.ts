export const typography = {
  sizes: {
    xs: 11,
    s: 13,
    m: 15,
    l: 18,
    xl: 22,
    xxl: 32,
    display: 40,
  },
  weights: {
    regular: "400" as const,
    medium: "500" as const,
    semibold: "600" as const,
    bold: "700" as const,
  },
  tracking: {
    tight: -0.6,
    kicker: 1.8,
  },
};

export type Typography = typeof typography;
