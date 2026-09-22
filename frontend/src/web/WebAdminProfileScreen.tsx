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

function avatarInitials(employee: EmployeePublic | null): string {
  if (!employee) return "?";
  const first = (employee.firstName?.[0] ?? "").toUpperCase();
  const last = (employee.lastName?.[0] ?? "").toUpperCase();
  if (first && last) return `${first}${last}`;
  if (first) return first;
  const parts = displayName(employee).split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  if (parts[0]) return parts[0].slice(0, 2).toUpperCase();
  return "?";
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
  const name = me ? displayName(me) : "—";

  if (panel === "notifications") {
    return (
      <WebShell title="Notifications" variant="admin" activeRoute="more">
        <TouchableOpacity style={styles.backLink} onPress={() => setPanel("profile")}>
          <MaterialIcons name="arrow-back" size={16} color={colors.accentDeep} />
          <Text style={styles.linkInline}>Back to profile</Text>
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
          <Text style={styles.linkInline}>Back to profile</Text>
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
        <WebCard style={styles.fullCard}>
          <Text style={styles.h}>Guest Admin Mode (AUTH-09)</Text>
          <Text style={styles.label}>Org-wide read-only visibility. System configuration & triage updates are locked.</Text>
        </WebCard>
      ) : null}
      <View style={styles.heroBlock}>
        <UserAvatar
          employee={me}
          size={104}
          fallback={avatarInitials(me)}
          onPress={me ? () => { void pickAndSaveProfilePhoto(me.employeeId); } : undefined}
        />
        <Text style={styles.name}>{name}</Text>
        {showLead ? <Text style={styles.activeTag}>Team Lead</Text> : null}
        {error ? <Text style={styles.label}>{error}</Text> : null}
      </View>
      <View style={styles.stack}>
        <WebCard style={styles.fullCard}>
          <View style={styles.cardHead}>
            <Text style={styles.h}>Work Information</Text>
            <Text style={styles.activeTag}>{me?.status ?? "—"}</Text>
          </View>
          <Row label="Department" value={departmentName} />
          <Row label="Joining Date" value={me?.joiningDate ? `${formatJoining(me.joiningDate)} · Ongoing` : formatJoining(me?.joiningDate)} />
        </WebCard>
        <WebCard style={styles.fullCard}>
          <View style={styles.contactRow}>
            <View style={styles.contactCol}>
              <Text style={styles.label}>Email</Text>
              <Text style={styles.valueLeft}>{me?.email ?? "—"}</Text>
            </View>
            <View style={styles.contactDivider} />
            <View style={styles.contactCol}>
              <Text style={styles.label}>Phone</Text>
              <Text style={styles.valueLeft}>{me?.phone ?? "—"}</Text>
            </View>
          </View>
        </WebCard>
        <WebCard style={styles.fullCard}>
          <Text style={styles.h}>Privileges & Scope</Text>
          <Row label="Access" value={isGuest ? "Read-Only (AUTH-09)" : "Full HR Authority"} />
          <TouchableOpacity onPress={() => router.push("/leave/types" as never)}>
            <Text style={styles.link}>Leave Types</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push("/org-settings" as never)}>
            <Text style={styles.link}>Organisation Settings</Text>
          </TouchableOpacity>
        </WebCard>
        <WebCard style={styles.fullCard}>
          <Text style={styles.h}>Attendance Preferences</Text>
          <Row label="Timezone" value={settings?.timezone ?? "—"} />
          <Row label="Shift" value={`${settings?.workStart ?? "—"} - ${settings?.workEnd ?? "—"}`} />
        </WebCard>
        <WebCard style={styles.fullCard}>
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
        <View style={styles.navRow}>
          <TouchableOpacity style={styles.navCard} onPress={() => setPanel("notifications")}>
            <View style={styles.navIcon}>
              <MaterialIcons name="notifications" size={18} color={colors.onPrimary} />
            </View>
            <View style={styles.navCopy}>
              <Text style={styles.navTitle}>Notifications</Text>
              <Text style={styles.navMeta}>Open updates</Text>
            </View>
            <MaterialIcons name="chevron-right" size={18} color={colors.secondary} />
          </TouchableOpacity>
          {!isGuest ? (
            <TouchableOpacity style={styles.navCard} onPress={() => setPanel("audits")}>
              <View style={styles.navIcon}>
                <MaterialIcons name="history" size={18} color={colors.onPrimary} />
              </View>
              <View style={styles.navCopy}>
                <Text style={styles.navTitle}>Audits</Text>
                <Text style={styles.navMeta}>Open audit trail</Text>
              </View>
              <MaterialIcons name="chevron-right" size={18} color={colors.secondary} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </WebShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { flexDirection: "column", gap: 20, width: "100%", paddingBottom: 8 },
  fullCard: { width: "100%", alignSelf: "stretch", paddingVertical: 8 },
  heroBlock: { alignItems: "center", gap: 14, paddingVertical: 24, width: "100%" },
  name: { fontSize: 22, fontWeight: "700", color: colors.onSurface, textAlign: "center" },
  activeTag: { backgroundColor: colors.accent, color: colors.onPrimary, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, fontSize: 11, fontWeight: "700", overflow: "hidden", textTransform: "uppercase" },
  cardHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  contactRow: { flexDirection: "row", alignItems: "stretch", minHeight: 56 },
  contactCol: { flex: 1, gap: 4, justifyContent: "center" },
  contactDivider: { width: 1, backgroundColor: colors.surfaceContainerHighest, marginHorizontal: 16 },
  h: { fontSize: 16, fontWeight: "700", color: colors.onSurface, marginBottom: 8 },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.surfaceContainerHighest, gap: 12 },
  label: { fontSize: 12, color: colors.secondary },
  value: { fontSize: 12, fontWeight: "600", color: colors.onSurface, textAlign: "right", flex: 1 },
  valueLeft: { fontSize: 13, fontWeight: "600", color: colors.onSurface },
  link: { marginTop: 12, fontWeight: "700", color: colors.accentDeep },
  linkInline: { fontWeight: "700", color: colors.accentDeep },
  input: { minHeight: 44, borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 10, marginTop: 8, color: colors.onSurface, backgroundColor: colors.surfaceContainerLow },
  backLink: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },
  navRow: { flexDirection: "row", flexWrap: "wrap", gap: 12, width: "100%" },
  navCard: {
    flex: 1,
    flexBasis: 280,
    minHeight: 72,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderLeftWidth: 3,
    borderLeftColor: colors.accent,
  },
  navIcon: { width: 32, height: 32, borderRadius: 8, backgroundColor: colors.accent, alignItems: "center", justifyContent: "center" },
  navCopy: { flex: 1, gap: 2 },
  navTitle: { fontSize: 14, fontWeight: "700", color: colors.onSurface },
  navMeta: { fontSize: 12, color: colors.secondary },
});
