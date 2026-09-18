import React from "react";
import { Text, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { colors } from "../theme";
import { WebCard, WebShell } from "./WebShell";
import type { AdminNavId, EmployeeNavId } from "../components/ui/AppChrome";

export function WebStubScreen({
  title,
  body,
  variant,
  activeRoute,
  icon = "info",
}: {
  title: string;
  body: string;
  variant: "admin" | "employee";
  activeRoute: AdminNavId | EmployeeNavId;
  icon?: keyof typeof MaterialIcons.glyphMap;
}) {
  return (
    <WebShell title={title} variant={variant} activeRoute={activeRoute}>
      <WebCard>
        <MaterialIcons name={icon} size={22} color={colors.secondary} />
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.copy}>{body}</Text>
      </WebCard>
    </WebShell>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 18, fontWeight: "600", color: colors.onSurface, marginTop: 8 },
  copy: { fontSize: 14, color: colors.secondary, lineHeight: 20, marginTop: 6, maxWidth: 640 },
});
