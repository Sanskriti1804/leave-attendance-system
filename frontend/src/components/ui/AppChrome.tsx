import React from "react";
import { Modal, View, Text, TouchableOpacity, StyleSheet, ViewProps, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, pageGradient } from "../../theme";

export const glassCardStyle = {
  backgroundColor: colors.surfaceContainerLowest,
  borderRadius: 12,
  borderWidth: 1,
  borderColor: colors.glassBorder,
  padding: 20,
  shadowColor: "#1A1410",
  shadowOffset: { width: 0, height: 12 },
  shadowOpacity: 0.05,
  shadowRadius: 24,
  elevation: 2,
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
  { id: "more", label: "More", icon: "more-horiz", route: "/admin-profile" },
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
                <MaterialIcons name={item.icon} size={18} color={isActive ? colors.onPrimary : colors.navInactive} />
              </View>
              <Text style={[styles.bottomNavLabel, isActive && styles.bottomNavLabelActive]}>{item.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export function ThemedDialog({
  visible,
  title,
  message,
  children,
  onRequestClose,
  actions,
}: {
  visible: boolean;
  title: string;
  message?: string;
  children?: React.ReactNode;
  onRequestClose: () => void;
  actions?: { label: string; onPress: () => void; primary?: boolean }[];
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onRequestClose}>
      <Pressable style={styles.dialogBackdrop} onPress={onRequestClose}>
        <Pressable style={styles.dialogCard} onPress={(event) => event.stopPropagation()}>
          <View style={styles.dialogHeader}>
            <Text style={styles.dialogTitle}>{title}</Text>
            <TouchableOpacity onPress={onRequestClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <MaterialIcons name="close" size={18} color={colors.secondary} />
            </TouchableOpacity>
          </View>
          {message ? <Text style={styles.dialogMessage}>{message}</Text> : null}
          {children}
          {actions?.length ? (
            <View style={styles.dialogActions}>
              {actions.map((action) => (
                <TouchableOpacity
                  key={action.label}
                  style={action.primary ? styles.dialogPrimaryBtn : styles.dialogGhostBtn}
                  onPress={action.onPress}
                >
                  <Text style={action.primary ? styles.dialogPrimaryBtnText : styles.dialogGhostBtnText}>
                    {action.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export function ThemedToast({
  message,
  onDismiss,
}: {
  message: string | null;
  onDismiss?: () => void;
}) {
  if (!message) {
    return null;
  }
  return (
    <Pressable
      pointerEvents={onDismiss ? "auto" : "none"}
      style={onDismiss ? styles.toastDismissLayer : styles.toastBox}
      onPress={onDismiss}
    >
      <View style={onDismiss ? styles.toastBox : undefined} pointerEvents="none">
        <Text style={styles.toastText}>{message}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  dialogBackdrop: {
    flex: 1,
    backgroundColor: "rgba(16,16,16,0.45)",
    justifyContent: "center",
    padding: 24,
  },
  dialogCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 10,
    padding: 22,
    gap: 14,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderLeftWidth: 4,
    borderLeftColor: colors.accent,
    shadowColor: "#1A1410",
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.14,
    shadowRadius: 36,
    elevation: 8,
  },
  dialogHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  dialogTitle: { fontFamily: "Inter", fontSize: 17, fontWeight: "600", color: colors.onSurface, flex: 1, paddingRight: 8 },
  dialogMessage: { fontFamily: "Inter", fontSize: 14, color: colors.onSurfaceVariant, lineHeight: 21 },
  dialogActions: { gap: 8, marginTop: 4 },
  dialogPrimaryBtn: {
    minHeight: 46,
    backgroundColor: colors.accent,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  dialogPrimaryBtnText: { fontFamily: "Inter", fontSize: 15, fontWeight: "600", color: colors.onPrimary },
  dialogGhostBtn: {
    minHeight: 46,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  dialogGhostBtnText: { fontFamily: "Inter", fontSize: 15, fontWeight: "500", color: colors.onSurface },
  toastDismissLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 80,
    justifyContent: "flex-end",
  },
  toastBox: {
    position: "absolute",
    left: 20,
    right: 20,
    bottom: 108,
    backgroundColor: colors.accentDeep,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    zIndex: 80,
  },
  toastText: { fontFamily: "Inter", fontSize: 13, color: colors.onPrimary, lineHeight: 18, fontWeight: "500" },
  bottomNavContainer: {
    position: "absolute",
    left: 16,
    right: 16,
    zIndex: 50,
    backgroundColor: colors.navBg,
    borderRadius: 18,
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.navBorder,
    shadowColor: "#0F766E",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 28,
    elevation: 10,
  },
  bottomNavContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    height: 58,
  },
  bottomNavItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  bottomNavIconContainer: {
    width: 36,
    height: 28,
    borderRadius: 8,
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
    letterSpacing: 0.2,
    color: colors.navInactive,
    marginTop: 2,
  },
  bottomNavLabelActive: {
    color: colors.onPrimary,
  },
});
