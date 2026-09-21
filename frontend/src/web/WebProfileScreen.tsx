import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { getSession } from "../../services/auth";
import { apiErrorMessage, displayName, getDepartment, getEmployee, getMe, getOrgSettings, type EmployeePublic, type OrganisationSettings } from "../../services/resources";
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

export default function WebProfileScreen() {
  const router = useRouter();
  const [me, setMe] = useState<EmployeePublic | null>(null);
  const [departmentName, setDepartmentName] = useState("—");
  const [managerName, setManagerName] = useState("—");
  const [settings, setSettings] = useState<OrganisationSettings | null>(null);
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
          /* session user */
        }
        if (cancelled) return;
        setMe(profile);
        try {
          setSettings(await getOrgSettings());
        } catch (err) {
          setError(apiErrorMessage(err));
        }
        if (profile?.departmentId) {
          try {
            const department = await getDepartment(profile.departmentId);
            if (!cancelled) setDepartmentName(department.departmentName);
          } catch {
            setDepartmentName(`Dept ${profile.departmentId}`);
          }
        }
        if (profile?.managerId) {
          try {
            const manager = await getEmployee(profile.managerId);
            if (!cancelled) setManagerName(displayName(manager));
          } catch {
            setManagerName("—");
          }
        }
      } catch (err) {
        if (!cancelled) setError(apiErrorMessage(err));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const name = me ? displayName(me) : "—";
  const fallback = !me || !!error;

  return (
    <WebShell title="Profile" variant="employee" activeRoute="profile">
      <View style={styles.heroBlock}>
        <UserAvatar
          employee={me}
          size={96}
          fallback="—"
          onPress={me ? () => { void pickAndSaveProfilePhoto(me.employeeId); } : undefined}
        />
        <Text style={styles.name}>{name}</Text>
        {fallback ? <UIFallbackIndicator /> : null}
      </View>
      <View style={styles.cols}>
        <WebCard style={styles.col}>
          <View style={styles.cardHead}>
            <Text style={styles.h}>Work Information</Text>
            <Text style={styles.activeTag}>{me?.status ?? "Active"}</Text>
          </View>
          <Row label="Department" value={departmentName} />
          <Row label="Approver" value={me?.managerId ? managerName : "Not assigned"} />
          <Row label="Joining Date" value={me?.joiningDate ? `${formatJoining(me.joiningDate)} · Ongoing` : formatJoining(me?.joiningDate)} />
        </WebCard>
        <WebCard style={styles.col}>
          <View style={styles.contactRow}>
            <View style={styles.contactCol}>
              <Text style={styles.label}>Email</Text>
              <Text style={styles.value}>{me?.email ?? "—"}</Text>
            </View>
            <View style={styles.contactDivider} />
            <View style={styles.contactCol}>
              <Text style={styles.label}>Phone</Text>
              <Text style={styles.value}>{me?.phone ?? "—"}</Text>
            </View>
          </View>
        </WebCard>
        <WebCard style={styles.col}>
          <Text style={styles.h}>Attendance & Work Schedule</Text>
          <Row label="Timezone" value={settings?.timezone ?? "—"} />
          <Row label="Shift" value={`${settings?.workStart ?? "—"} - ${settings?.workEnd ?? "—"}`} />
          <TouchableOpacity onPress={() => router.push("/(tabs)/settings" as never)}>
            <Text style={styles.link}>App & Account Settings</Text>
          </TouchableOpacity>
        </WebCard>
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
  cols: { flexDirection: "row", flexWrap: "wrap", gap: 16 },
  col: { flexGrow: 1, flexBasis: 280, padding: 16 },
  heroBlock: { alignItems: "center", gap: 12, paddingVertical: 16 },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.surfaceContainerHigh, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  avatarText: { fontSize: 22, fontWeight: "700", color: colors.onSurface },
  name: { fontSize: 22, fontWeight: "700", color: colors.onSurface, textAlign: "center" },
  tag: { marginTop: 8, alignSelf: "flex-start", backgroundColor: colors.surfaceContainer, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, fontSize: 11, fontWeight: "700" },
  activeTag: { backgroundColor: colors.primary, color: colors.onPrimary, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, fontSize: 11, fontWeight: "700", overflow: "hidden", textTransform: "uppercase" },
  cardHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  contactRow: { flexDirection: "row", alignItems: "stretch", minHeight: 56 },
  contactCol: { flex: 1, gap: 4, justifyContent: "center" },
  contactDivider: { width: 1, backgroundColor: colors.surfaceContainerHighest, marginHorizontal: 16 },
  meta: { fontSize: 12, color: colors.secondary, marginTop: 6 },
  h: { fontSize: 16, fontWeight: "700", color: colors.onSurface, marginBottom: 8 },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.surfaceContainerHighest, gap: 12 },
  label: { fontSize: 12, color: colors.secondary },
  value: { fontSize: 12, fontWeight: "600", color: colors.onSurface, textAlign: "right", flex: 1 },
  link: { marginTop: 12, fontWeight: "700", color: colors.primary },
});
