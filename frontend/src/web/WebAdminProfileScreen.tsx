import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { getSession } from "../../services/auth";
import { apiErrorMessage, displayName, getDepartment, getEmployee, getMe, type EmployeePublic } from "../../services/resources";
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
  const [managerName, setManagerName] = useState("—");
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

  const isGuest = me?.role === "guest_admin";
  const fallback = !me || !!error;

  return (
    <WebShell title="Profile" variant="admin" activeRoute="more" showBack>
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
          fallback="PK"
          onPress={me ? () => { void pickAndSaveProfilePhoto(me.employeeId); } : undefined}
        />
        <Text style={styles.name}>{me ? displayName(me) : "Preeti Kaur"}</Text>
        {fallback ? <UIFallbackIndicator /> : null}
      </View>
      <View style={styles.cols}>
        <WebCard style={styles.col}>
          <View style={styles.cardHead}>
            <Text style={styles.h}>Work Information</Text>
            <Text style={styles.activeTag}>{me?.status ?? "Active"}</Text>
          </View>
          <Text style={styles.meta}>Department: {departmentName}</Text>
          <Text style={styles.meta}>Reporting Manager: {managerName}</Text>
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
          <Text style={styles.h}>Privileges & Scope</Text>
          <Text style={styles.meta}>{isGuest ? "Read-Only (AUTH-09)" : "Full HR Authority"}</Text>
          <TouchableOpacity onPress={() => router.push("/org-settings" as never)}>
            <Text style={styles.link}>Organisation Settings</Text>
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
  activeTag: { backgroundColor: colors.primary, color: colors.onPrimary, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, fontSize: 11, fontWeight: "700", overflow: "hidden", textTransform: "uppercase" },
  cardHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  contactRow: { flexDirection: "row", alignItems: "stretch", minHeight: 56 },
  contactCol: { flex: 1, gap: 4, justifyContent: "center" },
  contactDivider: { width: 1, backgroundColor: colors.surfaceContainerHighest, marginHorizontal: 16 },
  body: { fontSize: 14, fontWeight: "600", color: colors.onSurface },
  h: { fontSize: 16, fontWeight: "700", color: colors.onSurface, marginBottom: 8 },
  meta: { fontSize: 13, color: colors.secondary, marginTop: 4 },
  link: { marginTop: 12, fontWeight: "700", color: colors.primary },
});
