import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { colors, pageGradient } from "../theme";
import type { AdminNavId, EmployeeNavId } from "../components/ui/AppChrome";

const ADMIN_ITEMS: { id: AdminNavId; label: string; icon: keyof typeof MaterialIcons.glyphMap; route: string }[] = [
  { id: "home", label: "Dashboard", icon: "dashboard", route: "/admin" },
  { id: "leave", label: "Leave review", icon: "event-available", route: "/leave/admin-review" },
  { id: "people", label: "People", icon: "group", route: "/people" },
  { id: "reports", label: "Reports", icon: "query-stats", route: "/reports" },
  { id: "more", label: "More", icon: "more-horiz", route: "/settings" },
];

const EMPLOYEE_ITEMS: { id: EmployeeNavId; label: string; icon: keyof typeof MaterialIcons.glyphMap; route: string }[] = [
  { id: "home", label: "Home", icon: "dashboard", route: "/(tabs)" },
  { id: "leave", label: "Leave", icon: "event-available", route: "/leave/list" },
  { id: "attendance", label: "Attendance", icon: "fingerprint", route: "/(tabs)/attendance" },
  { id: "notifications", label: "Alerts", icon: "notifications", route: "/(tabs)/notifications" },
  { id: "profile", label: "Profile", icon: "badge", route: "/(tabs)/profile" },
];

export function WebShell({
  title,
  variant,
  activeRoute,
  showBack,
  children,
}: {
  title: string;
  variant: "admin" | "employee";
  activeRoute: AdminNavId | EmployeeNavId;
  showBack?: boolean;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const stacked = width < 900;
  const items = variant === "admin" ? ADMIN_ITEMS : EMPLOYEE_ITEMS;

  return (
    <LinearGradient
      colors={[...pageGradient.colors]}
      locations={[...pageGradient.locations]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.fill}
    >
      <View style={[styles.frame, stacked && styles.frameStacked]}>
        <View style={[styles.sidebar, stacked && styles.sidebarStacked]}>
          <Text style={styles.brand}>LAMS SCG</Text>
          <Text style={styles.brandSub}>{variant === "admin" ? "HR Operations" : "Employee portal"}</Text>
          <View style={[styles.navList, stacked && styles.navListStacked]}>
            {items.map((item) => {
              const active = item.id === activeRoute;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.navItem, active && styles.navItemActive, stacked && styles.navItemStacked]}
                  onPress={() => {
                    if (!active) {
                      router.push(item.route as never);
                    }
                  }}
                >
                  <MaterialIcons name={item.icon} size={18} color={active ? colors.onPrimary : colors.onSurface} />
                  <Text style={[styles.navLabel, active && styles.navLabelActive]}>{item.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
        <View style={styles.main}>
          <View style={styles.topBar}>
            {showBack ? (
              <TouchableOpacity style={styles.back} onPress={() => router.back()}>
                <MaterialIcons name="arrow-back" size={18} color={colors.onSurface} />
              </TouchableOpacity>
            ) : null}
            <Text style={styles.title}>{title}</Text>
          </View>
          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollInner}>
            <View style={styles.canvas}>{children}</View>
          </ScrollView>
        </View>
      </View>
    </LinearGradient>
  );
}

export function WebCard({ children, style }: { children: React.ReactNode; style?: object }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  frame: { flex: 1, flexDirection: "row" },
  frameStacked: { flexDirection: "column" },
  sidebar: {
    width: 240,
    padding: 20,
    backgroundColor: "rgba(255,255,255,0.55)",
    borderRightWidth: 1,
    borderRightColor: colors.border,
    gap: 8,
  },
  sidebarStacked: {
    width: "100%",
    borderRightWidth: 0,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  brand: { fontSize: 16, fontWeight: "800", letterSpacing: 1.4, color: colors.onSurface },
  brandSub: { fontSize: 12, color: colors.secondary, marginBottom: 12 },
  navList: { gap: 6 },
  navListStacked: { flexDirection: "row", flexWrap: "wrap" },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  navItemStacked: { paddingVertical: 8 },
  navItemActive: { backgroundColor: colors.primary },
  navLabel: { fontSize: 14, fontWeight: "600", color: colors.onSurface },
  navLabelActive: { color: colors.onPrimary },
  main: { flex: 1, minWidth: 0 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 28,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.08)",
  },
  back: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceContainerHigh,
  },
  title: { fontSize: 22, fontWeight: "700", color: colors.onSurface },
  scroll: { flex: 1 },
  scrollInner: { padding: 28, paddingBottom: 48 },
  canvas: { width: "100%", maxWidth: 1120, alignSelf: "center", gap: 16 },
  card: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 1 },
  },
});
