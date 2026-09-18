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
      <View style={styles.cols}>
        <WebCard style={styles.col}>
          <UserAvatar
            employee={me}
            size={64}
            fallback="PK"
            onPress={
              me
                ? () => {
                    void pickAndSaveProfilePhoto(me.employeeId);
                  }
                : undefined
            }
          />
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Text style={styles.name}>{me ? displayName(me) : "Preeti Kaur"}</Text>
            {fallback ? <UIFallbackIndicator /> : null}
          </View>
          <Text style={styles.tag}>{(me?.role ?? "ADMIN").toUpperCase()}</Text>
          <Text style={styles.meta}>EMP-{me?.employeeId ?? 1024} · {me?.status ?? "Active"}</Text>
        </WebCard>
        <WebCard style={styles.col}>
          <Text style={styles.h}>Work Information</Text>
          <Text style={styles.meta}>Role: {isGuest ? "Guest Admin" : me?.role ?? "admin"}</Text>
          <Text style={styles.meta}>Department: {departmentName}</Text>
          <Text style={styles.meta}>Manager: {managerName}</Text>
          <Text style={styles.meta}>Email: {me?.email ?? "—"}</Text>
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
  col: { flexGrow: 1, flexBasis: 280 },
  name: { fontSize: 22, fontWeight: "700", color: colors.onSurface },
  tag: { marginTop: 8, alignSelf: "flex-start", backgroundColor: colors.surfaceContainer, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, fontSize: 11, fontWeight: "700" },
  h: { fontSize: 16, fontWeight: "700", color: colors.onSurface, marginBottom: 8 },
  meta: { fontSize: 13, color: colors.secondary, marginTop: 4 },
  link: { marginTop: 12, fontWeight: "700", color: colors.primary },
});
