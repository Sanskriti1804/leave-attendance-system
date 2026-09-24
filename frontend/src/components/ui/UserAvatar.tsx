import React, { useEffect, useState } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors } from "../../theme";
import { getProfilePhotoUri, subscribeProfilePhotos } from "../../../services/profilePhoto";

export function employeeInitials(employee?: { firstName?: string | null; lastName?: string | null } | null, fallback = "—"): string {
  const first = employee?.firstName?.trim() ?? "";
  const last = employee?.lastName?.trim() ?? "";
  if (!first && !last) {
    return fallback;
  }
  const firstParts = first.split(/\s+/).filter(Boolean);
  const a = firstParts[0]?.[0] ?? "";
  const b = last[0] ?? firstParts[1]?.[0] ?? "";
  return `${a}${b}`.toUpperCase() || fallback;
}

export function UserAvatar({
  employee,
  size = 40,
  fallback = "—",
  onPress,
}: {
  employee?: { employeeId?: number; firstName?: string | null; lastName?: string | null } | null;
  size?: number;
  fallback?: string;
  onPress?: () => void;
}) {
  const [, setTick] = useState(0);
  useEffect(() => subscribeProfilePhotos(() => setTick((value) => value + 1)), []);
  const uri = getProfilePhotoUri(employee?.employeeId);
  const initials = employeeInitials(employee, fallback);
  const body = uri ? (
    <Image source={{ uri }} style={{ width: size, height: size }} />
  ) : (
    <Text style={[styles.text, { fontSize: Math.max(11, size * 0.38) }]}>{initials}</Text>
  );
  const frameStyle = [styles.frame, { width: size, height: size, borderRadius: size / 2 }];
  if (onPress) {
    return (
      <TouchableOpacity style={frameStyle} onPress={onPress} accessibilityRole="button">
        {body}
      </TouchableOpacity>
    );
  }
  return <View style={frameStyle}>{body}</View>;
}

const styles = StyleSheet.create({
  frame: {
    backgroundColor: colors.surfaceContainerHigh,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  text: {
    fontWeight: "700",
    color: colors.onSurface,
  },
});
