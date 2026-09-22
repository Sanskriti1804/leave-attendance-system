import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from "react-native";
import { useRouter } from "expo-router";
import { getSession, logout } from "../../services/auth";
import { CompactNotifications } from "../components/ui/CompactNotifications";
import { CompactAudit } from "../components/ui/CompactAudit";
import { isTeamLead } from "../utils/workforce";
import { apiErrorMessage, changePassword, displayName, getDepartment, getMe, getOrgSettings, listEmployees, type EmployeePublic, type OrganisationSettings } from "../../services/resources";
import { colors } from "../theme";
import { WebCard, WebShell } from "./WebShell";
import { UserAvatar } from "../components/ui/UserAvatar";
import { UIFallbackIndicator } from "../components/ui/UIFallback";
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
  const fallback = !me || !!error;
  const showLead = me ? isTeamLead(directory, me.employeeId) : false;

  return (
    <WebShell title="Profile" variant="admin" activeRoute="more">
      {isGuest ? (
        <WebCard>
          <Text style={styles.h}>Guest Admin Mode (AUTH-09)</Text>
          <Text style={styles.meta}>Org-wide read-only visibility. System configuration & triage updates are locked.</Text>
        </WebCard>
      ) : null}
      <View style={styles.heroBlock}>
        <UserAvatar
          employee={me}
          size={96}
          fallback="—"
          onPress={me ? () => { void pickAndSaveProfilePhoto(me.employeeId); } : undefined}
        />
        <Text style={styles.name}>{me ? displayName(me) : "—"}</Text>
        {showLead ? <Text style={styles.activeTag}>Team Lead</Text> : null}
        {fallback ? <UIFallbackIndicator /> : null}
      </View>
      <View style={styles.cols}>
        <WebCard style={styles.col}>
          <View style={styles.cardHead}>
            <Text style={styles.h}>Work Information</Text>
            <Text style={styles.activeTag}>{me?.status ?? "—"}</Text>
          </View>
          <Text style={styles.meta}>Department: {departmentName}</Text>
          <Text style={styles.meta}>Joining Date: {me?.joiningDate ? `${formatJoining(me.joiningDate)} · Ongoing` : formatJoining(me?.joiningDate)}</Text>
        </WebCard>
        <WebCard style={styles.col}>
          <View style={styles.contactRow}>
            <View style={styles.contactCol}>
              <Text style={styles.meta}>Email</Text>
              <Text style={styles.body}>{me?.email ?? "—"}</Text>
            </View>
            <View style={styles.contactDivider} />
            <View style={styles.contactCol}>
              <Text style={styles.meta}>Phone</Text>
              <Text style={styles.body}>{me?.phone ?? "—"}</Text>
            </View>
          </View>
        </WebCard>
        <WebCard style={styles.col}>
          <CompactNotifications />
        </WebCard>
        {!isGuest ? (
          <WebCard style={styles.col}>
            <CompactAudit />
          </WebCard>
        ) : null}
        <WebCard style={styles.col}>
          <Text style={styles.h}>Privileges & Scope</Text>
          <Text style={styles.meta}>{isGuest ? "Read-Only (AUTH-09)" : "Full HR Authority"}</Text>
          <TouchableOpacity onPress={() => router.push("/leave/types" as never)}>
            <Text style={styles.link}>Leave Types</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push("/org-settings" as never)}>
            <Text style={styles.link}>Organisation Settings</Text>
          </TouchableOpacity>
        </WebCard>
        <WebCard style={styles.col}>
          <Text style={styles.h}>Attendance Preferences</Text>
          <Text style={styles.meta}>Timezone: {settings?.timezone ?? "—"}</Text>
          <Text style={styles.meta}>Shift: {settings?.workStart ?? "—"} - {settings?.workEnd ?? "—"}</Text>
        </WebCard>
        <WebCard style={styles.col}>
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
      </View>
    </WebShell>
  );
}

const styles = StyleSheet.create({
  cols: { flexDirection: "row", flexWrap: "wrap", gap: 16 },
  col: { flexGrow: 1, flexBasis: 280, padding: 16 },
  heroBlock: { alignItems: "center", gap: 12, paddingVertical: 16 },
  name: { fontSize: 22, fontWeight: "700", color: colors.onSurface, textAlign: "center" },
  tag: { marginTop: 8, alignSelf: "flex-start", backgroundColor: colors.surfaceContainer, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, fontSize: 11, fontWeight: "700" },
  activeTag: { backgroundColor: colors.accent, color: colors.onPrimary, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, fontSize: 11, fontWeight: "700", overflow: "hidden", textTransform: "uppercase" },
  cardHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  contactRow: { flexDirection: "row", alignItems: "stretch", minHeight: 56 },
  contactCol: { flex: 1, gap: 4, justifyContent: "center" },
  contactDivider: { width: 1, backgroundColor: colors.surfaceContainerHighest, marginHorizontal: 16 },
  body: { fontSize: 14, fontWeight: "600", color: colors.onSurface },
  h: { fontSize: 16, fontWeight: "700", color: colors.onSurface, marginBottom: 8 },
  meta: { fontSize: 13, color: colors.secondary, marginTop: 4 },
  link: { marginTop: 12, fontWeight: "700", color: colors.accentDeep },
  input: { minHeight: 44, borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 10, marginTop: 8, color: colors.onSurface, backgroundColor: colors.surfaceContainerLow },
});
