import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { getSession } from '../../../services/auth';
import { formatDateTimeIST } from '../../utils/date';
import {
  apiErrorMessage,
  displayName,
  getMe,
  listLeaveTypes,
  listLeaves,
  submitLeaveDraft,
  withdrawLeave,
  type EmployeePublic,
  type LeaveApplication,
  type LeaveType,
} from '../../../services/resources';

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
  onSurfaceVariant: "#4c4546",
};

function matchesFilter(status: string, filter: string): boolean {
  if (filter === "all") {
    return true;
  }
  if (filter === "pending") {
    return status === "DRAFT" || status === "SUBMITTED" || status === "PENDING_HR_REVIEW";
  }
  if (filter === "approved") {
    return status === "APPROVED";
  }
  return status === "REJECTED" || status === "CANCELLED" || status === "WITHDRAWN";
}

function statusLabel(status: string): string {
  return status.replaceAll("_", " ");
}

export default function MyLeaveListScreen() {
  const router = useRouter();
  const applyHref = (process.env.EXPO_PUBLIC_APPLY_LEAVE as string | undefined) || "/leave/apply";
  const [activeFilter, setActiveFilter] = useState('all');
  const [me, setMe] = useState<EmployeePublic | null>(null);
  const [types, setTypes] = useState<LeaveType[]>([]);
  const [items, setItems] = useState<LeaveApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

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
      const [leaveTypes, leaves] = await Promise.all([listLeaveTypes(), listLeaves()]);
      setTypes(leaveTypes.items);
      setItems(leaves.items);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const typeName = (leaveTypeId: number) =>
    types.find((row) => row.leaveTypeId === leaveTypeId)?.name ?? `Type ${leaveTypeId}`;

  const filtered = useMemo(
    () => items.filter((row) => matchesFilter(row.status, activeFilter)),
    [activeFilter, items],
  );

  const count = (filter: string) => items.filter((row) => matchesFilter(row.status, filter)).length;

  async function onWithdraw(leaveId: number) {
    setBusyId(leaveId);
    setError(null);
    try {
      await withdrawLeave(leaveId);
      await load();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  async function onSubmitDraft(leaveId: number) {
    setBusyId(leaveId);
    setError(null);
    try {
      await submitLeaveDraft(leaveId);
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
        <Text style={styles.headerTitle}>Leave Management</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconButton}>
            <MaterialIcons name="tune" size={20} color={colors.secondary} />
          </TouchableOpacity>
          <View style={styles.profileAvatar}>
            <MaterialIcons name="person" size={18} color={colors.onPrimary} />
          </View>
        </View>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        
        <View style={styles.topRow}>
          <View>
            <Text style={styles.topLabel}>LEAVE RECORDS</Text>
            <Text style={styles.empName}>{displayName(me)}</Text>
          </View>
          <TouchableOpacity style={styles.applyBtn} onPress={() => router.push(applyHref as never)}>
            <MaterialIcons name="add" size={18} color={colors.onPrimary} />
            <Text style={styles.applyBtnText}>Apply Leave</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll} contentContainerStyle={styles.filtersContainer}>
          <TouchableOpacity style={activeFilter === 'all' ? styles.filterChipActive : styles.filterChip} onPress={() => setActiveFilter('all')}>
            <Text style={activeFilter === 'all' ? styles.filterChipTextActive : styles.filterChipText}>All</Text>
            <View style={activeFilter === 'all' ? styles.filterBadgeActive : styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{count("all")}</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={activeFilter === 'pending' ? styles.filterChipActive : styles.filterChip} onPress={() => setActiveFilter('pending')}>
            <Text style={activeFilter === 'pending' ? styles.filterChipTextActive : styles.filterChipText}>Pending</Text>
            <View style={activeFilter === 'pending' ? styles.filterBadgeActive : styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{count("pending")}</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={activeFilter === 'approved' ? styles.filterChipActive : styles.filterChip} onPress={() => setActiveFilter('approved')}>
            <Text style={activeFilter === 'approved' ? styles.filterChipTextActive : styles.filterChipText}>Approved</Text>
            <View style={activeFilter === 'approved' ? styles.filterBadgeActive : styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{count("approved")}</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={activeFilter === 'history' ? styles.filterChipActive : styles.filterChip} onPress={() => setActiveFilter('history')}>
            <Text style={activeFilter === 'history' ? styles.filterChipTextActive : styles.filterChipText}>Past / History</Text>
            <View style={activeFilter === 'history' ? styles.filterBadgeActive : styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{count("history")}</Text>
            </View>
          </TouchableOpacity>
        </ScrollView>

        {loading ? <ActivityIndicator color={colors.primary} style={{ marginTop: 16 }} /> : null}
        {error ? <Text style={[styles.cardDuration, { paddingHorizontal: 16 }]}>{error}</Text> : null}

        <View style={styles.listContainer}>
          {!loading && filtered.length === 0 ? (
            <Text style={styles.cardDuration}>No leave applications for this filter.</Text>
          ) : null}
          {filtered.map((leave) => {
            const pending = leave.status === "SUBMITTED" || leave.status === "PENDING_HR_REVIEW";
            const draft = leave.status === "DRAFT";
            const approved = leave.status === "APPROVED";
            const history = leave.status === "REJECTED" || leave.status === "CANCELLED" || leave.status === "WITHDRAWN";
            return (
              <View key={leave.leaveId} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardInfo}>
                    <View style={styles.cardTitleRow}>
                      <Text style={styles.cardTitle}>{typeName(leave.leaveTypeId)}</Text>
                      <View
                        style={
                          approved
                            ? styles.statusBadgeApproved
                            : history
                              ? styles.statusBadgeRejected
                              : draft
                                ? styles.statusBadgeDraft
                                : styles.statusBadgePending
                        }
                      >
                        <Text
                          style={
                            approved ? styles.statusBadgeTextApproved : styles.statusBadgeTextPending
                          }
                        >
                          {statusLabel(leave.status)}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.cardDate}>{leave.startDate} – {leave.endDate}</Text>
                    <Text style={styles.cardDuration}>Duration: {leave.numberOfDays} day(s) · {leave.durationType}</Text>
                  </View>
                  <View style={styles.cardIconBox}>
                    <MaterialIcons name="event-available" size={18} color={colors.onSurface} />
                  </View>
                </View>

                <View style={styles.cardReasonBox}>
                  <View style={styles.reasonRow}>
                    <MaterialIcons name="assignment" size={16} color={colors.onSurface} />
                    <Text style={styles.reasonText}>Reason: {leave.reason}</Text>
                  </View>
                  {leave.hrComments ? (
                    <View style={styles.fileRow}>
                      <MaterialIcons name="chat-bubble" size={14} color={colors.secondary} />
                      <Text style={styles.fileText}>{leave.hrComments}</Text>
                    </View>
                  ) : null}
                </View>

                {pending ? (
                  <View style={styles.cardFooter}>
                    <View style={styles.footerTime}>
                      <MaterialIcons name="schedule" size={16} color={colors.secondary} />
                      <Text style={styles.footerTimeText}>{formatDateTimeIST(leave.createdAt)}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => void onWithdraw(leave.leaveId)}
                      disabled={busyId === leave.leaveId}
                    >
                      <MaterialIcons name="undo" size={16} color={colors.onSurface} />
                      <Text style={styles.actionBtnText}>{busyId === leave.leaveId ? "..." : "Withdraw Request"}</Text>
                    </TouchableOpacity>
                  </View>
                ) : null}

                {draft ? (
                  <View style={styles.cardFooterRight}>
                    <TouchableOpacity
                      style={styles.actionBtnPrimary}
                      onPress={() => void onSubmitDraft(leave.leaveId)}
                      disabled={busyId === leave.leaveId}
                    >
                      <MaterialIcons name="send" size={16} color={colors.onPrimary} />
                      <Text style={styles.actionBtnPrimaryText}>{busyId === leave.leaveId ? "..." : "Submit Draft"}</Text>
                    </TouchableOpacity>
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.surface },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, height: 56, backgroundColor: 'rgba(252, 249, 248, 0.9)',
    borderBottomWidth: 1, borderBottomColor: colors.surfaceContainer,
  },
  headerTitle: { fontSize: 18, fontWeight: '600', color: colors.onSurface },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  profileAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  container: { flex: 1 },
  content: { paddingBottom: 64, gap: 16 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 16 },
  topLabel: { fontSize: 11, fontWeight: '600', color: colors.secondary, letterSpacing: 0.5 },
  empName: { fontSize: 20, fontWeight: '600', color: colors.onSurface, marginTop: 4 },
  applyBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary, paddingHorizontal: 16, height: 44, borderRadius: 8, gap: 8 },
  applyBtnText: { fontSize: 14, fontWeight: '500', color: colors.onPrimary },
  filtersScroll: { flexGrow: 0 },
  filtersContainer: { paddingHorizontal: 16, gap: 8, paddingBottom: 4 },
  filterChipActive: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary, height: 36, paddingHorizontal: 12, borderRadius: 8, gap: 8 },
  filterChipTextActive: { fontSize: 12, fontWeight: '500', color: colors.onPrimary },
  filterBadgeActive: { backgroundColor: colors.surface, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 12 },
  filterChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceContainer, height: 36, paddingHorizontal: 12, borderRadius: 8, gap: 8 },
  filterChipText: { fontSize: 12, fontWeight: '500', color: colors.onSurface },
  filterBadge: { backgroundColor: colors.surfaceContainerHighest, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 12 },
  filterBadgeText: { fontSize: 11, fontWeight: '600', color: colors.onSurface },
  listContainer: { paddingHorizontal: 16, gap: 12 },
  card: { backgroundColor: colors.surfaceContainerLowest, borderRadius: 12, padding: 16, gap: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardInfo: { flex: 1, gap: 4 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { fontSize: 18, fontWeight: '600', color: colors.onSurface },
  statusBadgePending: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceContainerHigh, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, gap: 4 },
  statusBadgeTextPending: { fontSize: 11, fontWeight: '600', color: colors.onSurface },
  statusBadgeApproved: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, gap: 4 },
  statusBadgeTextApproved: { fontSize: 11, fontWeight: '600', color: colors.onPrimary },
  statusBadgeRejected: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceContainerHighest, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, gap: 4 },
  statusBadgeTextRejected: { fontSize: 11, fontWeight: '600', color: colors.onSurface },
  statusBadgeDraft: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceContainer, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, gap: 4 },
  statusBadgeTextDraft: { fontSize: 11, fontWeight: '600', color: colors.onSurface },
  cardDate: { fontSize: 14, fontWeight: '500', color: colors.onSurface, marginTop: 4 },
  cardDuration: { fontSize: 12, color: colors.secondary },
  cardIconBox: { width: 32, height: 32, borderRadius: 8, backgroundColor: colors.surfaceContainer, alignItems: 'center', justifyContent: 'center' },
  cardReasonBox: { backgroundColor: colors.surfaceContainerLow, padding: 12, borderRadius: 8, gap: 8 },
  reasonRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  reasonText: { fontSize: 12, color: colors.onSurface, flex: 1 },
  fileRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingTop: 4 },
  fileText: { fontSize: 12, color: colors.secondary, flex: 1, lineHeight: 18 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 4 },
  footerTime: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  footerTimeText: { fontSize: 12, color: colors.secondary },
  actionBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceContainer, height: 44, paddingHorizontal: 12, borderRadius: 8, gap: 4 },
  actionBtnText: { fontSize: 12, fontWeight: '500', color: colors.onSurface },
  cardCommentBox: { backgroundColor: colors.surfaceContainer, padding: 12, borderRadius: 8, gap: 4 },
  commentHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  commentTitle: { fontSize: 11, fontWeight: '600', color: colors.onSurface, letterSpacing: 0.5 },
  commentDesc: { fontSize: 12, color: colors.onSurfaceVariant, paddingLeft: 24, lineHeight: 18 },
  cardDraftBox: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.surfaceContainerLow, padding: 12, borderRadius: 8 },
  draftText: { fontSize: 12, color: colors.secondary, fontStyle: 'italic' },
  draftBadge: { fontSize: 11, fontWeight: '600', color: colors.secondary, letterSpacing: 0.5 },
  cardFooterRight: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', paddingTop: 4, gap: 8 },
  actionBtnPrimary: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary, height: 44, paddingHorizontal: 16, borderRadius: 8, gap: 4 },
  actionBtnPrimaryText: { fontSize: 12, fontWeight: '500', color: colors.onPrimary },
});
