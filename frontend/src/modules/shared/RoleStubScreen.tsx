import React from "react";
import { View, Text, StyleSheet, SafeAreaView } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { colors } from "../../theme";
import { GlassCard, RoleBottomNav, ScreenGradient, type AdminNavId, type EmployeeNavId } from "../../components/ui/AppChrome";
import { TopNavBar, useTopNavContentInset } from "../../components/ui/AdminComponents";

export function RoleStubScreen({
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
  const topInset = useTopNavContentInset();
  return (
    <ScreenGradient>
      <SafeAreaView style={styles.safe}>
        <TopNavBar title={title} />
        <View style={[styles.body, { paddingTop: topInset }]}>
          <GlassCard style={styles.card}>
            <MaterialIcons name={icon} size={22} color={colors.secondary} />
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.copy}>{body}</Text>
          </GlassCard>
        </View>
        <RoleBottomNav variant={variant} activeRoute={activeRoute} />
      </SafeAreaView>
    </ScreenGradient>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    fontFamily: "Inter",
    fontSize: 20,
    fontWeight: "900",
    textTransform: "uppercase",
    color: colors.onSurface,
    letterSpacing: -0.3,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  body: { flex: 1, paddingHorizontal: 16, paddingTop: 8 },
  card: { gap: 8 },
  title: { fontFamily: "Inter", fontSize: 18, fontWeight: "600", color: colors.onSurface },
  copy: { fontFamily: "Inter", fontSize: 12, color: colors.secondary, lineHeight: 18 },
});
