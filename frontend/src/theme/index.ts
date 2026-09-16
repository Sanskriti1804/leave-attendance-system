import { colors, pageGradient } from "./colors";
import { spacing, radii } from "./spacing";
import { typography } from "./typography";

export const theme = {
  colors,
  spacing,
  radii,
  typography,
  pageGradient,
};

export { colors, pageGradient } from "./colors";
export { spacing, radii } from "./spacing";
export { typography } from "./typography";

export type Theme = typeof theme;
