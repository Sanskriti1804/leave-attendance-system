import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from "react-native";
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from "expo-router";
import { getSession } from "../../../services/auth";
import {
  apiErrorMessage,
  displayName,
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
  error: "#ba1a1a",
};

export default function EmployeeHomeScreen() {
  const router = useRouter();
  const applyHref = (process.env.EXPO_PUBLIC_APPLY_LEAVE as string | undefined) || "/leave/apply";
  const listHref = (process.env.EXPO_PUBLIC_MY_LEAVE as string | undefined) || "/leave/list";
  const [me, setMe] = useState<EmployeePublic | null>(null);
  const [settings, setSettings] = useState<OrganisationSettings | null>(null);
  const [clock, setClock] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const session = await getSession();
        try {
          const profile = await getMe();
          if (!cancelled) {
            setMe(profile);
          }
        } catch {
          if (!cancelled) {
            setMe((session?.user as EmployeePublic | undefined) ?? null);
          }
        }
        try {
          const org = await getOrgSettings();
          if (!cancelled) {
            setSettings(org);
          }
        } catch (err) {
          if (!cancelled) {
            setError(apiErrorMessage(err));
          }
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const zone = settings?.timezone ?? "America/New_York";
    const tick = () => {
      setClock(
        new Date().toLocaleTimeString(undefined, {
          timeZone: zone,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [settings?.timezone]);

  const todayLabel = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: settings?.timezone,
  });
  const role = me?.role ?? "employee";

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Home</Text>
          <View style={styles.badgeContainer}>
            <View style={styles.badgeActive}>
              <Text style={styles.badgeTextActive}>{role === "employee" ? "EMP" : role === "admin" ? "ADM" : "GST"}</Text>
            </View>
            <TouchableOpacity
              style={styles.badgeInactive}
              onPress={() => {
                if (role === "admin" || role === "guest_admin") {
                  router.push("/admin" as never);
                }
              }}
            >
              <Text style={styles.badgeTextInactive}>ADM</Text>
            </TouchableOpacity>
          </View>
        </View>
        <TouchableOpacity style={styles.profileIcon} onPress={() => router.push("/(tabs)/profile" as never)}>
          <MaterialIcons name="person" size={18} color={colors.onPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.contentContainer}>
        {/* Timezone & Operational Header Strip */}
        <View style={styles.timezoneCard}>
          <View style={styles.timezoneLeft}>
            <View style={styles.timezoneRow}>
              <MaterialIcons name="schedule" size={15} color={colors.secondary} />
              <Text style={styles.timezoneLabel}>{settings?.timezone ?? "America/New_York"}</Text>
            </View>
            <Text style={styles.dateText}>{loading ? "Loading…" : todayLabel}</Text>
          </View>
          <View style={styles.syncBadge}>
            <View style={styles.syncDot} />
            <Text style={styles.syncText}>Sync 0s</Text>
          </View>
        </View>

        {/* Live Clock & Dual Punch Control Console */}
        <View style={styles.punchCard}>
          <View style={styles.punchHeader}>
            <View>
              <Text style={styles.punchLabel}>Operational Clock</Text>
              <View style={styles.clockRow}>
                <Text style={styles.clockText}>{clock || "--:--:--"}</Text>
                <Text style={styles.amPmText}>{displayName(me)}</Text>
              </View>
            </View>
            <View style={styles.shiftBadge}>
              <MaterialIcons name="timer" size={16} color={colors.secondary} />
              <Text style={styles.shiftText}>
                Shift: {settings?.workStart ?? "—"} - {settings?.workEnd ?? "—"}
              </Text>
            </View>
          </View>

          <View style={styles.punchButtonsRow}>
            {/* Punch In */}
            <View style={styles.punchBoxDisabled}>
              <View style={styles.punchBoxHeader}>
                <Text style={styles.punchBoxLabel}>Check-In</Text>
                <MaterialIcons name="check-circle" size={20} color={colors.primary} />
              </View>
              <View style={styles.punchBoxFooter}>
                <View style={styles.disabledButton}>
                  <Text style={styles.disabledButtonText}>Checked In</Text>
                </View>
                <Text style={styles.punchTimeText}>At 08:58 AM EST</Text>
              </View>
            </View>

            {/* Punch Out */}
            <View style={styles.punchBoxActive}>
              <View style={styles.punchBoxHeader}>
                <Text style={styles.punchBoxLabelActive}>Check-Out</Text>
                <MaterialIcons name="logout" size={20} color={colors.primary} />
              </View>
              <View style={styles.punchBoxFooter}>
                <TouchableOpacity style={styles.activeButton}>
                  <MaterialIcons name="fingerprint" size={18} color={colors.onPrimary} />
                  <Text style={styles.activeButtonText}>Check Out</Text>
                </TouchableOpacity>
                <Text style={styles.punchTimeText}>Armed • Geofence OK</Text>
              </View>
            </View>
          </View>

          <View style={styles.br10Banner}>
            <MaterialIcons name="lock-clock" size={16} color={colors.secondary} />
            <Text style={styles.br10Text}>
              <Text style={styles.br10Bold}>BR-10 Compliance:</Text> Punches permanently logged. Check-in disabled to prevent duplicate timestamp. Check-out sequence active.
            </Text>
          </View>
        </View>

        {/* Today's Metric Breakdown */}
        <View style={styles.metricsRow}>
          <View style={styles.metricBox}>
            <Text style={styles.metricLabel} numberOfLines={1}>Work Log</Text>
            <Text style={styles.metricValue}>04h 16m</Text>
            <View style={styles.metricFooterRow}>
              <MaterialIcons name="timelapse" size={14} color={colors.secondary} />
              <Text style={styles.metricFooterText} numberOfLines={1}>Of 08h 00m</Text>
            </View>
          </View>
          <View style={styles.metricBox}>
            <Text style={styles.metricLabel} numberOfLines={1}>Attendance</Text>
            <View style={styles.onDutyBadge}>
              <View style={styles.onDutyDot} />
              <Text style={styles.onDutyText}>On Duty</Text>
            </View>
            <Text style={styles.metricFooterText} numberOfLines={1}>Present Tier-1</Text>
          </View>
          <View style={styles.metricBox}>
            <Text style={styles.metricLabel} numberOfLines={1}>Break Log</Text>
            <Text style={styles.metricValueSmall}>Not on break</Text>
            <View style={styles.metricFooterRow}>
              <MaterialIcons name="coffee" size={14} color={colors.secondary} />
              <Text style={styles.metricFooterText} numberOfLines={1}>0m Taken</Text>
            </View>
          </View>
        </View>

        {/* Quick Action Console */}
        <View style={styles.quickActionsContainer}>
          <View style={styles.quickActionsHeader}>
            <Text style={styles.quickActionsTitle}>Quick Actions</Text>
            <Text style={styles.quickActionsSubtitle}>Self-Service</Text>
          </View>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity style={styles.quickActionCard} onPress={() => router.push(applyHref as never)}>
              <View style={styles.quickActionLeft}>
                <View style={styles.quickActionIcon}>
                  <MaterialIcons name="event" size={20} color={colors.onSurface} />
                </View>
                <View style={styles.quickActionTexts}>
                  <Text style={styles.quickActionCardTitle}>Apply Leave</Text>
                  <Text style={styles.quickActionCardSubtitle}>Paid, Casual, or Medical PTO</Text>
                </View>
              </View>
              <MaterialIcons name="arrow-forward" size={18} color={colors.secondary} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickActionCard} onPress={() => router.push(listHref as never)}>
              <View style={styles.quickActionLeft}>
                <View style={styles.quickActionIcon}>
                  <MaterialIcons name="edit-calendar" size={20} color={colors.onSurface} />
                </View>
                <View style={styles.quickActionTexts}>
                  <Text style={styles.quickActionCardTitle}>My Leave</Text>
                  <Text style={styles.quickActionCardSubtitle}>List and withdraw applications</Text>
                </View>
              </View>
              <MaterialIcons name="arrow-forward" size={18} color={colors.secondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Today's Punch Ledger */}
        <View style={styles.ledgerCard}>
          <View style={styles.ledgerHeader}>
            <View style={styles.ledgerHeaderLeft}>
              <MaterialIcons name="history" size={18} color={colors.secondary} />
              <Text style={styles.ledgerTitle}>Recent Punch Activity</Text>
            </View>
            <Text style={styles.ledgerSubtitle}>Today (1 Record)</Text>
          </View>
          <View style={styles.ledgerRow}>
            <View style={styles.ledgerRowLeft}>
              <View style={styles.ledgerIconContainer}>
                <MaterialIcons name="login" size={16} color={colors.onSurface} />
              </View>
              <View style={styles.ledgerTexts}>
                <View style={styles.ledgerRowTitleContainer}>
                  <Text style={styles.ledgerRowTitle}>Check In</Text>
                  <View style={styles.ledgerBadge}>
                    <Text style={styles.ledgerBadgeText}>BIOMETRIC</Text>
                  </View>
                </View>
                <Text style={styles.ledgerRowSubtitle} numberOfLines={1}>Verified On-Site • Geofence Node 4A OK</Text>
              </View>
            </View>
            <View style={styles.ledgerRowRight}>
              <Text style={styles.ledgerTime}>08:58:12 AM</Text>
              <Text style={styles.ledgerZone}>EST</Text>
            </View>
          </View>
        </View>

        {/* Spec & Privacy Isolation Footer Card */}
        <View style={styles.footerCard}>
          <MaterialIcons name="shield" size={20} color={colors.secondary} />
          <View style={styles.footerTexts}>
            <Text style={styles.footerTitle}>AUTH-02 DATA ISOLATION ENFORCED</Text>
            <Text style={styles.footerBody}>
              {error
                ? error
                : "Attendance punch APIs are not implemented on the server. Leave actions use live /api/v1 routes. Scoped to the signed-in employee."}
            </Text>
          </View>
        </View>

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
    height: 64,
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
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.onSurface,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: 16,
    padding: 2,
  },
  badgeActive: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 16,
    backgroundColor: colors.primary,
  },
  badgeTextActive: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.onPrimary,
  },
  badgeInactive: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 16,
  },
  badgeTextInactive: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.onSurfaceVariant,
  },
  profileIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
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
  timezoneCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceContainerLow,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  timezoneLeft: {
    flex: 1,
  },
  timezoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timezoneLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.06 * 11,
  },
  dateText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.onSurface,
    marginTop: 2,
  },
  syncBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surfaceContainerHighest,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
  },
  syncDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  syncText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.onSurface,
    textTransform: 'uppercase',
  },
  punchCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    gap: 16,
  },
  punchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceContainerHigh,
  },
  punchLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.secondary,
    textTransform: 'uppercase',
  },
  clockRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginTop: 4,
  },
  clockText: {
    fontSize: 30,
    fontWeight: '600',
    color: colors.onSurface,
    letterSpacing: -0.6,
  },
  amPmText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.secondary,
  },
  shiftBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surfaceContainerLow,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  shiftText: {
    fontSize: 12,
    color: colors.onSurface,
  },
  punchButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  punchBoxDisabled: {
    flex: 1,
    padding: 12,
    backgroundColor: colors.surfaceContainer,
    borderRadius: 8,
    justifyContent: 'space-between',
    minHeight: 110,
    opacity: 0.85,
  },
  punchBoxActive: {
    flex: 1,
    padding: 12,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 8,
    justifyContent: 'space-between',
    minHeight: 110,
  },
  punchBoxHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  punchBoxLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.secondary,
    textTransform: 'uppercase',
  },
  punchBoxLabelActive: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.onSurface,
    textTransform: 'uppercase',
  },
  punchBoxFooter: {
    marginTop: 12,
  },
  disabledButton: {
    width: '100%',
    paddingVertical: 8,
    paddingHorizontal: 4,
    backgroundColor: colors.surfaceContainerHighest,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.secondary,
  },
  activeButton: {
    width: '100%',
    paddingVertical: 8,
    paddingHorizontal: 8,
    backgroundColor: colors.primary,
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  activeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.onPrimary,
  },
  punchTimeText: {
    fontSize: 11,
    color: colors.secondary,
    textAlign: 'center',
    marginTop: 4,
  },
  br10Banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 8,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 8,
  },
  br10Text: {
    flex: 1,
    fontSize: 11,
    color: colors.onSurfaceVariant,
    lineHeight: 14,
  },
  br10Bold: {
    fontWeight: '600',
    color: colors.onSurface,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  metricBox: {
    flex: 1,
    padding: 12,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    justifyContent: 'space-between',
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.secondary,
    textTransform: 'uppercase',
  },
  metricValue: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.onSurface,
    marginVertical: 4,
  },
  metricValueSmall: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.onSurface,
    marginVertical: 4,
  },
  metricFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  metricFooterText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.secondary,
    textTransform: 'uppercase',
  },
  onDutyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surfaceContainerHigh,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 16,
    marginVertical: 4,
    alignSelf: 'flex-start',
  },
  onDutyDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  onDutyText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.onSurface,
    textTransform: 'uppercase',
  },
  quickActionsContainer: {
    gap: 8,
  },
  quickActionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  quickActionsTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  quickActionsSubtitle: {
    fontSize: 11,
    color: colors.secondary,
  },
  quickActionsGrid: {
    flexDirection: 'column',
    gap: 8,
  },
  quickActionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  quickActionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  quickActionIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionTexts: {
    flexDirection: 'column',
  },
  quickActionCardTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.onSurface,
  },
  quickActionCardSubtitle: {
    fontSize: 12,
    color: colors.secondary,
  },
  ledgerCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    padding: 16,
    gap: 12,
  },
  ledgerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceContainerHigh,
  },
  ledgerHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ledgerTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.onSurface,
  },
  ledgerSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.secondary,
    textTransform: 'uppercase',
  },
  ledgerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  ledgerRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  ledgerIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ledgerTexts: {
    flex: 1,
  },
  ledgerRowTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ledgerRowTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.onSurface,
  },
  ledgerBadge: {
    backgroundColor: colors.surfaceContainer,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  ledgerBadgeText: {
    fontSize: 11,
    color: colors.secondary,
  },
  ledgerRowSubtitle: {
    fontSize: 12,
    color: colors.secondary,
  },
  ledgerRowRight: {
    alignItems: 'flex-end',
  },
  ledgerTime: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.onSurface,
  },
  ledgerZone: {
    fontSize: 11,
    color: colors.secondary,
    textTransform: 'uppercase',
  },
  footerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 8,
  },
  footerTexts: {
    flex: 1,
  },
  footerTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.onSurface,
    textTransform: 'uppercase',
  },
  footerBody: {
    fontSize: 12,
    color: colors.secondary,
    marginTop: 2,
  },
});
