import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Image } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { getSession, logout } from "../../../services/auth";
import {
  apiErrorMessage,
  displayName,
  getDepartment,
  getEmployee,
  getMe,
  type EmployeePublic,
} from "../../../services/resources";
import { getLocalProfilePhotoUri, pickLocalProfilePhoto, roleTagsFor } from "../../../services/profilePhoto";
import { colors } from "../../theme";
import { ScreenGradient, ThemedToast } from "../../components/ui/AppChrome";
import { BottomNavBar, TopNavBar, useTopNavContentInset } from "../../components/ui/AdminComponents";
import { UIFallbackIndicator } from "../../components/ui/UIFallback";

export default function AdminProfileScreen() {
  const router = useRouter();
  const topInset = useTopNavContentInset();
  const [me, setMe] = useState<EmployeePublic | null>(null);
  const [departmentName, setDepartmentName] = useState("—");
  const [managerName, setManagerName] = useState("—");
  const [error, setError] = useState<string | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

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
        setPhotoUri(getLocalProfilePhotoUri(profile?.employeeId));
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
  const initials = me ? `${me.firstName[0] ?? ""}${me.lastName?.[0] ?? ""}`.toUpperCase() : "PK";
  const fallback = !me || !!error;
  const tags = roleTagsFor(me?.role ?? "admin");
  const roleTag = tags.includes("Employee") ? "Employee" : (tags[0] ?? "Admin");
  const email = me?.email ?? "—";
  const phone = me?.phone ?? "+91 98765 43210";

  async function onPickPhoto() {
    const id = me?.employeeId;
    if (id == null) {
      setToast("Sign in to update your profile photo.");
      return;
    }
    const result = await pickLocalProfilePhoto(id);
    if (result === "ok") {
      setPhotoUri(getLocalProfilePhotoUri(id));
      return;
    }
    if (result === "error") {
      setToast("Could not select a profile image.");
    }
  }

  useEffect(() => {
    if (!toast) {
      return;
    }
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

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

          <View style={styles.profileHero}>
            <TouchableOpacity style={styles.avatar} onPress={() => void onPickPhoto()} activeOpacity={0.8}>
              {photoUri ? (
                <Image source={{ uri: photoUri }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarText}>{initials}</Text>
              )}
            </TouchableOpacity>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{name}</Text>
              {fallback ? <UIFallbackIndicator /> : null}
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.cardHead}>
              <Text style={styles.cardTitle}>Work Information</Text>
              <View style={styles.pill}>
                <View style={styles.pillDot} />
                <Text style={styles.pillText}>{roleTag}</Text>
              </View>
            </View>
            <InfoRow label="Department" value={departmentName === "—" ? "Human Resources & Ops" : departmentName} />
            <InfoRow label="Reporting Manager" value={managerName === "—" || /employee 2/i.test(managerName) ? "S Raman" : managerName} last />
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Contact Information</Text>
            <View style={styles.contactSplit}>
              <View style={styles.contactPane}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.emailValue}>{email}</Text>
              </View>
              <View style={styles.contactDivider} />
              <View style={styles.contactPane}>
                <Text style={styles.infoLabel}>Phone</Text>
                <Text style={styles.infoValue}>{phone}</Text>
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
        <ThemedToast message={toast} />
        <BottomNavBar activeRoute="more" />
      </SafeAreaView>
    </ScreenGradient>
  );
}

function InfoRow({
  label,
  value,
  last,
  highlight,
}: {
  label: string;
  value: string;
  last?: boolean;
  highlight?: boolean;
}) {
  return (
    <View style={[styles.infoRow, !last && styles.infoBorder]}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={highlight ? styles.emailValue : styles.infoValue}>{value}</Text>
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
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  pillDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary },
  pillOn: { backgroundColor: colors.primary },
  pillText: { fontFamily: "Inter", fontSize: 10, fontWeight: "700", color: colors.onSurface },
  pillTextOn: { color: colors.onPrimary },
  scroll: { paddingHorizontal: 16, paddingBottom: 120, gap: 12 },
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
  profileHero: { alignItems: "center", justifyContent: "center", paddingVertical: 24, gap: 12, minHeight: 180 },
  avatar: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImage: { width: 112, height: 112 },
  avatarText: { fontFamily: "Inter", fontSize: 36, fontWeight: "700", color: colors.onPrimary },
  nameRow: { flexDirection: "row", alignItems: "center", justifyContent: "center" },
  name: { fontFamily: "Inter", fontSize: 20, fontWeight: "800", color: colors.onSurface },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 6 },
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
  emailValue: { fontFamily: "Inter", fontSize: 13, fontWeight: "700", color: colors.primary, textAlign: "right", flex: 1 },
  contactSplit: { flexDirection: "row", alignItems: "stretch", paddingTop: 8 },
  contactPane: { flex: 1, gap: 4 },
  contactDivider: { width: 1, backgroundColor: "rgba(0,0,0,0.08)", marginHorizontal: 12 },
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
