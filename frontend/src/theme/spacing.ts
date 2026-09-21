export const spacing = {
  xs: 4,
  s: 8,
  m: 16,
  l: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

export const radii = {
  s: 6,
  m: 10,
  l: 14,
  xl: 18,
  round: 9999,
};

export const motion = {
  fast: 160,
  base: 280,
  slow: 420,
  stagger: 48,
};

export const elevation = {
  rest: {
    shadowColor: "#1A1410",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 22,
    elevation: 3,
  },
  raised: {
    shadowColor: "#1A1410",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.1,
    shadowRadius: 32,
    elevation: 8,
  },
};

export type Spacing = typeof spacing;
export type Radii = typeof radii;
