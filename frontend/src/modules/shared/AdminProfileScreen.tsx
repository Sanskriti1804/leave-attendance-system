import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { getSession } from "../../../services/auth";
import {
  apiErrorMessage,
  displayName,
  getDepartment,
  getEmployee,
  getMe,
  type EmployeePublic,
} from "../../../services/resources";
import { colors } from "../../theme";
import { ScreenGradient } from "../../components/ui/AppChrome";
import { BottomNavBar, TopNavBar, useTopNavContentInset } from "../../components/ui/AdminComponents";
import { UserAvatar } from "../../components/ui/UserAvatar";
import { pickAndSaveProfilePhoto } from "../../../services/profilePhoto";

function formatJoining(value: string | null | undefined): string {
  if (!value) {
    return "—";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

export default function AdminProfileScreen() {
  const router = useRouter();
  const topInset = useTopNavContentInset();
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
          // keep session user
        }
        if (cancelled) {
          return;
        }
        setMe(profile);
        if (profile?.departmentId) {
          try {
            const department = await getDepartment(profile.departmentId);
            if (!cancelled) {
              setDepartmentName(department.departmentName);
            }
          } catch {
            setDepartmentName(`Dept ${profile.departmentId}`);
          }
        }
        if (profile?.managerId) {
          try {
            const manager = await getEmployee(profile.managerId);
            if (!cancelled) {
              setManagerName(displayName(manager));
            }
          } catch {
            setManagerName(`EMP-${profile.managerId}`);
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(apiErrorMessage(err));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const isGuest = me?.role === "guest_admin";
  const name = me ? displayName(me) : "Preeti Kaur";
  const fallback = !me || !!error;

  return (
    <ScreenGradient>
      <SafeAreaView style={styles.safe}>
        <TopNavBar title="Profile" showBack />
        <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: topInset }]} showsVerticalScrollIndicator={false}>
          {isGuest ? (
            <View style={styles.banner}>
              <MaterialIcons name="lock" size={18} color={colors.onSurface} />
              <View style={{ flex: 1 }}>
                <Text style={styles.bannerTitle}>Guest Admin Mode (AUTH-09)</Text>
                <Text style={styles.bannerCopy}>
                  Org-wide read-only visibility. System configuration & triage updates are locked.
                </Text>
              </View>
            </View>
          ) : null}

          <View style={styles.heroBlock}>
            <UserAvatar
              employee={me}
              size={96}
              fallback="PK"
              onPress={me ? () => { void pickAndSaveProfilePhoto(me.employeeId); } : undefined}
            />
            <Text style={styles.name}>{name}</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.cardHead}>
              <Text style={styles.cardTitle}>Work Information</Text>
              <View style={styles.activeTag}><Text style={styles.activeTagText}>{me?.status ?? "Active"}</Text></View>
            </View>
            <InfoRow label="Department" value={departmentName === "—" ? "Human Resources & Ops" : departmentName} />
            <InfoRow label="Reporting Manager" value={managerName === "—" ? "—" : managerName} />
            <InfoRow label="Joining Date" value={me?.joiningDate ? `${formatJoining(me.joiningDate)} · Ongoing` : formatJoining(me?.joiningDate)} last />
          </View>

          <View style={styles.card}>
            <View style={styles.contactRow}>
              <View style={styles.contactCol}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{me?.email ?? "—"}</Text>
              </View>
              <View style={styles.contactDivider} />
              <View style={styles.contactCol}>
                <Text style={styles.infoLabel}>Phone</Text>
                <Text style={styles.infoValue}>{me?.phone ?? "—"}</Text>
              </View>
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.cardHead}>
              <Text style={styles.cardTitle}>Privileges & Scope</Text>
              <Text style={styles.lock}>{isGuest ? "Read-Only" : "Full HR Authority"}</Text>
            </View>
            <Privilege ok={!isGuest} label="Attendance & Punch" value={isGuest ? "View only" : "Triage & Regularize"} />
            <Privilege ok={!isGuest} label="Medical Proof Inspection" value={isGuest ? "View metadata" : "Authorized Download"} />
            <Privilege ok={!isGuest} label="Org Policy Settings" value={isGuest ? "PATCH locked" : "PATCH Permitted"} />
            <Privilege ok label="Audit Trail (BR-12)" value="Logged & Monitored" last />
          </View>

          <TouchableOpacity style={styles.navCard} onPress={() => router.push("/org-settings" as never)}>
            <View>
              <Text style={styles.navTitle}>Organisation Settings</Text>
              <Text style={styles.navSub}>Timezone, shifts, grace periods & leave policies</Text>
            </View>
            <MaterialIcons name="chevron-right" size={22} color={colors.secondary} />
          </TouchableOpacity>
        </ScrollView>
        <BottomNavBar activeRoute="more" />
      </SafeAreaView>
    </ScreenGradient>
  );
}

function InfoRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.infoRow, !last && styles.infoBorder]}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function Privilege({
  label,
  value,
  ok,
  last,
}: {
  label: string;
  value: string;
  ok: boolean;
  last?: boolean;
}) {
  return (
    <View style={[styles.infoRow, !last && styles.infoBorder]}>
      <View style={{ flex: 1 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
      <MaterialIcons name={ok ? "check-circle" : "lock"} size={18} color={colors.onSurface} />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  back: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceContainerHigh,
  },
  kicker: {
    fontFamily: "Inter",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    color: colors.secondary,
  },
  title: { fontFamily: "Inter", fontSize: 22, fontWeight: "800", color: colors.onSurface },
  rolePills: { flexDirection: "row", gap: 6 },
  pill: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: colors.surfaceContainer,
  },
  pillOn: { backgroundColor: colors.primary },
  pillText: { fontFamily: "Inter", fontSize: 10, fontWeight: "700", color: colors.onSurface },
  pillTextOn: { color: colors.onPrimary },
  scroll: { paddingHorizontal: 16, paddingBottom: 120, gap: 16 },
  banner: {
    flexDirection: "row",
    gap: 10,
    padding: 14,
    borderRadius: 16,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  bannerTitle: { fontFamily: "Inter", fontSize: 13, fontWeight: "700", color: colors.onSurface },
  bannerCopy: { fontFamily: "Inter", fontSize: 12, color: colors.secondary, marginTop: 2, lineHeight: 17 },
  card: {
    backgroundColor: colors.glass,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    padding: 16,
    gap: 10,
  },
  hero: { flexDirection: "row", gap: 12, alignItems: "center" },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontFamily: "Inter", fontSize: 22, fontWeight: "700", color: colors.onPrimary },
  nameRow: { flexDirection: "row", alignItems: "center" },
  name: { fontFamily: "Inter", fontSize: 22, fontWeight: "700", color: colors.onSurface, textAlign: "center" },
  heroBlock: { alignItems: "center", gap: 12, paddingVertical: 4 },
  activeTag: { backgroundColor: colors.primary, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  activeTagText: { color: colors.onPrimary, fontSize: 11, fontWeight: "700", textTransform: "uppercase" },
  contactRow: { flexDirection: "row", alignItems: "stretch", minHeight: 52 },
  contactCol: { flex: 1, gap: 4, justifyContent: "center" },
  contactDivider: { width: 1, backgroundColor: "rgba(0,0,0,0.08)", marginHorizontal: 12 },
  emp: { fontFamily: "Inter", fontSize: 12, color: colors.secondary, marginTop: 2 },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#16a34a" },
  status: { fontFamily: "Inter", fontSize: 12, fontWeight: "600", color: colors.onSurface },
  headline: { fontFamily: "Inter", fontSize: 13, color: colors.onSurfaceVariant },
  chip: {
    alignSelf: "flex-start",
    backgroundColor: colors.surfaceContainer,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  chipText: { fontFamily: "Inter", fontSize: 11, fontWeight: "700", color: colors.onSurface },
  cardHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardTitle: { fontFamily: "Inter", fontSize: 15, fontWeight: "700", color: colors.onSurface },
  lock: { fontFamily: "Inter", fontSize: 11, fontWeight: "700", color: colors.secondary, textTransform: "uppercase" },
  infoRow: { paddingVertical: 8, flexDirection: "row", justifyContent: "space-between", gap: 12, alignItems: "center" },
  infoBorder: { borderBottomWidth: 1, borderBottomColor: "rgba(0,0,0,0.08)" },
  infoLabel: { fontFamily: "Inter", fontSize: 12, color: colors.secondary },
  infoValue: { fontFamily: "Inter", fontSize: 13, fontWeight: "600", color: colors.onSurface, textAlign: "right", flex: 1 },
  navCard: {
    backgroundColor: colors.glass,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  navTitle: { fontFamily: "Inter", fontSize: 15, fontWeight: "700", color: colors.onSurface },
  navSub: { fontFamily: "Inter", fontSize: 12, color: colors.secondary, marginTop: 2 },
});
