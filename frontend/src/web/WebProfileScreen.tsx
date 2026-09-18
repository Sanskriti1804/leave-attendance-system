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
            setManagerName(`EMP-${profile.managerId}`);
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

  const name = me ? displayName(me) : "Alex Chen";
  const fallback = !me || !!error;

  return (
    <WebShell title="Profile" variant="employee" activeRoute="profile">
      <View style={styles.cols}>
        <WebCard style={styles.col}>
          <UserAvatar
            employee={me}
            size={72}
            fallback="AC"
            onPress={
              me
                ? () => {
                    void pickAndSaveProfilePhoto(me.employeeId);
                  }
                : undefined
            }
          />
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Text style={styles.name}>{name}</Text>
            {fallback ? <UIFallbackIndicator /> : null}
          </View>
          <Text style={styles.tag}>{(me?.role ?? "employee").toUpperCase()}</Text>
          <Text style={styles.meta}>EMP-{me?.employeeId ?? "8492"} · {me?.status ?? "Active"}</Text>
        </WebCard>
        <WebCard style={styles.col}>
          <Text style={styles.h}>Work Information</Text>
          <Row label="Role" value={me?.role ?? "Senior Software Engineer"} />
          <Row label="Department" value={departmentName} />
          <Row label="Reporting Manager" value={managerName} />
          <Row label="Official Email" value={me?.email ?? "—"} />
          <Row label="Joining Date" value={me?.joiningDate ?? "—"} />
        </WebCard>
        <WebCard style={styles.col}>
          <Text style={styles.h}>Attendance & Work Schedule</Text>
          <Row label="Timezone" value={settings?.timezone ?? "America/New_York"} />
          <Row label="Shift" value={`${settings?.workStart ?? "09:00"} - ${settings?.workEnd ?? "18:00"}`} />
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
  col: { flexGrow: 1, flexBasis: 280 },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.surfaceContainerHigh, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  avatarText: { fontSize: 22, fontWeight: "700", color: colors.onSurface },
  name: { fontSize: 22, fontWeight: "700", color: colors.onSurface },
  tag: { marginTop: 8, alignSelf: "flex-start", backgroundColor: colors.surfaceContainer, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, fontSize: 11, fontWeight: "700" },
  meta: { fontSize: 12, color: colors.secondary, marginTop: 6 },
  h: { fontSize: 16, fontWeight: "700", color: colors.onSurface, marginBottom: 8 },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.surfaceContainerHighest, gap: 12 },
  label: { fontSize: 12, color: colors.secondary },
  value: { fontSize: 12, fontWeight: "600", color: colors.onSurface, textAlign: "right", flex: 1 },
  link: { marginTop: 12, fontWeight: "700", color: colors.primary },
});
