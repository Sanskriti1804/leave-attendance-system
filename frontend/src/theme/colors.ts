export const colors = {
  primary: "#000000",
  onPrimary: "#ffffff",
  secondary: "#585f6c",
  background: "#fcf9f8",
  surface: "#fcf9f8",
  surfaceContainerLowest: "#ffffff",
  surfaceContainerLow: "#f6f3f2",
  surfaceContainer: "#f0edec",
  surfaceContainerHigh: "#ebe7e7",
  surfaceContainerHighest: "#e5e2e1",
  onSurface: "#1c1b1b",
  onSurfaceVariant: "#4c4546",
  text: "#1c1b1b",
  textSecondary: "#585f6c",
  border: "rgba(0, 0, 0, 0.15)",
  error: "#ba1a1a",
  white: "#ffffff",
  black: "#000000",
  transparent: "transparent",
  glass: "rgb(222, 223, 227)",
  glassBorder: "rgba(0, 0, 0, 0.15)",
  navBg: "#111111",
  navInactive: "#9ca3af",
  navActiveIconBg: "#2A2A2E",
  navBorder: "rgba(255, 255, 255, 0.08)",
};

export const pageGradient = {
  colors: ["rgba(0, 168, 153, 0.45)", "rgba(240, 248, 252, 0.75)", "rgba(38, 169, 225, 0.48)"] as const,
  locations: [0, 0.5, 1] as const,
};

export type Colors = typeof colors;
