import { Platform, StyleSheet } from "react-native";
import { colors, radii, elevation } from "../theme";

export const webFont = Platform.OS === "web" ? "Inter, system-ui, sans-serif" : "Inter";

export const webCardChrome = {
  backgroundColor: colors.surfaceContainerLowest,
  borderRadius: radii.m,
  padding: 20,
  borderWidth: 1,
  borderColor: colors.glassBorder,
  borderLeftWidth: 3,
  borderLeftColor: colors.accent,
  ...elevation.rest,
};

export const webUi = StyleSheet.create({
  kicker: {
    fontFamily: webFont,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
    color: colors.accentDeep,
    textTransform: "uppercase",
  },
  title: {
    fontFamily: webFont,
    fontSize: 20,
    fontWeight: "700",
    color: colors.onSurface,
    letterSpacing: -0.4,
  },
  meta: {
    fontFamily: webFont,
    fontSize: 13,
    color: colors.secondary,
    lineHeight: 18,
  },
  input: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.s + 2,
    paddingHorizontal: 12,
    color: colors.onSurface,
    backgroundColor: colors.surfaceContainerLow,
    fontFamily: webFont,
    fontSize: 14,
  },
  primaryBtn: {
    minHeight: 46,
    backgroundColor: colors.accent,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    flexDirection: "row",
    gap: 8,
  },
  primaryBtnText: {
    fontFamily: webFont,
    color: colors.onPrimary,
    fontWeight: "600",
    fontSize: 15,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.surfaceContainer,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  chipOn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.accent,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  chipText: { fontFamily: webFont, fontSize: 12, fontWeight: "600", color: colors.onSurface },
  chipOnText: { fontFamily: webFont, fontSize: 12, fontWeight: "600", color: colors.onPrimary },
  link: { fontFamily: webFont, fontSize: 13, fontWeight: "700", color: colors.accentDeep },
});
