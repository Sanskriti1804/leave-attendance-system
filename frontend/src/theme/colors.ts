export const colors = {
  // ─────────────────────────────────────────────
  // Core Emerald + Navy palette
  // ─────────────────────────────────────────────
  primary: "#059669",
  onPrimary: "#FFFFFF",

  secondary: "#334155",

  background: "#F8FAFC",
  surface: "#FFFFFF",

  surfaceContainerLowest: "#FFFFFF",
  surfaceContainerLow: "#F8FAFC",
  surfaceContainer: "#F1F5F9",
  surfaceContainerHigh: "#E2E8F0",
  surfaceContainerHighest: "#CBD5E1",

  // ─────────────────────────────────────────────
  // Text
  // ─────────────────────────────────────────────
  onSurface: "#0F172A",
  onSurfaceVariant: "#334155",

  text: "#0F172A",
  textSecondary: "#334155",

  // ─────────────────────────────────────────────
  // Borders
  // ─────────────────────────────────────────────
  border: "#E2E8F0",

  // ─────────────────────────────────────────────
  // Basic colors
  // ─────────────────────────────────────────────
  white: "#FFFFFF",
  black: "#0F172A",
  transparent: "transparent",

  // ─────────────────────────────────────────────
  // Glass / translucent surfaces
  // ─────────────────────────────────────────────
  glass: "rgba(255, 255, 255, 0.92)",
  glassBorder: "rgba(15, 23, 42, 0.08)",

  // ─────────────────────────────────────────────
  // Navigation
  // ─────────────────────────────────────────────
  navBg: "#0F172A",
  navInactive: "#94A3B8",
  navActiveIconBg: "#059669",
  navBorder: "rgba(255, 255, 255, 0.10)",

  // ─────────────────────────────────────────────
  // Attendance session colors
  // ─────────────────────────────────────────────
  secondaryFixedDim: "#CBD5E1",

  sessionFullDay: "#059669",
  sessionHalfDay: "#CBD5E1",
  sessionFirstHalf: "#10B981",
  sessionSecondHalf: "#0F766E",

  // ─────────────────────────────────────────────
  // Headers / overlays
  // ─────────────────────────────────────────────
  headerScrim: "rgba(248, 250, 252, 0.94)",

  // ─────────────────────────────────────────────
  // Emerald accents
  // ─────────────────────────────────────────────
  accent: "#10B981",
  accentMuted: "rgba(16, 185, 129, 0.14)",
  accentDeep: "#047857",
  accentWash: "#ECFDF5",

  // ─────────────────────────────────────────────
  // Supporting neutral colors
  // ─────────────────────────────────────────────
  inkWash: "rgba(15, 23, 42, 0.06)",
  sand: "#E2E8F0",
  mist: "#E0F2FE",
  indigoWash: "rgba(139, 92, 246, 0.12)",

  // ─────────────────────────────────────────────
  // Status colors
  // ─────────────────────────────────────────────
  success: "#16A34A",
  successWash: "rgba(22, 163, 74, 0.12)",

  warning: "#F59E0B",
  warningWash: "rgba(245, 158, 11, 0.12)",

  error: "#DC2626",
};

export const pageGradient = {
  colors: ["#F8FAFC", "#ECFDF5", "#F8FAFC", "#EFF6FF"] as const,
  locations: [0, 0.34, 0.68, 1] as const,
};

export const inkGradient = {
  colors: ["#0F172A", "#059669"] as const,
  locations: [0, 1] as const,
};

export type Colors = typeof colors;