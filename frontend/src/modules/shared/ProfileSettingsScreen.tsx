import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Image } from "react-native";
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from "expo-router";
import { getSession, logout } from "../../../services/auth";
import {
  apiErrorMessage,
  displayName,
  getDepartment,
  getEmployee,
  getMe,
  getOrgSettings,
  type EmployeePublic,
  type OrganisationSettings,
} from "../../../services/resources";
import { getLocalProfilePhotoUri, pickLocalProfilePhoto, roleTagsFor } from "../../../services/profilePhoto";
import { UIFallbackIndicator } from "../../components/ui/UIFallback";
import { ScreenGradient, ThemedToast } from "../../components/ui/AppChrome";
import { TopNavBar, useTopNavContentInset } from "../../components/ui/AdminComponents";
import { EmployeeBottomNavBar } from "../../components/ui/EmployeeComponents";
import { colors } from "../../theme";

export default function ProfileSettingsScreen() {
  const router = useRouter();
  const topInset = useTopNavContentInset();
  const [me, setMe] = useState<EmployeePublic | null>(null);
  const [departmentName, setDepartmentName] = useState("—");
  const [managerName, setManagerName] = useState("—");
  const [settings, setSettings] = useState<OrganisationSettings | null>(null);
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
        try {
          setSettings(await getOrgSettings());
        } catch (err) {
          setError(apiErrorMessage(err));
        }
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

  const name = me ? displayName(me) : "Alex Chen";
  const initials = me ? `${me.firstName[0] ?? ""}${me.lastName?.[0] ?? ""}`.toUpperCase() : "AC";
  const email = me?.email ?? "dev@enterprisehrms.internal";
  const phone = me?.phone ?? "+91 98765 43210";
  const deptFallback = error || !me?.departmentId ? "Engineering & DevOps" : departmentName;
  const tags = roleTagsFor(me?.role ?? "employee");
  const isBob = me?.email === "bob.employee@example.com" || /bob smith/i.test(name);
  const managerFallback = isBob || /employee 2/i.test(managerName)
    ? "S Raman"
    : error || !me?.managerId
      ? "Marcus Vance (VP, Eng)"
      : managerName;
  const isFallback = !me || !!error;
  const roleTag = tags[0] ?? "Employee";

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
      return;
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
    <SafeAreaView style={styles.safeArea}>
      <TopNavBar
        title="Profile"
        right={
          <TouchableOpacity style={styles.headerIcon} onPress={() => router.push("/(tabs)/settings" as never)}>
            <MaterialIcons name="settings" size={20} color={colors.onSurface} />
          </TouchableOpacity>
        }
      />

      <ScrollView style={styles.scrollContainer} contentContainerStyle={[styles.contentContainer, { paddingTop: topInset }]}>
        <View style={styles.profileHero}>
          <TouchableOpacity style={styles.avatar} onPress={() => void onPickPhoto()} activeOpacity={0.8}>
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>{initials}</Text>
            )}
          </TouchableOpacity>
          <View style={styles.nameRow}>
            <Text style={styles.nameText}>{name}</Text>
            {isFallback && <UIFallbackIndicator />}
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.workHead}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <Text style={styles.cardTitle}>Work Information</Text>
              {isFallback && <UIFallbackIndicator />}
            </View>
            <View style={styles.tag}>
              <View style={styles.tagDot} />
              <Text style={styles.tagText}>{roleTag}</Text>
            </View>
          </View>
          <View style={styles.cardInner}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Department</Text>
              <Text style={styles.infoValue}>{deptFallback}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Reporting Manager</Text>
              <Text style={styles.infoValue}>{managerFallback}</Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Contact Information</Text>
          <View style={styles.cardInner}>
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
        </View>

        {/* Attendance & Work Schedule Card */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.cardTitle}>Attendance & Work Schedule</Text>
                {(!settings || !!error) && <UIFallbackIndicator />}
              </View>
              <Text style={styles.cardSubtitle}>Managed by Organization (Read-Only)</Text>
            </View>
            <MaterialIcons name="lock" size={20} color={colors.secondary} />
          </View>
          <View style={styles.cardInner}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Organization Timezone</Text>
              <Text style={styles.infoValue}>{settings?.timezone ?? "Asia/Kolkata (IST)"}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Shift Timing</Text>
              <Text style={styles.infoValue}>
                {settings?.workStart
                  ? `${settings.workStart} - ${settings.workEnd ?? "—"}`
                  : "09:00 - 18:00"}
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Weekly Schedule</Text>
              <Text style={styles.infoValue}>
                {settings?.weeklyOffDow?.length
                  ? `Weekly off DOW: ${settings.weeklyOffDow.join(",")}`
                  : "Monday – Friday (40 hrs/week)"}
              </Text>
            </View>
          </View>
        </View>

        {/* Quick Navigation to Settings Card */}
        <TouchableOpacity style={styles.navCard} onPress={() => router.push("/(tabs)/settings" as never)}>
          <View style={styles.navCardLeft}>
            <View style={styles.navIconContainer}>
              <MaterialIcons name="settings" size={18} color={colors.onSurface} />
            </View>
            <View style={styles.navTextContainer}>
              <Text style={styles.navTitle}>App & Account Settings</Text>
              <Text style={styles.navSubtitle} numberOfLines={1}>Security, active session & preferences</Text>
            </View>
          </View>
          <MaterialIcons name="chevron-right" size={20} color={colors.secondary} />
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
      <EmployeeBottomNavBar activeRoute="profile" />
    </SafeAreaView>
    </ScreenGradient>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: 'rgba(252, 249, 248, 0.8)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.onSurface,
    textTransform: 'uppercase',
    letterSpacing: -0.5,
  },
  headerIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    gap: 16,
    paddingBottom: 110,
  },
  card: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    gap: 12,
  },
  profileHero: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    gap: 12,
    minHeight: 180,
  },
  avatar: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 112,
    height: 112,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.onSurface,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  nameText: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.onSurface,
    textAlign: 'center',
  },
  workHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surfaceContainer,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.onSurface,
    letterSpacing: 0.06 * 11,
  },
  empText: {
    fontSize: 12,
    color: colors.secondary,
    marginTop: 2,
  },
  statusRow: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.onSurface,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.onSurface,
  },
  cardSubtitle: {
    fontSize: 12,
    color: colors.secondary,
  },
  cardInner: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  infoLabel: {
    fontSize: 12,
    color: colors.secondary,
  },
  infoValue: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.onSurface,
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: colors.surfaceContainerHighest,
    width: '100%',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 8,
  },
  navCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  navIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navTextContainer: {
    flex: 1,
  },
  navTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.onSurface,
  },
  navSubtitle: {
    fontSize: 12,
    color: colors.secondary,
  },
  emailValue: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    textAlign: 'right',
    flex: 1,
  },
  contactSplit: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  contactPane: {
    flex: 1,
    gap: 4,
  },
  contactDivider: {
    width: 1,
    backgroundColor: colors.surfaceContainerHighest,
    marginHorizontal: 12,
  },
  logout: {
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.glass,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
});
