import React, { useEffect, useRef } from "react";
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { colors, radii } from "../../theme";

export function FadeIn({
  delay = 0,
  children,
  style,
}: {
  delay?: number;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translate = useRef(new Animated.Value(10)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 320, delay, useNativeDriver: true }),
      Animated.timing(translate, { toValue: 0, duration: 320, delay, useNativeDriver: true }),
    ]).start();
  }, [delay, opacity, translate]);
  return (
    <Animated.View style={[{ opacity, transform: [{ translateY: translate }] }, style]}>
      {children}
    </Animated.View>
  );
}

export function PressScale({
  onPress,
  disabled,
  children,
  style,
}: {
  onPress?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      onPressIn={() => Animated.spring(scale, { toValue: 0.98, useNativeDriver: true, speed: 40, bounciness: 0 }).start()}
      onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 40, bounciness: 0 }).start()}
    >
      <Animated.View style={[{ transform: [{ scale }] }, style]}>{children}</Animated.View>
    </Pressable>
  );
}

export function Kicker({ children, tone = "ink" }: { children: string; tone?: "ink" | "teal" }) {
  return (
    <Text style={[styles.kicker, tone === "teal" && { color: colors.accentDeep }]}>{children}</Text>
  );
}

export function StatusChip({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: "neutral" | "teal" | "ok" | "warn" | "bad" | "ink";
}) {
  const map = {
    neutral: { bg: colors.surfaceContainer, fg: colors.onSurfaceVariant },
    teal: { bg: colors.accentWash, fg: colors.accentDeep },
    ok: { bg: colors.successWash, fg: colors.success },
    warn: { bg: colors.warningWash, fg: colors.warning },
    bad: { bg: "rgba(180,35,24,0.1)", fg: colors.error },
    ink: { bg: colors.primary, fg: colors.onPrimary },
  }[tone];
  return (
    <View style={[styles.chip, { backgroundColor: map.bg }]}>
      <Text style={[styles.chipText, { color: map.fg }]}>{label}</Text>
    </View>
  );
}

export function EmptyPanel({
  icon,
  title,
  copy,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  copy: string;
}) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyMark} />
      <MaterialIcons name={icon} size={22} color={colors.accent} />
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyCopy}>{copy}</Text>
    </View>
  );
}

export function leaveTone(status: string): "ok" | "warn" | "bad" | "teal" | "neutral" {
  if (status === "APPROVED") return "ok";
  if (status === "REJECTED" || status === "CANCELLED") return "bad";
  if (status === "DRAFT" || status === "WITHDRAWN") return "neutral";
  if (status === "PENDING_HR_REVIEW") return "warn";
  return "teal";
}

const styles = StyleSheet.create({
  kicker: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 2,
    textTransform: "uppercase",
    color: colors.onSurfaceVariant,
  },
  chip: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.s,
  },
  chipText: { fontSize: 11, fontWeight: "700", letterSpacing: 0.4, textTransform: "uppercase" },
  empty: {
    paddingVertical: 36,
    paddingHorizontal: 22,
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: colors.accentWash,
    borderRadius: radii.m,
    overflow: "hidden",
  },
  emptyMark: {
    position: "absolute",
    right: -20,
    top: -24,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(15,118,110,0.12)",
  },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: colors.onSurface, letterSpacing: -0.3 },
  emptyCopy: { fontSize: 14, color: colors.onSurfaceVariant, lineHeight: 21, maxWidth: 420 },
});
