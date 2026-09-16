import React, { useEffect, useState } from "react";
import { SafeAreaView, StyleSheet, TouchableOpacity, Text } from "react-native";
import { useRouter } from "expo-router";
import { logout } from "../../../services/auth";
import { getMe } from "../../../services/resources";
import { colors } from "../../theme";
import { GlassCard, RoleBottomNav, ScreenGradient } from "../../components/ui/AppChrome";

export default function MoreSettingsScreen() {
  const router = useRouter();
  const [adminNav, setAdminNav] = useState(true);

  useEffect(() => {
    getMe()
      .then((me) => setAdminNav(me.role === "admin" || me.role === "guest_admin"))
      .catch(() => setAdminNav(false));
  }, []);

  return (
    <ScreenGradient>
      <SafeAreaView style={styles.safe}>
        <Text style={styles.header}>{adminNav ? "MORE" : "SETTINGS"}</Text>
        <GlassCard style={styles.card}>
          <Text style={styles.title}>Account</Text>
          <Text style={styles.body}>Session uses the existing auth service. Attendance punch APIs are not available.</Text>
          <TouchableOpacity
            style={styles.logout}
            onPress={async () => {
              await logout();
              router.replace("/login");
            }}
          >
            <Text style={styles.logoutText}>Log out</Text>
          </TouchableOpacity>
        </GlassCard>
        <RoleBottomNav
          variant={adminNav ? "admin" : "employee"}
          activeRoute={adminNav ? "more" : "profile"}
        />
      </SafeAreaView>
    </ScreenGradient>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, paddingHorizontal: 16 },
  header: {
    fontFamily: "Inter",
    fontSize: 20,
    fontWeight: "900",
    textTransform: "uppercase",
    color: colors.onSurface,
    letterSpacing: -0.3,
    paddingTop: 8,
    marginBottom: 16,
  },
  card: { gap: 8 },
  title: { fontFamily: "Inter", fontSize: 16, fontWeight: "600", color: colors.onSurface },
  body: { fontFamily: "Inter", fontSize: 12, color: colors.secondary, lineHeight: 18 },
  logout: { marginTop: 8, minHeight: 44, justifyContent: "center" },
  logoutText: { fontFamily: "Inter", fontSize: 14, fontWeight: "600", color: colors.primary },
});
