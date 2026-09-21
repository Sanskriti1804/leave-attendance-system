import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, TextInput } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { getSession, logout } from "../../../services/auth";
import {
  apiErrorMessage,
  changePassword,
  displayName,
  getDepartment,
  getMe,
  getOrgSettings,
  listEmployees,
  type EmployeePublic,
  type OrganisationSettings,
} from "../../../services/resources";
import { colors } from "../../theme";
import { ScreenGradient, ThemedDialog } from "../../components/ui/AppChrome";
import { BottomNavBar, SCROLL_UNDER_BOTTOM_NAV, TopNavBar, useTopNavContentInset } from "../../components/ui/AdminComponents";
import { UserAvatar } from "../../components/ui/UserAvatar";
import { pickAndSaveProfilePhoto } from "../../../services/profilePhoto";
import { CompactNotifications } from "../../components/ui/CompactNotifications";
import { isTeamLead } from "../../utils/workforce";

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
  const [directory, setDirectory] = useState<EmployeePublic[]>([]);
  const [settings, setSettings] = useState<OrganisationSettings | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [dialog, setDialog] = useState<{ title: string; message: string } | null>(null);
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
  const name = me ? displayName(me) : "—";
  const showLead = me ? isTeamLead(directory, me.employeeId) : false;

  return (
    <ScreenGradient>
      <SafeAreaView style={styles.safe}>
        <TopNavBar title="Profile" />
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
              fallback="—"
              onPress={me ? () => { void pickAndSaveProfilePhoto(me.employeeId); } : undefined}
            />
            <Text style={styles.name}>{name}</Text>
            {showLead ? (
              <View style={styles.activeTag}>
                <Text style={styles.activeTagText}>Team Lead</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.card}>
            <View style={styles.cardHead}>
              <Text style={styles.cardTitle}>Work Information</Text>
              <View style={styles.activeTag}><Text style={styles.activeTagText}>{me?.status ?? "—"}</Text></View>
            </View>
            <InfoRow label="Department" value={departmentName} />
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

          <View style={styles.card}>
            <CompactNotifications />
          </View>

          <TouchableOpacity style={styles.navCard} onPress={() => router.push("/leave/types" as never)}>
            <View>
              <Text style={styles.navTitle}>Leave Types</Text>
              <Text style={styles.navSub}>Create, deactivate, or delete leave categories</Text>
            </View>
            <MaterialIcons name="chevron-right" size={22} color={colors.secondary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.navCard} onPress={() => router.push("/org-settings" as never)}>
            <View>
              <Text style={styles.navTitle}>Organisation Settings</Text>
              <Text style={styles.navSub}>Timezone, shifts, grace periods & leave policies</Text>
            </View>
            <MaterialIcons name="chevron-right" size={22} color={colors.secondary} />
          </TouchableOpacity>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Attendance Preferences</Text>
            <InfoRow label="Organization Timezone" value={settings?.timezone ?? "—"} />
            <InfoRow
              label="Standard Shift"
              value={`${settings?.workStart ?? "—"} - ${settings?.workEnd ?? "—"}`}
            />
            <InfoRow
              label="Work Week"
              value={settings?.weeklyOffDow?.length ? `Weekly off ISO DOW: ${settings.weeklyOffDow.join(", ")}` : "—"}
              last
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Security</Text>
            <TouchableOpacity style={styles.navCard} onPress={() => setShowPassword((value) => !value)}>
              <View>
                <Text style={styles.navTitle}>Change Password</Text>
                <Text style={styles.navSub}>Update the password used to sign in.</Text>
              </View>
              <MaterialIcons name={showPassword ? "expand-less" : "expand-more"} size={22} color={colors.secondary} />
            </TouchableOpacity>
            {showPassword ? (
              <View style={{ gap: 8 }}>
                <TextInput
                  style={styles.input}
                  placeholder="Current password"
                  placeholderTextColor={colors.secondary}
                  secureTextEntry
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                />
                <TextInput
                  style={styles.input}
                  placeholder="New password"
                  placeholderTextColor={colors.secondary}
                  secureTextEntry
                  value={newPassword}
                  onChangeText={setNewPassword}
                />
                <TouchableOpacity
                  style={styles.navCard}
                  disabled={savingPassword}
                  onPress={async () => {
                    setSavingPassword(true);
                    try {
                      await changePassword({ currentPassword, newPassword });
                      setCurrentPassword("");
                      setNewPassword("");
                      setShowPassword(false);
                      setDialog({ title: "Password updated", message: "Use the new password the next time you sign in." });
                    } catch (err) {
                      setDialog({ title: "Could not change password", message: apiErrorMessage(err) });
                    } finally {
                      setSavingPassword(false);
                    }
                  }}
                >
                  <Text style={styles.navTitle}>{savingPassword ? "Updating…" : "Update password"}</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>

          <TouchableOpacity
            style={styles.navCard}
            onPress={async () => {
              await logout();
              router.replace("/login");
            }}
          >
            <Text style={styles.navTitle}>Log out</Text>
            <MaterialIcons name="logout" size={22} color={colors.secondary} />
          </TouchableOpacity>
        </ScrollView>
        <BottomNavBar activeRoute="more" />
        <ThemedDialog
          visible={dialog != null}
          title={dialog?.title ?? ""}
          message={dialog?.message}
          onRequestClose={() => setDialog(null)}
          actions={[{ label: "OK", onPress: () => setDialog(null), primary: true }]}
        />
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
  scroll: { paddingHorizontal: 16, paddingBottom: SCROLL_UNDER_BOTTOM_NAV, gap: 16 },
  card: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    padding: 16,
    gap: 10,
  },
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
  input: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    color: colors.onSurface,
    backgroundColor: colors.surfaceContainerLowest,
  },
});
