import { Ionicons } from "@expo/vector-icons";
import { colors } from "../src/maxstarter/theme";

/**
 * Semantic icon names for MaxStarter screens.
 * Prefer `AppIcon` over importing `@expo/vector-icons` directly in screens.
 */
export type AppIconName =
  | "home"
  | "search"
  | "profile"
  | "settings"
  | "back"
  | "close";

const ICON_MAP: Record<AppIconName, keyof typeof Ionicons.glyphMap> = {
  home: "home",
  search: "search",
  profile: "person",
  settings: "settings",
  back: "arrow-back",
  close: "close",
};

type AppIconProps = {
  name: AppIconName;
  size?: number;
  color?: string;
};

export function AppIcon({
  name,
  size = 24,
  color = colors.text,
}: AppIconProps) {
  return <Ionicons name={ICON_MAP[name]} size={size} color={color} />;
}
