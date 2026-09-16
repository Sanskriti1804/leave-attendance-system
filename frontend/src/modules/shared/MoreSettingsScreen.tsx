import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { logout } from "../../../services/auth";
import {
  apiErrorMessage,
  changePassword,
  getMe,
  getOrgSettings,
  type OrganisationSettings,
} from "../../../services/resources";
import { colors } from "../../theme";
import { ScreenGradient, ThemedDialog } from "../../components/ui/AppChrome";
import { BottomNavBar, TopNavBar, useTopNavContentInset } from "../../components/ui/AdminComponents";
import { EmployeeBottomNavBar } from "../../components/ui/EmployeeComponents";

export default function MoreSettingsScreen() {
  const router = useRouter();
  const topInset = useTopNavContentInset();
  const [role, setRole] = useState<string>("employee");
  const [settings, setSettings] = useState<OrganisationSettings | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [dialog, setDialog] = useState<{ title: string; message: string } | null>(null);

  const adminNav = role === "admin" || role === "guest_admin";

  useEffect(() => {
    getMe()
      .then((me) => setRole(me.role))
      .catch(() => setRole("employee"));
    getOrgSettings()
      .then(setSettings)
      .catch(() => setSettings(null));
  }, []);

  const onChangePassword = async () => {
    setSavingPassword(true);
    try {
      await changePassword({ currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setShowPassword(false);
      setDialog({ title: "Password updated", message: "Use the new password the next time you sign in." });
    } catch (err) {
      setDialog({ title: "Could not change password", message: apiErrorMessage(err) });
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <ScreenGradient>
      <SafeAreaView style={styles.safe}>
        <TopNavBar title={adminNav ? "More" : "Settings"} />
        <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: topInset }]} showsVerticalScrollIndicator={false}>
          {adminNav ? (
            <View style={styles.card}>
              <Text style={styles.section}>Account & organisation</Text>
              <TouchableOpacity style={styles.row} onPress={() => router.push("/admin-profile" as never)}>
                <View style={styles.iconWrap}>
                  <MaterialIcons name="badge" size={18} color={colors.onSurface} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle}>Admin / Guest Admin Profile</Text>
                  <Text style={styles.rowSub}>Role, privileges, and identity</Text>
                </View>
                <MaterialIcons name="chevron-right" size={20} color={colors.secondary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.row} onPress={() => router.push("/org-settings" as never)}>
                <View style={styles.iconWrap}>
                  <MaterialIcons name="apartment" size={18} color={colors.onSurface} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle}>Organisation Settings</Text>
                  <Text style={styles.rowSub}>Timezone, shifts, grace periods & leave policies</Text>
                </View>
                <MaterialIcons name="chevron-right" size={20} color={colors.secondary} />
              </TouchableOpacity>
            </View>
          ) : null}

          <View style={styles.card}>
            <View style={styles.cardHead}>
              <Text style={styles.section}>Attendance Preferences</Text>
              <View style={styles.lockRow}>
                <MaterialIcons name="lock" size={14} color={colors.secondary} />
                <Text style={styles.lock}>Configured and managed by organization policy</Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <MaterialIcons name="public" size={18} color={colors.onSurface} />
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>Organization Timezone</Text>
                <Text style={styles.rowSub}>{settings?.timezone ?? "America/New_York (EST)"}</Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <MaterialIcons name="schedule" size={18} color={colors.onSurface} />
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>Standard Shift</Text>
                <Text style={styles.rowSub}>
                  {settings?.workStart ?? "09:00"} - {settings?.workEnd ?? "18:00"} EST
                </Text>
              </View>
            </View>
            <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
              <MaterialIcons name="date-range" size={18} color={colors.onSurface} />
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>Work Week</Text>
                <Text style={styles.rowSub}>
                  {settings?.weeklyOffDow?.length
                    ? `Weekly off ISO DOW: ${settings.weeklyOffDow.join(", ")}`
                    : "Monday – Friday 5D"}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.section}>Security</Text>
            <TouchableOpacity style={styles.row} onPress={() => setShowPassword((v) => !v)}>
              <View style={styles.iconWrap}>
                <MaterialIcons name="key" size={18} color={colors.onSurface} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>Change Password</Text>
                <Text style={styles.rowSub}>Update the password used to sign in.</Text>
              </View>
              <MaterialIcons name={showPassword ? "expand-less" : "expand-more"} size={20} color={colors.secondary} />
            </TouchableOpacity>
            {showPassword ? (
              <View style={styles.passwordBox}>
                <TextInput
                  style={styles.input}
                  placeholder="Current password"
                  placeholderTextColor={colors.secondary}
                  secureTextEntry
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                />
                <TextInput
                  style={styles.input}
                  placeholder="New password"
                  placeholderTextColor={colors.secondary}
                  secureTextEntry
                  value={newPassword}
                  onChangeText={setNewPassword}
                />
                <TouchableOpacity style={styles.save} onPress={onChangePassword} disabled={savingPassword}>
                  <Text style={styles.saveText}>{savingPassword ? "Updating…" : "Update password"}</Text>
                </TouchableOpacity>
              </View>
            ) : null}
            <View style={styles.infoRow}>
              <MaterialIcons name="devices" size={18} color={colors.onSurface} />
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>Active Sessions & Devices</Text>
                <Text style={styles.rowSub}>This device • Current session</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={styles.logout}
            onPress={async () => {
              await logout();
              router.replace("/login");
            }}
          >
            <Text style={styles.logoutText}>Log out</Text>
          </TouchableOpacity>
        </ScrollView>
        {adminNav ? <BottomNavBar activeRoute="more" /> : <EmployeeBottomNavBar activeRoute="profile" />}
        <ThemedDialog
          visible={dialog != null}
          title={dialog?.title ?? ""}
          message={dialog?.message}
          onRequestClose={() => setDialog(null)}
          actions={[{ label: "OK", onPress: () => setDialog(null), primary: true }]}
        />
      </SafeAreaView>
    </ScreenGradient>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8 },
  kicker: {
    fontFamily: "Inter",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    color: colors.secondary,
  },
  kickerSmall: {
    fontFamily: "Inter",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: colors.secondary,
  },
  title: { fontFamily: "Inter", fontSize: 22, fontWeight: "800", color: colors.onSurface },
  scroll: { paddingHorizontal: 16, paddingBottom: 120, gap: 12 },
  card: {
    backgroundColor: colors.glass,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    padding: 16,
    gap: 4,
  },
  cardHead: { gap: 6, marginBottom: 8 },
  section: { fontFamily: "Inter", fontSize: 16, fontWeight: "700", color: colors.onSurface, marginBottom: 6 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.08)",
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceContainerHigh,
    alignItems: "center",
    justifyContent: "center",
  },
  rowTitle: { fontFamily: "Inter", fontSize: 14, fontWeight: "700", color: colors.onSurface },
  rowSub: { fontFamily: "Inter", fontSize: 12, color: colors.secondary, marginTop: 2, lineHeight: 16 },
  hint: { fontFamily: "Inter", fontSize: 11, color: colors.secondary, marginTop: 8 },
  lockRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  lock: { fontFamily: "Inter", fontSize: 11, color: colors.secondary, flex: 1 },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.08)",
  },
  pref: { flexDirection: "row", alignItems: "center", paddingVertical: 10 },
  prefBorder: { borderBottomWidth: 1, borderBottomColor: "rgba(0,0,0,0.08)" },
  passwordBox: { gap: 8, paddingBottom: 8 },
  input: {
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    backgroundColor: colors.surfaceContainerLowest,
    paddingHorizontal: 12,
    fontFamily: "Inter",
    fontSize: 14,
    color: colors.onSurface,
  },
  save: {
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  saveText: { fontFamily: "Inter", fontSize: 14, fontWeight: "700", color: colors.onPrimary },
  logout: {
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.glass,
  },
  logoutText: { fontFamily: "Inter", fontSize: 14, fontWeight: "700", color: colors.primary },
});
