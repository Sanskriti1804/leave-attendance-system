import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from "react-native";
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from "expo-router";
import { getSession } from "../../../services/auth";
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

const colors = {
  surface: "#fcf9f8",
  surfaceContainerLowest: "#ffffff",
  surfaceContainerLow: "#f6f3f2",
  surfaceContainer: "#f0edec",
  surfaceContainerHigh: "#ebe7e7",
  surfaceContainerHighest: "#e5e2e1",
  onSurface: "#1c1b1b",
  onSurfaceVariant: "#4c4546",
  primary: "#000000",
  onPrimary: "#ffffff",
  secondary: "#585f6c",
};

export default function ProfileSettingsScreen() {
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
          // keep session user
        }
        if (cancelled) {
          return;
        }
        setMe(profile);
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

  const name = displayName(me);
  const initials = me ? `${me.firstName[0] ?? ""}${me.lastName?.[0] ?? ""}`.toUpperCase() : "—";

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>PROFILE</Text>
        </View>
        <TouchableOpacity style={styles.headerIcon} onPress={() => router.push("/(tabs)/settings" as never)}>
          <MaterialIcons name="settings" size={20} color={colors.onSurface} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.contentContainer}>
        {/* Profile Header Card */}
        <View style={styles.card}>
          <View style={styles.profileHeaderRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <View style={styles.profileInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.nameText}>{name}</Text>
                <View style={styles.tag}>
                  <Text style={styles.tagText}>{me?.role?.toUpperCase() ?? "—"}</Text>
                </View>
              </View>
              <Text style={styles.empText}>EMP-{me?.employeeId ?? "—"}</Text>
              <View style={styles.statusRow}>
                <Text style={styles.statusText}>{me?.status ?? (error ?? "—")}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Work Information Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Work Information</Text>
          <View style={styles.cardInner}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Role</Text>
              <Text style={styles.infoValue}>{me?.role ?? "—"}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Department</Text>
              <Text style={styles.infoValue}>{departmentName}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Reporting Manager</Text>
              <Text style={styles.infoValue}>{managerName}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Work Location</Text>
              <Text style={styles.infoValue}>—</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Official Email</Text>
              <Text style={styles.infoValue}>{me?.email ?? "—"}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Joining Date</Text>
              <Text style={styles.infoValue}>{me?.joiningDate ?? "—"}</Text>
            </View>
          </View>
        </View>

        {/* Attendance & Work Schedule Card */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View>
              <Text style={styles.cardTitle}>Attendance & Work Schedule</Text>
              <Text style={styles.cardSubtitle}>Managed by Organization (Read-Only)</Text>
            </View>
            <MaterialIcons name="lock" size={20} color={colors.secondary} />
          </View>
          <View style={styles.cardInner}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Organization Timezone</Text>
              <Text style={styles.infoValue}>{settings?.timezone ?? "—"}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Shift Timing</Text>
              <Text style={styles.infoValue}>
                {settings?.workStart ?? "—"} - {settings?.workEnd ?? "—"}
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Weekly Schedule</Text>
              <Text style={styles.infoValue}>
                {settings?.weeklyOffDow?.length
                  ? `Weekly off DOW: ${settings.weeklyOffDow.join(",")}`
                  : "Configured in org settings"}
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
              <Text style={styles.navSubtitle} numberOfLines={1}>Notifications, Security, Active Devices & Preferences</Text>
            </View>
          </View>
          <MaterialIcons name="chevron-right" size={20} color={colors.secondary} />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.surface,
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
    paddingBottom: 80,
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
  profileHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.onSurface,
  },
  profileInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  nameText: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.onSurface,
  },
  tag: {
    backgroundColor: colors.surfaceContainer,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
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
  }
});
