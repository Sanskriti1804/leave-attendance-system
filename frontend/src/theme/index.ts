import { colors, pageGradient, inkGradient } from "./colors";
import { spacing, radii, motion, elevation } from "./spacing";
import { typography } from "./typography";

export const theme = {
  colors,
  spacing,
  radii,
  typography,
  pageGradient,
  inkGradient,
  motion,
  elevation,
};

export { colors, pageGradient, inkGradient } from "./colors";
export { spacing, radii, motion, elevation } from "./spacing";
export { typography } from "./typography";

export type Theme = typeof theme;
