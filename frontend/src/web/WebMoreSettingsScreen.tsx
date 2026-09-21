import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Switch, TextInput, TouchableOpacity, Alert } from "react-native";
import { useRouter } from "expo-router";
import { logout } from "../../services/auth";
import { apiErrorMessage, changePassword, getMe, getOrgSettings, type OrganisationSettings } from "../../services/resources";
import { colors } from "../theme";
import { WebCard, WebShell } from "./WebShell";

export default function WebMoreSettingsScreen() {
  const router = useRouter();
  const [role, setRole] = useState("employee");
  const [settings, setSettings] = useState<OrganisationSettings | null>(null);
  const [leaveAlerts, setLeaveAlerts] = useState(true);
  const [attendanceReminders, setAttendanceReminders] = useState(true);
  const [hrAnnouncements, setHrAnnouncements] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const adminNav = role === "admin" || role === "guest_admin";

  useEffect(() => {
    getMe()
      .then((me) => setRole(me.role))
      .catch(() => setRole("employee"));
    getOrgSettings()
      .then(setSettings)
      .catch(() => setSettings(null));
  }, []);

  return (
    <WebShell title={adminNav ? "More" : "Settings"} variant={adminNav ? "admin" : "employee"} activeRoute={adminNav ? "more" : "profile"}>
      {adminNav ? (
        <WebCard>
          <Text style={styles.section}>Account & organisation</Text>
          <TouchableOpacity onPress={() => router.push("/admin-profile" as never)}>
            <Text style={styles.link}>Admin / Guest Admin Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push("/leave/types" as never)}>
            <Text style={styles.link}>Leave Types</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push("/org-settings" as never)}>
            <Text style={styles.link}>Organisation Settings</Text>
          </TouchableOpacity>
        </WebCard>
      ) : null}
      <WebCard>
        <Text style={styles.section}>Notification Preferences</Text>
        <Pref label="Leave status updates" value={leaveAlerts} onChange={setLeaveAlerts} />
        <Pref label="Attendance & Missed Punch Reminders" value={attendanceReminders} onChange={setAttendanceReminders} />
        <Pref label="HR Announcements" value={hrAnnouncements} onChange={setHrAnnouncements} />
        <Text style={styles.meta}>Preference switches are local until a notification API exists.</Text>
      </WebCard>
      <WebCard>
        <Text style={styles.section}>Attendance Preferences</Text>
        <Text style={styles.meta}>Timezone: {settings?.timezone ?? "America/New_York (EST)"}</Text>
        <Text style={styles.meta}>
          Shift: {settings?.workStart ?? "09:00"} - {settings?.workEnd ?? "18:00"} EST
        </Text>
        <Text style={styles.meta}>
          Work week offs: {settings?.weeklyOffDow?.length ? settings.weeklyOffDow.join(", ") : "Monday – Friday 5D"}
        </Text>
      </WebCard>
      <WebCard>
        <Text style={styles.section}>Security</Text>
        <TouchableOpacity onPress={() => setShowPassword((v) => !v)}>
          <Text style={styles.link}>Change Password</Text>
        </TouchableOpacity>
        {showPassword ? (
          <View style={{ gap: 8, marginTop: 12 }}>
            <TextInput style={styles.input} placeholder="Current password" secureTextEntry value={currentPassword} onChangeText={setCurrentPassword} placeholderTextColor={colors.secondary} />
            <TextInput style={styles.input} placeholder="New password" secureTextEntry value={newPassword} onChangeText={setNewPassword} placeholderTextColor={colors.secondary} />
            <TouchableOpacity
              style={styles.primary}
              disabled={savingPassword}
              onPress={async () => {
                setSavingPassword(true);
                try {
                  await changePassword({ currentPassword, newPassword });
                  setCurrentPassword("");
                  setNewPassword("");
                  setShowPassword(false);
                  Alert.alert("Password updated", "Use the new password the next time you sign in.");
                } catch (err) {
                  Alert.alert("Could not change password", apiErrorMessage(err));
                } finally {
                  setSavingPassword(false);
                }
              }}
            >
              <Text style={styles.primaryText}>{savingPassword ? "Updating…" : "Update password"}</Text>
            </TouchableOpacity>
          </View>
        ) : null}
        <TouchableOpacity
          style={styles.logout}
          onPress={async () => {
            await logout();
            router.replace("/login");
          }}
        >
          <Text style={styles.logoutText}>Sign out</Text>
        </TouchableOpacity>
      </WebCard>
    </WebShell>
  );
}

function Pref({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={styles.pref}>
      <Text style={styles.body}>{label}</Text>
      <Switch value={value} onValueChange={onChange} />
    </View>
  );
}

const styles = StyleSheet.create({
  section: { fontSize: 14, fontWeight: "700", color: colors.onSurface, marginBottom: 8 },
  link: { fontSize: 14, fontWeight: "600", color: colors.primary, marginTop: 8 },
  meta: { fontSize: 12, color: colors.secondary, marginTop: 6 },
  body: { fontSize: 14, color: colors.onSurface, flex: 1 },
  pref: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 8, gap: 12 },
  input: { minHeight: 44, borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 10, color: colors.onSurface },
  primary: { backgroundColor: colors.primary, borderRadius: 8, padding: 12, alignItems: "center" },
  primaryText: { color: colors.onPrimary, fontWeight: "700" },
  logout: { marginTop: 16, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: colors.border, alignItems: "center" },
  logoutText: { fontWeight: "700", color: colors.onSurface },
});
