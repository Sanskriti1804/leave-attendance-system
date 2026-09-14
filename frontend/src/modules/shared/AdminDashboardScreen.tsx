import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, TextInput } from "react-native";
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from "expo-router";
import { getSession } from "../../../services/auth";
import {
  apiErrorMessage,
  displayName,
  getMe,
  listEmployees,
  listLeaves,
  type EmployeePublic,
  type LeaveApplication,
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
  errorContainer: "#ffdad6",
  onErrorContainer: "#93000a",
};

export default function AdminDashboardScreen() {
  const router = useRouter();
  const reviewHref = (process.env.EXPO_PUBLIC_ADMIN_LEAVE_REVIEW as string | undefined) || "/leave/admin-review";
  const [me, setMe] = useState<EmployeePublic | null>(null);
  const [employees, setEmployees] = useState<EmployeePublic[]>([]);
  const [pending, setPending] = useState<LeaveApplication[]>([]);
  const [approved, setApproved] = useState<LeaveApplication[]>([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [employeeTotal, setEmployeeTotal] = useState<number | null>(null);

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
          const people = await listEmployees();
          if (!cancelled) {
            setEmployees(people.items);
            setEmployeeTotal(people.total ?? people.items.length);
          }
        } catch (err) {
          if (!cancelled) {
            setError(apiErrorMessage(err));
          }
        }
        try {
          const [pendingLeaves, approvedLeaves] = await Promise.all([
            listLeaves("PENDING_HR_REVIEW"),
            listLeaves("APPROVED"),
          ]);
          if (!cancelled) {
            setPending(pendingLeaves.items);
            setApproved(approvedLeaves.items);
          }
        } catch (err) {
          if (!cancelled) {
            setError(apiErrorMessage(err));
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

  const filteredEmployees = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) {
      return employees;
    }
    return employees.filter((row) =>
      `${row.firstName} ${row.lastName ?? ""} ${row.email}`.toLowerCase().includes(term),
    );
  }, [employees, query]);

  const today = new Date().toISOString().slice(0, 10);
  const onLeaveToday = approved.filter((row) => row.startDate <= today && row.endDate >= today).length;
  const isGuest = me?.role === "guest_admin";

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>ADMIN DASHBOARD</Text>
        </View>
        <TouchableOpacity style={styles.profileIcon}>
          <MaterialIcons name="person" size={18} color={colors.onPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.contentContainer}>
        {/* Operational Context Header Block */}
        <View style={styles.contextCard}>
          <View style={styles.contextHeader}>
            <Text style={styles.contextTitle}>HR Operations</Text>
            <View style={styles.contextActions}>
              <TouchableOpacity style={styles.iconButton}>
                <MaterialIcons name="visibility" size={20} color={colors.secondary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.guestButton}>
                <Text style={styles.guestButtonText}>{isGuest ? "GUEST" : (me?.role ?? "—").toUpperCase()}</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.contextInner}>
            <Text style={styles.hrNameText}>{displayName(me)}</Text>
            <View style={styles.dateRow}>
              <MaterialIcons name="schedule" size={16} color={colors.secondary} />
              <Text style={styles.dateText}>{new Date().toLocaleDateString()}</Text>
            </View>
          </View>
        </View>

        <View style={styles.searchCard}>
          <MaterialIcons name="search" size={20} color={colors.secondary} />
          <TextInput 
            style={styles.searchInput}
            placeholder="Search employees, records, or departments..."
            placeholderTextColor={colors.secondary}
            value={query}
            onChangeText={setQuery}
          />
        </View>

        {/* Org-Wide Pulse & Headcount Summary */}
        <View style={styles.pulseCard}>
          <View style={styles.pulseHeader}>
            <View>
              <Text style={styles.pulseLabel}>Live Workforce</Text>
              <View style={styles.pulseCountRow}>
                <Text style={styles.pulseCountText}>{employeeTotal ?? "—"}</Text>
                <Text style={styles.pulseCountSubtext}>Employees (API)</Text>
              </View>
            </View>
            <View style={styles.pulseRight}>
              <Text style={styles.pulsePercentText}>{error ? "!" : "LIVE"}</Text>
              <Text style={styles.pulseLabel}>{error ? "See errors below" : "Leave + headcount"}</Text>
            </View>
          </View>

          {/* 2x3 Metric Grid of Count Tiles */}
          <View style={styles.gridContainer}>
            {/* Present */}
            <TouchableOpacity style={styles.gridTile}>
              <View style={styles.tileHeader}>
                <Text style={styles.tileLabel}>Present</Text>
                <MaterialIcons name="how-to-reg" size={16} color={colors.onSurface} />
              </View>
              <View style={styles.tileBody}>
                <Text style={styles.tileNumber}>—</Text>
                <Text style={styles.tileSubtext}>No punch API</Text>
              </View>
            </TouchableOpacity>

            {/* On Leave */}
            <TouchableOpacity style={styles.gridTile}>
              <View style={styles.tileHeader}>
                <Text style={styles.tileLabel}>On Leave</Text>
                <MaterialIcons name="event-busy" size={16} color={colors.onSurface} />
              </View>
              <View style={styles.tileBody}>
                <Text style={styles.tileNumber}>{onLeaveToday}</Text>
                <Text style={styles.tileSubtext}>Approved today</Text>
              </View>
            </TouchableOpacity>

            {/* Absent */}
            <TouchableOpacity style={styles.gridTile}>
              <View style={styles.tileHeader}>
                <Text style={styles.tileLabel}>Absent</Text>
                <MaterialIcons name="person-off" size={16} color={colors.error} />
              </View>
              <View style={styles.tileBody}>
                <Text style={styles.tileNumberError}>—</Text>
                <Text style={styles.tileSubtext}>No punch API</Text>
              </View>
            </TouchableOpacity>

            {/* Unmarked */}
            <TouchableOpacity style={styles.gridTile}>
              <View style={styles.tileHeader}>
                <Text style={styles.tileLabel}>Unmarked</Text>
                <MaterialIcons name="pending" size={16} color={colors.secondary} />
              </View>
              <View style={styles.tileBody}>
                <Text style={styles.tileNumber}>—</Text>
                <Text style={styles.tileSubtext}>No punch API</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* High-Priority Review Banner Component */}
          <View style={styles.priorityBanner}>
            <View style={styles.bannerLeft}>
              <View style={styles.bannerIconContainer}>
                <MaterialIcons name="assignment-late" size={18} color={colors.onPrimary} />
              </View>
              <View style={styles.bannerTexts}>
                <Text style={styles.bannerTitle}>Pending Leave Reviews</Text>
                <Text style={styles.bannerSubtitle}>{pending.length} pending HR review</Text>
              </View>
            </View>
            <View style={styles.bannerRight}>
              <View style={styles.reqBadge}>
                <Text style={styles.reqBadgeText}>{pending.length} REQ</Text>
              </View>
              <TouchableOpacity style={styles.reviewButton} onPress={() => router.push(reviewHref as never)}>
                <Text style={styles.reviewButtonText}>Review Queue</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Urgent Action Center */}
        <View style={styles.actionCenterSection}>
          <View style={styles.actionHeader}>
            <MaterialIcons name="bolt" size={16} color={colors.onSurface} />
            <Text style={styles.actionTitle}>Requires HR Action</Text>
          </View>

          {pending.slice(0, 5).map((leave) => {
            const employee = employees.find((row) => row.employeeId === leave.employeeId);
            return (
          <View key={leave.leaveId} style={styles.actionCard}>
            <View style={styles.actionCardTop}>
              <View style={styles.actionCardTopLeft}>
                <Text style={styles.actionItemName}>{employee ? displayName(employee) : `EMP-${leave.employeeId}`}</Text>
                <Text style={styles.actionItemSub}>
                  {leave.status} • {leave.numberOfDays} Days ({leave.startDate} - {leave.endDate})
                </Text>
              </View>
            </View>
            <TouchableOpacity style={styles.actionCardBottom} onPress={() => router.push(reviewHref as never)}>
              <Text style={styles.actionCardBottomText}>Awaiting Review</Text>
              <MaterialIcons name="arrow-forward" size={16} color={colors.secondary} />
            </TouchableOpacity>
          </View>
            );
          })}
          {filteredEmployees.slice(0, 3).map((row) => (
            <View key={`emp-${row.employeeId}`} style={styles.actionCard}>
              <View style={styles.actionCardTop}>
                <View style={styles.actionCardTopLeft}>
                  <Text style={styles.actionItemName}>{displayName(row)}</Text>
                  <Text style={styles.actionItemSub}>{row.email} · {row.role}</Text>
                </View>
              </View>
            </View>
          ))}
          {error ? <Text style={styles.actionItemSub}>{error}</Text> : null}
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
    backgroundColor: 'rgba(252, 249, 248, 0.9)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.onSurface,
    textTransform: 'uppercase',
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
  contextCard: {
    backgroundColor: colors.surfaceContainerLowest,
    padding: 16,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    gap: 12,
  },
  contextHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  contextTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.onSurface,
    textTransform: 'uppercase',
  },
  contextActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: colors.errorContainer,
  },
  guestButtonText: {
    fontSize: 12,
    color: colors.onErrorContainer,
    fontWeight: '600',
  },
  contextInner: {
    backgroundColor: colors.surfaceContainerLow,
    padding: 12,
    borderRadius: 8,
    gap: 4,
  },
  hrNameText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.onSurface,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.onSurface,
  },
  searchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLowest,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    color: colors.onSurface,
  },
  pulseCard: {
    backgroundColor: colors.surfaceContainerLowest,
    padding: 16,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    gap: 12,
  },
  pulseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  pulseLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.secondary,
    textTransform: 'uppercase',
  },
  pulseCountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginTop: 2,
  },
  pulseCountText: {
    fontSize: 30,
    fontWeight: '600',
    color: colors.onSurface,
  },
  pulseCountSubtext: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.secondary,
  },
  pulseRight: {
    alignItems: 'flex-end',
  },
  pulsePercentText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.onSurface,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  gridTile: {
    width: '48%',
    backgroundColor: colors.surfaceContainerLow,
    padding: 12,
    borderRadius: 4,
    height: 80,
    justifyContent: 'space-between',
  },
  tileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tileLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.secondary,
    textTransform: 'uppercase',
  },
  tileBody: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  tileNumber: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.onSurface,
  },
  tileNumberError: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.error,
  },
  tileSubtext: {
    fontSize: 12,
    color: colors.secondary,
  },
  priorityBanner: {
    backgroundColor: colors.primary,
    padding: 12,
    borderRadius: 4,
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bannerIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerTexts: {
    flexDirection: 'column',
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.onPrimary,
  },
  bannerSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
  },
  bannerRight: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 6,
  },
  reqBadge: {
    backgroundColor: colors.surfaceContainerLowest,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  reqBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.onSurface,
  },
  reviewButton: {
    borderWidth: 1,
    borderColor: colors.onPrimary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
  },
  reviewButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.onPrimary,
  },
  actionCenterSection: {
    gap: 8,
  },
  actionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 4,
  },
  actionTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.onSurface,
    textTransform: 'uppercase',
  },
  actionCard: {
    backgroundColor: colors.surfaceContainerLowest,
    padding: 16,
    borderRadius: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    gap: 12,
  },
  actionCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  actionCardTopLeft: {
    flexDirection: 'column',
  },
  actionItemName: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.onSurface,
  },
  actionItemSub: {
    fontSize: 12,
    color: colors.secondary,
    marginTop: 2,
  },
  actionCardBottom: {
    backgroundColor: colors.surfaceContainerLow,
    padding: 8,
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actionCardBottomText: {
    fontSize: 12,
    color: colors.secondary,
  },
});
