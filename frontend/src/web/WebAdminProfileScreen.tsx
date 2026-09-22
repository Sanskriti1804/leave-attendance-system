import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { getSession, logout } from "../../services/auth";
import { CompactNotifications } from "../components/ui/CompactNotifications";
import { CompactAudit } from "../components/ui/CompactAudit";
import { isTeamLead } from "../utils/workforce";
import { apiErrorMessage, changePassword, displayName, getDepartment, getMe, getOrgSettings, listEmployees, type EmployeePublic, type OrganisationSettings } from "../../services/resources";
import { colors } from "../theme";
import { WebCard, WebShell } from "./WebShell";
import { UserAvatar } from "../components/ui/UserAvatar";
import { pickAndSaveProfilePhoto } from "../../services/profilePhoto";

function formatJoining(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

export default function WebAdminProfileScreen() {
  const router = useRouter();
  const [me, setMe] = useState<EmployeePublic | null>(null);
  const [departmentName, setDepartmentName] = useState("—");
  const [directory, setDirectory] = useState<EmployeePublic[]>([]);
  const [settings, setSettings] = useState<OrganisationSettings | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [panel, setPanel] = useState<"profile" | "notifications" | "audits">("profile");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const session = await getSession();
        let profile: EmployeePublic | null = (session?.user as EmployeePublic | undefined) ?? null;
        try {
          profile = await getMe();
        } catch {
          /* keep */
        }
        if (cancelled) return;
        setMe(profile);
        if (profile?.departmentId) {
          try {
            const department = await getDepartment(profile.departmentId);
            if (!cancelled) setDepartmentName(department.departmentName);
          } catch {
            setDepartmentName(`Dept ${profile.departmentId}`);
          }
        }
        try {
          const people = await listEmployees();
          if (!cancelled) setDirectory(people.items);
        } catch {
          if (!cancelled) setDirectory([]);
        }
        try {
          const org = await getOrgSettings();
          if (!cancelled) setSettings(org);
        } catch {
          if (!cancelled) setSettings(null);
        }
      } catch (err) {
        if (!cancelled) setError(apiErrorMessage(err));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const isGuest = me?.role === "guest_admin";
  const showLead = me ? isTeamLead(directory, me.employeeId) : false;

  if (panel === "notifications") {
    return (
      <WebShell title="Notifications" variant="admin" activeRoute="more">
        <TouchableOpacity style={styles.backLink} onPress={() => setPanel("profile")}>
          <MaterialIcons name="arrow-back" size={16} color={colors.accentDeep} />
          <Text style={styles.link}>Back to profile</Text>
        </TouchableOpacity>
        <WebCard style={styles.fullCard}>
          <CompactNotifications limit={20} />
        </WebCard>
      </WebShell>
    );
  }

  if (panel === "audits") {
    return (
      <WebShell title="Audits" variant="admin" activeRoute="more">
        <TouchableOpacity style={styles.backLink} onPress={() => setPanel("profile")}>
          <MaterialIcons name="arrow-back" size={16} color={colors.accentDeep} />
          <Text style={styles.link}>Back to profile</Text>
        </TouchableOpacity>
        <WebCard style={styles.fullCard}>
          <CompactAudit limit={20} />
        </WebCard>
      </WebShell>
    );
  }

  return (
    <WebShell title="Profile" variant="admin" activeRoute="more">
      {isGuest ? (
        <WebCard>
          <Text style={styles.h}>Guest Admin Mode (AUTH-09)</Text>
          <Text style={styles.meta}>Org-wide read-only visibility. System configuration & triage updates are locked.</Text>
        </WebCard>
      ) : null}
      <WebCard style={styles.heroCard}>
        <View style={styles.heroRow}>
          <UserAvatar
            employee={me}
            size={96}
            fallback="—"
            onPress={me ? () => { void pickAndSaveProfilePhoto(me.employeeId); } : undefined}
          />
          <View style={styles.heroCopy}>
            <Text style={styles.kicker}>HR profile</Text>
            <Text style={styles.name}>{me ? displayName(me) : "—"}</Text>
            <View style={styles.tagRow}>
              <Text style={styles.activeTag}>{me?.status ?? "—"}</Text>
              {showLead ? <Text style={styles.activeTag}>Team Lead</Text> : null}
            </View>
            {error ? <Text style={styles.meta}>{error}</Text> : null}
          </View>
        </View>
        <View style={styles.divider} />
        <View style={styles.infoGrid}>
          <View style={styles.infoBlock}>
            <Text style={styles.h}>Work Information</Text>
            <Text style={styles.meta}>Department: {departmentName}</Text>
            <Text style={styles.meta}>Joining Date: {me?.joiningDate ? `${formatJoining(me.joiningDate)} · Ongoing` : formatJoining(me?.joiningDate)}</Text>
          </View>
          <View style={styles.infoBlock}>
            <Text style={styles.h}>Contact</Text>
            <Text style={styles.meta}>Email</Text>
            <Text style={styles.body}>{me?.email ?? "—"}</Text>
            <Text style={styles.meta}>Phone</Text>
            <Text style={styles.body}>{me?.phone ?? "—"}</Text>
          </View>
          <View style={styles.infoBlock}>
            <Text style={styles.h}>Privileges & Scope</Text>
            <Text style={styles.meta}>{isGuest ? "Read-Only (AUTH-09)" : "Full HR Authority"}</Text>
            <TouchableOpacity onPress={() => router.push("/leave/types" as never)}>
              <Text style={styles.link}>Leave Types</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push("/org-settings" as never)}>
              <Text style={styles.link}>Organisation Settings</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.infoBlock}>
            <Text style={styles.h}>Attendance Preferences</Text>
            <Text style={styles.meta}>Timezone: {settings?.timezone ?? "—"}</Text>
            <Text style={styles.meta}>Shift: {settings?.workStart ?? "—"} - {settings?.workEnd ?? "—"}</Text>
          </View>
        </View>
        <View style={styles.divider} />
        <Text style={styles.h}>Security</Text>
        <TouchableOpacity onPress={() => setShowPassword((value) => !value)}>
          <Text style={styles.link}>Change Password</Text>
        </TouchableOpacity>
        {showPassword ? (
          <View style={{ gap: 8, marginTop: 8 }}>
            <TextInput style={styles.input} placeholder="Current password" secureTextEntry value={currentPassword} onChangeText={setCurrentPassword} placeholderTextColor={colors.secondary} />
            <TextInput style={styles.input} placeholder="New password" secureTextEntry value={newPassword} onChangeText={setNewPassword} placeholderTextColor={colors.secondary} />
            <TouchableOpacity
              disabled={savingPassword}
              onPress={async () => {
                setSavingPassword(true);
                try {
                  await changePassword({ currentPassword, newPassword });
                  setCurrentPassword("");
                  setNewPassword("");
                  setShowPassword(false);
                  setError("Password updated.");
                } catch (err) {
                  setError(apiErrorMessage(err));
                } finally {
                  setSavingPassword(false);
                }
              }}
            >
              <Text style={styles.link}>{savingPassword ? "Updating…" : "Update password"}</Text>
            </TouchableOpacity>
          </View>
        ) : null}
        <TouchableOpacity
          onPress={async () => {
            await logout();
            router.replace("/login" as never);
          }}
        >
          <Text style={styles.link}>Log out</Text>
        </TouchableOpacity>
      </WebCard>
      <View style={styles.navGrid}>
        <TouchableOpacity style={styles.navCard} onPress={() => setPanel("notifications")}>
          <View style={styles.navIcon}>
            <MaterialIcons name="notifications" size={22} color={colors.onPrimary} />
          </View>
          <Text style={styles.actionTitle}>Notifications</Text>
          <Text style={styles.meta}>Open your updates</Text>
        </TouchableOpacity>
        {!isGuest ? (
          <TouchableOpacity style={styles.navCard} onPress={() => setPanel("audits")}>
            <View style={styles.navIcon}>
              <MaterialIcons name="history" size={22} color={colors.onPrimary} />
            </View>
            <Text style={styles.actionTitle}>Audits</Text>
            <Text style={styles.meta}>Open the audit trail</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </WebShell>
  );
}

const styles = StyleSheet.create({
  heroCard: { width: "100%", alignSelf: "stretch", gap: 12, padding: 24 },
  fullCard: { width: "100%" },
  heroRow: { flexDirection: "row", alignItems: "center", gap: 20, flexWrap: "wrap" },
  heroCopy: { flex: 1, minWidth: 220, gap: 6 },
  kicker: { fontSize: 11, fontWeight: "700", color: colors.accentDeep, textTransform: "uppercase", letterSpacing: 1.2 },
  name: { fontSize: 26, fontWeight: "700", color: colors.onSurface },
  tagRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  activeTag: { backgroundColor: colors.accent, color: colors.onPrimary, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, fontSize: 11, fontWeight: "700", overflow: "hidden", textTransform: "uppercase" },
  divider: { height: 1, backgroundColor: colors.surfaceContainerHighest, marginVertical: 4 },
  infoGrid: { flexDirection: "row", flexWrap: "wrap", gap: 20 },
  infoBlock: { flexGrow: 1, flexBasis: 240, gap: 4 },
  body: { fontSize: 14, fontWeight: "600", color: colors.onSurface },
  h: { fontSize: 16, fontWeight: "700", color: colors.onSurface, marginBottom: 4 },
  meta: { fontSize: 13, color: colors.secondary, marginTop: 2 },
  link: { marginTop: 8, fontWeight: "700", color: colors.accentDeep },
  input: { minHeight: 44, borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 10, marginTop: 8, color: colors.onSurface, backgroundColor: colors.surfaceContainerLow },
  navGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  navCard: {
    flexGrow: 1,
    flexBasis: 280,
    minHeight: 120,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderLeftWidth: 3,
    borderLeftColor: colors.accent,
    padding: 16,
    gap: 8,
  },
  navIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: colors.accent, alignItems: "center", justifyContent: "center" },
  actionTitle: { fontSize: 15, fontWeight: "700", color: colors.onSurface },
  backLink: { flexDirection: "row", alignItems: "center", gap: 6 },
});
