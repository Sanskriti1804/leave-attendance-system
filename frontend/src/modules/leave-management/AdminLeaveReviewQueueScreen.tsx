import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { getSession } from '../../../services/auth';
import {
  apiErrorMessage,
  approveLeave,
  displayName,
  getMe,
  listEmployees,
  listLeaveTypes,
  listLeaves,
  rejectLeave,
  type EmployeePublic,
  type LeaveApplication,
  type LeaveType,
} from '../../../services/resources';
import { UIFallbackIndicator } from '../../components/ui/UIFallback';
import { BottomNavBar } from '../../components/ui/AdminComponents';

const colors = {
  surface: "#fcf9f8",
  primary: "#000000",
  onPrimary: "#ffffff",
  surfaceContainerLowest: "#ffffff",
  surfaceContainerLow: "#f6f3f2",
  surfaceContainer: "#f0edec",
  surfaceContainerHigh: "#ebe7e7",
  surfaceContainerHighest: "#e5e2e1",
  secondary: "#585f6c",
  error: "#ba1a1a",
  border: "#cfc4c5",
  onSurface: "#1c1b1b",
};

const FALLBACK_EMPLOYEES: EmployeePublic[] = [
  { employeeId: 1, firstName: "Milind", lastName: "Rawat", email: "milind@enterprisehrms.internal", departmentId: 1, role: "employee", managerId: null, joiningDate: null, createdAt: "", status: "ACTIVE", obsolete: false },
  { employeeId: 2, firstName: "Elena", lastName: "D'Souza", email: "elena@enterprisehrms.internal", departmentId: 1, role: "employee", managerId: null, joiningDate: null, createdAt: "", status: "ACTIVE", obsolete: false },
  { employeeId: 3, firstName: "Rajesh", lastName: "Patel", email: "rajesh@enterprisehrms.internal", departmentId: 1, role: "employee", managerId: null, joiningDate: null, createdAt: "", status: "ACTIVE", obsolete: false },
];

const FALLBACK_TYPES: LeaveType[] = [
  { leaveTypeId: 1, name: "Medical Leave", description: null, requiresMedicalDocument: true, allowedSex: null, obsolete: false },
  { leaveTypeId: 2, name: "Casual Leave", description: null, requiresMedicalDocument: false, allowedSex: null, obsolete: false },
  { leaveTypeId: 3, name: "Clarification Thread", description: null, requiresMedicalDocument: false, allowedSex: null, obsolete: false },
];

const FALLBACK_LEAVES: LeaveApplication[] = [
  { leaveId: 1, employeeId: 1, leaveTypeId: 1, startDate: "2026-10-26", endDate: "2026-10-29", numberOfDays: 4, durationType: "FULL_DAY", halfDayType: null, status: "PENDING_HR_REVIEW", reason: "Medical leave", hrComments: null, createdAt: "2026-10-25T10:00:00Z", selectedDates: [] },
  { leaveId: 2, employeeId: 2, leaveTypeId: 2, startDate: "2026-11-02", endDate: "2026-11-02", numberOfDays: 1, durationType: "FULL_DAY", halfDayType: null, status: "PENDING_HR_REVIEW", reason: "Personal work", hrComments: null, createdAt: "2026-11-01T10:00:00Z", selectedDates: [] },
  { leaveId: 3, employeeId: 3, leaveTypeId: 3, startDate: "2026-11-05", endDate: "2026-11-05", numberOfDays: 1, durationType: "FULL_DAY", halfDayType: null, status: "PENDING_HR_REVIEW", reason: "Clarification required on previous leave", hrComments: null, createdAt: "2026-11-04T10:00:00Z", selectedDates: [] },
];

export default function AdminLeaveReviewQueueScreen() {
  const [me, setMe] = useState<EmployeePublic | null>(null);
  const [filter, setFilter] = useState<"PENDING_HR_REVIEW" | "APPROVED">("PENDING_HR_REVIEW");
  const [items, setItems] = useState<LeaveApplication[]>([]);
  const [types, setTypes] = useState<LeaveType[]>([]);
  const [employees, setEmployees] = useState<EmployeePublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const isGuest = me?.role === "guest_admin";

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const session = await getSession();
      try {
        setMe(await getMe());
      } catch {
        setMe((session?.user as EmployeePublic | undefined) ?? null);
      }
      const [leaves, leaveTypes, people] = await Promise.all([
        listLeaves(filter),
        listLeaveTypes(),
        listEmployees().catch(() => ({ items: [] as EmployeePublic[] })),
      ]);
      setItems(leaves.items);
      setTypes(leaveTypes.items);
      setEmployees(people.items);
    } catch (err) {
      setError(apiErrorMessage(err));
      setItems(FALLBACK_LEAVES);
      setTypes(FALLBACK_TYPES);
      setEmployees(FALLBACK_EMPLOYEES);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    void load();
  }, [load]);

  const employeeName = (employeeId: number) => {
    const row = employees.find((item) => item.employeeId === employeeId);
    return row ? displayName(row) : `EMP-${employeeId}`;
  };

  const typeName = (leaveTypeId: number) =>
    types.find((row) => row.leaveTypeId === leaveTypeId)?.name ?? `Type ${leaveTypeId}`;

  async function onApprove(leaveId: number) {
    setBusyId(leaveId);
    setError(null);
    try {
      await approveLeave(leaveId);
      await load();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  async function onReject(leaveId: number) {
    setBusyId(leaveId);
    setError(null);
    try {
      await rejectLeave(leaveId, "Rejected from review queue");
      await load();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>LEAVE REVIEW QUEUE</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.iconButton}>
              <MaterialIcons name="search" size={20} color={colors.onSurface} />
            </TouchableOpacity>
            <View style={styles.profileAvatar}>
              <MaterialIcons name="person" size={18} color={colors.onPrimary} />
            </View>
          </View>
        </View>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.screenTitle}>Leave Review Queue</Text>

        <View style={styles.roleToggle}>
          <View style={styles.roleInfo}>
            <View style={[styles.roleDot, { backgroundColor: isGuest ? colors.error : colors.primary }]} />
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.roleName}>{error ? "HR Admin (Full Authority)" : (isGuest ? "Guest Admin (View Only)" : me?.role === "admin" ? "HR Admin (Full Authority)" : me?.role ?? "Unknown role")}</Text>
                {error && <UIFallbackIndicator style={{ marginTop: 2 }} />}
              </View>
              <Text style={styles.roleUser}>{error ? "Preeti Kaur" : displayName(me)}</Text>
            </View>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statusChips} contentContainerStyle={styles.statusChipsContent}>
          <TouchableOpacity
            style={filter === "PENDING_HR_REVIEW" ? styles.chipActive : styles.chipInactive}
            onPress={() => setFilter("PENDING_HR_REVIEW")}
          >
            <Text style={filter === "PENDING_HR_REVIEW" ? styles.chipActiveText : styles.chipInactiveText}>PENDING REVIEW</Text>
            <View style={filter === "PENDING_HR_REVIEW" ? styles.chipBadgeActive : styles.chipBadgeInactive}>
              <Text style={filter === "PENDING_HR_REVIEW" ? styles.chipBadgeTextActive : styles.chipBadgeTextInactive}>{error ? "5" : items.length}</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={filter === "APPROVED" ? styles.chipActive : styles.chipInactive}
            onPress={() => setFilter("APPROVED")}
          >
            <Text style={filter === "APPROVED" ? styles.chipActiveText : styles.chipInactiveText}>APPROVED</Text>
          </TouchableOpacity>
        </ScrollView>

        {loading ? <ActivityIndicator color={colors.primary} /> : null}
        {error ? <Text style={styles.empRole}>{error}</Text> : null}
        {!loading && items.length === 0 ? <Text style={styles.empRole}>No applications in this queue.</Text> : null}

        {items.map((leave) => (
        <View key={leave.leaveId} style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.empInfo}>
              <View style={styles.avatarPlaceholder} />
              <View>
                <View style={styles.nameRow}>
                  <Text style={styles.empName}>{employeeName(leave.employeeId)}</Text>
                  <View style={styles.empIdBadge}>
                    <Text style={styles.empIdText}>EMP-{leave.employeeId}</Text>
                  </View>
                </View>
                <Text style={styles.empRole}>{error ? employees.find(e => e.employeeId === leave.employeeId)?.role : leave.status.replaceAll("_", " ")}</Text>
              </View>
            </View>
          </View>

          <View style={styles.detailsMatrix}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>LEAVE CLASSIFICATION</Text>
              <Text style={styles.detailValue}>{typeName(leave.leaveTypeId)}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>STATUTORY DURATION</Text>
              <Text style={styles.detailValue}>{leave.numberOfDays} Days · {leave.startDate}–{leave.endDate}</Text>
            </View>
            <View style={styles.detailFullRow}>
              <Text style={styles.detailLabel}>ATTESTED JUSTIFICATION</Text>
              <Text style={styles.detailDesc}>{leave.reason}</Text>
            </View>
          </View>

          {!isGuest && filter === "PENDING_HR_REVIEW" && me?.role === "admin" ? (
            <View style={styles.actionsBox}>
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={styles.approveBtn}
                  onPress={() => void onApprove(leave.leaveId)}
                  disabled={busyId === leave.leaveId}
                >
                  <MaterialIcons name="done-all" size={18} color={colors.onPrimary} />
                  <Text style={styles.approveBtnText}>{busyId === leave.leaveId ? "..." : "Approve Leave"}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.rejectBtn}
                  onPress={() => void onReject(leave.leaveId)}
                  disabled={busyId === leave.leaveId}
                >
                  <MaterialIcons name="chat-bubble-outline" size={18} color={colors.onSurface} />
                  <Text style={styles.rejectBtnText}>Reject / Clarify</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.guestNotice}>
              <View style={styles.guestNoticeLeft}>
                <MaterialIcons name="visibility" size={18} color={colors.secondary} />
                <View>
                  <Text style={styles.guestNoticeTitle}>{isGuest ? "GUEST VIEW ACCESS" : "READ"}</Text>
                  <Text style={styles.guestNoticeSub}>
                    {isGuest ? "Read-only view • Actions restricted to HR Admin" : leave.status}
                  </Text>
                </View>
              </View>
              <View style={styles.readOnlyBadge}>
                <Text style={styles.readOnlyText}>READ ONLY</Text>
              </View>
            </View>
          )}
        </View>
        ))}

      </ScrollView>
      <BottomNavBar activeRoute="leave" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.surface },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: 'rgba(252, 249, 248, 0.9)',
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceContainer,
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: colors.onSurface },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  profileAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 64, gap: 16 },
  screenTitle: { fontSize: 20, fontWeight: '600', color: colors.onSurface },
  roleToggle: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 8, backgroundColor: colors.surfaceContainerLow, borderRadius: 8
  },
  roleInfo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  roleDot: { width: 8, height: 8, borderRadius: 4 },
  roleName: { fontSize: 12, fontWeight: '500', color: colors.onSurface },
  roleUser: { fontSize: 12, color: colors.secondary },
  toggleBtn: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceContainerHighest,
    paddingHorizontal: 12, height: 44, borderRadius: 4, gap: 4
  },
  toggleBtnText: { fontSize: 11, fontWeight: '600', color: colors.onSurface },
  statusChips: { marginHorizontal: -16 },
  statusChipsContent: { paddingHorizontal: 16, gap: 8 },
  chipActive: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 4, gap: 4
  },
  chipActiveText: { fontSize: 11, fontWeight: '600', color: colors.onPrimary },
  chipBadgeActive: { backgroundColor: 'rgba(252,249,248,0.2)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  chipBadgeTextActive: { fontSize: 11, color: colors.onPrimary },
  chipInactive: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceContainer,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 4, gap: 4
  },
  chipInactiveText: { fontSize: 11, fontWeight: '600', color: colors.secondary },
  chipBadgeInactive: { backgroundColor: colors.surfaceContainerHigh, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  chipBadgeTextInactive: { fontSize: 11, color: colors.onSurface },
  card: { backgroundColor: colors.surfaceContainerLowest, borderRadius: 12, padding: 16, gap: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  empInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarPlaceholder: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.surfaceContainerHigh },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  empName: { fontSize: 16, fontWeight: '500', color: colors.onSurface },
  empIdBadge: { backgroundColor: colors.surfaceContainer, paddingHorizontal: 4, paddingVertical: 2, borderRadius: 4 },
  empIdText: { fontSize: 11, fontWeight: '600', color: colors.secondary },
  empRole: { fontSize: 12, color: colors.secondary },
  detailsMatrix: { flexDirection: 'row', flexWrap: 'wrap', padding: 12, backgroundColor: colors.surfaceContainerLow, borderRadius: 8, gap: 8 },
  detailItem: { width: '48%' },
  detailFullRow: { width: '100%', marginTop: 8 },
  detailFullRowFlex: { width: '100%', flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  detailLabel: { fontSize: 11, fontWeight: '600', color: colors.secondary, marginBottom: 2 },
  detailValue: { fontSize: 12, fontWeight: '500', color: colors.onSurface },
  detailDesc: { fontSize: 12, color: colors.onSurface, lineHeight: 16 },
  detailNote: { fontSize: 12, color: colors.secondary },
  attachmentBox: { padding: 12, backgroundColor: colors.surfaceContainer, borderRadius: 8, gap: 12 },
  attachmentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  attachmentTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  attachmentTitle: { fontSize: 11, fontWeight: '600', color: colors.onSurface, letterSpacing: 0.5 },
  reqBadge: { backgroundColor: colors.surfaceContainerHigh, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  reqBadgeText: { fontSize: 11, fontWeight: '600', color: colors.secondary },
  fileCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.surfaceContainerLowest, padding: 8, borderRadius: 4 },
  fileInfo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  fileIconBox: { width: 36, height: 36, borderRadius: 4, backgroundColor: colors.surfaceContainerHigh, alignItems: 'center', justifyContent: 'center' },
  fileName: { fontSize: 12, fontWeight: '500', color: colors.onSurface },
  fileSize: { fontSize: 12, color: colors.secondary },
  downloadBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary, paddingHorizontal: 12, height: 44, borderRadius: 4, gap: 4 },
  downloadBtnText: { fontSize: 11, fontWeight: '600', color: colors.onPrimary },
  actionsBox: { gap: 8, marginTop: 8 },
  actionRow: { flexDirection: 'row', gap: 8 },
  approveBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary, height: 44, borderRadius: 4, gap: 4 },
  approveBtnText: { fontSize: 14, fontWeight: '500', color: colors.onPrimary },
  rejectBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceContainerHighest, height: 44, borderRadius: 4, gap: 4 },
  rejectBtnText: { fontSize: 14, fontWeight: '500', color: colors.onSurface },
  noteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 44, gap: 4 },
  noteBtnText: { fontSize: 12, fontWeight: '500', color: colors.secondary },
  guestNotice: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, backgroundColor: colors.surfaceContainerLow, borderRadius: 8 },
  guestNoticeLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  guestNoticeTitle: { fontSize: 11, fontWeight: '600', color: colors.secondary },
  guestNoticeSub: { fontSize: 12, color: colors.secondary },
  readOnlyBadge: { backgroundColor: colors.surfaceContainerHighest, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  readOnlyText: { fontSize: 11, fontWeight: '600', color: colors.secondary }
});
