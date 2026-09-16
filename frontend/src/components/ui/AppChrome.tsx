import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ViewProps } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, pageGradient } from "../../theme";

export const glassCardStyle = {
  backgroundColor: colors.glass,
  borderRadius: 16,
  borderWidth: 1,
  borderColor: colors.glassBorder,
  padding: 16,
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 20 },
  shadowOpacity: 0.1,
  shadowRadius: 25,
  elevation: 5,
} as const;

export function ScreenGradient({ children }: { children: React.ReactNode }) {
  return (
    <LinearGradient
      colors={[...pageGradient.colors]}
      locations={[...pageGradient.locations]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.fill}
    >
      {children}
    </LinearGradient>
  );
}

export function GlassCard({ children, style, ...props }: ViewProps) {
  return (
    <View style={[glassCardStyle, style]} {...props}>
      {children}
    </View>
  );
}

export type AdminNavId = "home" | "leave" | "people" | "reports" | "more";
export type EmployeeNavId = "home" | "leave" | "attendance" | "notifications" | "profile";

const ADMIN_ITEMS: { id: AdminNavId; label: string; icon: keyof typeof MaterialIcons.glyphMap; route: string }[] = [
  { id: "home", label: "Home", icon: "dashboard", route: "/admin" },
  { id: "leave", label: "Leave", icon: "event-available", route: "/leave/admin-review" },
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

export function RoleBottomNav({
  variant,
  activeRoute,
}: {
  variant: "admin" | "employee";
  activeRoute: AdminNavId | EmployeeNavId;
}) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const items = variant === "admin" ? ADMIN_ITEMS : EMPLOYEE_ITEMS;

  return (
    <View style={[styles.bottomNavContainer, { bottom: Math.max(insets.bottom, 16) }]}>
      <View style={styles.bottomNavContent}>
        {items.map((item) => {
          const isActive = activeRoute === item.id;
          return (
            <TouchableOpacity
              key={item.id}
              style={styles.bottomNavItem}
              onPress={() => {
                if (!isActive) {
                  router.push(item.route as never);
                }
              }}
              activeOpacity={0.7}
            >
              <View style={[styles.bottomNavIconContainer, isActive && styles.bottomNavIconContainerActive]}>
                <MaterialIcons name={item.icon} size={20} color={isActive ? colors.onPrimary : colors.navInactive} />
              </View>
              <Text style={[styles.bottomNavLabel, isActive && styles.bottomNavLabelActive]}>{item.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  bottomNavContainer: {
    position: "absolute",
    left: 16,
    right: 16,
    zIndex: 50,
    backgroundColor: colors.navBg,
    borderRadius: 9999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.navBorder,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 30,
    elevation: 8,
  },
  bottomNavContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    height: 56,
  },
  bottomNavItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  bottomNavIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  bottomNavIconContainerActive: {
    backgroundColor: colors.navActiveIconBg,
  },
  bottomNavLabel: {
    fontFamily: "Inter",
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: colors.navInactive,
    marginTop: 2,
  },
  bottomNavLabelActive: {
    color: colors.onPrimary,
  },
});
