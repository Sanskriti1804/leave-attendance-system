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
  { id: "more", label: "More", icon: "more-horiz", route: "/admin-profile" },
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
                  <MaterialIcons name={item.icon} size={18} color={colors.onPrimary} />
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
    width: 260,
    padding: 28,
    backgroundColor: colors.primary,
    gap: 6,
  },
  sidebarStacked: {
    width: "100%",
    padding: 16,
  },
  brand: {
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 2.4,
    color: colors.onPrimary,
    textTransform: "uppercase",
  },
  brandSub: { fontSize: 12, color: "rgba(255,255,255,0.62)", marginBottom: 22 },
  navList: { gap: 4 },
  navListStacked: { flexDirection: "row", flexWrap: "wrap" },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  navItemStacked: { paddingVertical: 8 },
  navItemActive: { backgroundColor: colors.accent },
  navLabel: { fontSize: 14, fontWeight: "600", color: "rgba(255,255,255,0.72)" },
  navLabelActive: { color: colors.onPrimary },
  main: { flex: 1, minWidth: 0 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 32,
    paddingVertical: 20,
  },
  back: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceContainerHigh,
  },
  title: { fontSize: 28, fontWeight: "700", color: colors.onSurface, letterSpacing: -0.8 },
  scroll: { flex: 1 },
  scrollInner: { paddingHorizontal: 32, paddingTop: 12, paddingBottom: 64 },
  canvas: { width: "100%", maxWidth: 1180, alignSelf: "center", gap: 22 },
  card: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 10,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderLeftWidth: 3,
    borderLeftColor: colors.accent,
    shadowColor: "#1A1410",
    shadowOpacity: 0.05,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
  },
});
