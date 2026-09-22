import React, { useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { colors, pageGradient } from "../theme";
import type { AdminNavId, EmployeeNavId } from "../components/ui/AppChrome";
import { ProfileIcon } from "../components/ui/AdminComponents";
import { webCardChrome, webFont } from "./webUi";

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

function ensureWebCss() {
  if (Platform.OS !== "web" || typeof document === "undefined") {
    return;
  }
  if (document.getElementById("lams-web-chrome")) {
    return;
  }
  const el = document.createElement("style");
  el.id = "lams-web-chrome";
  el.textContent = `
    html, body, #root { background: ${colors.background}; font-family: Inter, system-ui, sans-serif; }
    input, textarea { outline: none; transition: box-shadow 160ms ease, border-color 160ms ease; }
    input:focus, textarea:focus { box-shadow: 0 0 0 3px ${colors.accentMuted}; border-color: ${colors.accent} !important; }
    [tabindex], a, button, [role="button"] { cursor: pointer; }
    [role="button"]:hover, a:hover { opacity: 0.92; }
  `;
  document.head.appendChild(el);
}

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
  const stacked = width < 960;
  const compact = width < 720;
  const items = variant === "admin" ? ADMIN_ITEMS : EMPLOYEE_ITEMS;

  useEffect(() => {
    ensureWebCss();
  }, []);

  return (
    <LinearGradient
      colors={[...pageGradient.colors]}
      locations={[...pageGradient.locations]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.fill}
    >
      <View style={[styles.frame, stacked && styles.frameStacked]}>
        <View style={[styles.sidebarWrap, stacked && styles.sidebarWrapStacked]}>
          <View style={[styles.sidebar, stacked && styles.sidebarStacked]}>
            {!stacked ? (
              <View style={styles.brandBlock}>
                <Text style={styles.brand}>LAMS SCG</Text>
                <Text style={styles.brandSub}>{variant === "admin" ? "HR Operations" : "Employee portal"}</Text>
              </View>
            ) : null}
            <View style={[styles.navList, stacked && styles.navListStacked]}>
              {items.map((item) => {
                const active = item.id === activeRoute;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.navItem, stacked && styles.navItemStacked]}
                    onPress={() => {
                      if (!active) {
                        router.push(item.route as never);
                      }
                    }}
                    accessibilityRole="button"
                  >
                    <View style={[styles.navIcon, active && styles.navIconActive]}>
                      <MaterialIcons
                        name={item.icon}
                        size={18}
                        color={active ? colors.onPrimary : colors.navInactive}
                      />
                    </View>
                    <Text style={[styles.navLabel, active && styles.navLabelActive]} numberOfLines={1}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
        <View style={styles.main}>
          <View style={[styles.topBar, compact && styles.topBarCompact]}>
            {showBack ? (
              <TouchableOpacity style={styles.back} onPress={() => router.back()} accessibilityRole="button">
                <MaterialIcons name="arrow-back" size={18} color={colors.onSurface} />
              </TouchableOpacity>
            ) : null}
            <View style={styles.titleBlock}>
              <Text style={styles.kicker}>{variant === "admin" ? "HR Operations" : "Employee"}</Text>
              <Text style={styles.title} numberOfLines={1}>
                {title}
              </Text>
            </View>
            <ProfileIcon />
          </View>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={[styles.scrollInner, compact && styles.scrollInnerCompact, stacked && { paddingBottom: 28 }]}
          >
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
  sidebarWrap: { padding: 16, paddingRight: 0 },
  sidebarWrapStacked: { padding: 12, paddingBottom: 0 },
  sidebar: {
    width: 228,
    flex: 1,
    paddingVertical: 20,
    paddingHorizontal: 12,
    backgroundColor: colors.navBg,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.navBorder,
    gap: 6,
    shadowColor: "#0F766E",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 28,
  },
  sidebarStacked: {
    width: "100%",
    flex: 0,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 18,
  },
  brandBlock: { paddingHorizontal: 10, paddingBottom: 16, gap: 4 },
  brand: {
    fontFamily: webFont,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 2.2,
    color: colors.onPrimary,
    textTransform: "uppercase",
  },
  brandSub: { fontFamily: webFont, fontSize: 12, color: colors.navInactive },
  navList: { gap: 4 },
  navListStacked: { flexDirection: "row", justifyContent: "space-between" },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  navItemStacked: { flex: 1, flexDirection: "column", gap: 4, paddingVertical: 6 },
  navIcon: {
    width: 36,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  navIconActive: { backgroundColor: colors.navActiveIconBg },
  navLabel: {
    fontFamily: webFont,
    fontSize: 13,
    fontWeight: "600",
    color: colors.navInactive,
  },
  navLabelActive: { color: colors.onPrimary },
  main: { flex: 1, minWidth: 0 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 28,
    paddingTop: 18,
    paddingBottom: 8,
  },
  topBarCompact: { paddingHorizontal: 16 },
  back: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  titleBlock: { flex: 1, minWidth: 0 },
  kicker: {
    fontFamily: webFont,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.4,
    color: colors.accentDeep,
    textTransform: "uppercase",
  },
  title: {
    fontFamily: webFont,
    fontSize: 22,
    fontWeight: "700",
    color: colors.onSurface,
    letterSpacing: -0.4,
  },
  scroll: { flex: 1 },
  scrollInner: { paddingHorizontal: 28, paddingTop: 8, paddingBottom: 48 },
  scrollInnerCompact: { paddingHorizontal: 16 },
  canvas: { width: "100%", maxWidth: 1220, alignSelf: "center", gap: 16 },
  card: webCardChrome,
});
