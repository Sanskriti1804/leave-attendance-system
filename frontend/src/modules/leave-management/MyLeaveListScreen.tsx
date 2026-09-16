import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { ScreenGradient } from "../../components/ui/AppChrome";
import { TopNavBar, useTopNavContentInset } from "../../components/ui/AdminComponents";
import { EmployeeBottomNavBar } from "../../components/ui/EmployeeComponents";
import { useRouter } from "expo-router";
import { getSession } from "../../../services/auth";
import { formatDateTimeIST } from "../../utils/date";
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
} from "../../../services/resources";
import { UIFallbackIndicator } from "../../components/ui/UIFallback";

const colors = {
  surface: "#fcf9f8",
  primary: "#242424",
  onPrimary: "#ffffff",
  surfaceContainerLowest: "#ffffff",
  surfaceContainerLow: "#f6f3f2",
  surfaceContainer: "#f0edec",
  surfaceContainerHigh: "#ebe7e7",
  surfaceContainerHighest: "#e5e2e1",
  secondary: "#585f6c",
  onSurface: "#1c1b1b",
  onSurfaceVariant: "#4c4546",
  glass: "rgb(222, 223, 227)",
  glassBorder: "rgba(0, 0, 0, 0.15)",
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

function statusMeta(status: string): { label: string; icon: keyof typeof MaterialIcons.glyphMap; kind: "pending" | "approved" | "rejected" | "draft" } {
  if (status === "APPROVED") {
    return { label: "Approved", icon: "check-circle", kind: "approved" };
  }
  if (status === "REJECTED") {
    return { label: "Rejected", icon: "cancel", kind: "rejected" };
  }
  if (status === "DRAFT") {
    return { label: "Draft", icon: "edit-note", kind: "draft" };
  }
  if (status === "CANCELLED") {
    return { label: "Cancelled", icon: "cancel", kind: "rejected" };
  }
  if (status === "WITHDRAWN") {
    return { label: "Withdrawn", icon: "undo", kind: "rejected" };
  }
  return { label: status.replaceAll("_", " "), icon: "hourglass-top", kind: "pending" };
}

function formatRange(start: string, end: string): string {
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" };
  const from = new Date(`${start}T00:00:00`).toLocaleDateString(undefined, opts);
  if (start === end) {
    return from;
  }
  return `${from} – ${new Date(`${end}T00:00:00`).toLocaleDateString(undefined, opts)}`;
}

function relativeSubmitted(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const hours = Math.max(0, Math.round(ms / 36e5));
  if (hours < 24) {
    return `Submitted ${hours || 1} hour${hours === 1 ? "" : "s"} ago`;
  }
  return `Logged on ${new Date(iso).toLocaleDateString(undefined, { month: "short", day: "2-digit", year: "numeric" })}`;
}

function iconForType(name: string): keyof typeof MaterialIcons.glyphMap {
  const lower = name.toLowerCase();
  if (lower.includes("medical") || lower.includes("sick")) {
    return "medical-services";
  }
  if (lower.includes("draft")) {
    return "drafts";
  }
  return "event-available";
}

const FALLBACK_TYPES: LeaveType[] = [
  { leaveTypeId: 1, name: "Medical Leave", description: null, requiresMedicalDocument: true, allowedSex: null, obsolete: false },
  { leaveTypeId: 2, name: "Casual Leave", description: null, requiresMedicalDocument: false, allowedSex: null, obsolete: false },
  { leaveTypeId: 3, name: "Annual Leave", description: null, requiresMedicalDocument: false, allowedSex: null, obsolete: false },
];

const FALLBACK_LEAVES: LeaveApplication[] = [
  { leaveId: 1, employeeId: 1, leaveTypeId: 1, startDate: "2026-10-26", endDate: "2026-10-29", numberOfDays: 3, durationType: "FULL_DAY", halfDayType: null, status: "PENDING_HR_REVIEW", reason: "Post-operative recovery • Medical Cert Attached", hrComments: null, createdAt: new Date(Date.now() - 4 * 36e5).toISOString(), selectedDates: [] },
  { leaveId: 2, employeeId: 1, leaveTypeId: 2, startDate: "2026-09-14", endDate: "2026-09-14", numberOfDays: 0.5, durationType: "HALF_DAY", halfDayType: "SECOND_HALF", status: "APPROVED", reason: "Family matter commitment", hrComments: "Approved by HR and TL", createdAt: "2026-09-10T10:00:00Z", selectedDates: [] },
  { leaveId: 3, employeeId: 1, leaveTypeId: 3, startDate: "2026-08-18", endDate: "2026-08-20", numberOfDays: 3, durationType: "FULL_DAY", halfDayType: null, status: "REJECTED", reason: "Vacation", hrComments: "HR Note: High sprint freeze period during release cycle. Please reschedule with manager.", createdAt: "2026-08-02T10:00:00Z", selectedDates: [] },
  { leaveId: 4, employeeId: 1, leaveTypeId: 2, startDate: "2026-11-12", endDate: "2026-11-12", numberOfDays: 1, durationType: "FULL_DAY", halfDayType: null, status: "DRAFT", reason: "Family event", hrComments: null, createdAt: "2026-11-01T10:00:00Z", selectedDates: [] },
];

export default function MyLeaveListScreen() {
  const router = useRouter();
  const topInset = useTopNavContentInset();
  const applyHref = (process.env.EXPO_PUBLIC_APPLY_LEAVE as string | undefined) || "/leave/apply";
  const [activeFilter, setActiveFilter] = useState("all");
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
      setTypes(FALLBACK_TYPES);
      setItems(FALLBACK_LEAVES);
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

  const filters = [
    { key: "all", label: "All" },
    { key: "pending", label: "Pending" },
    { key: "approved", label: "Approved" },
    { key: "history", label: "Past / History" },
  ] as const;

  return (
    <ScreenGradient>
      <SafeAreaView style={styles.safeArea}>
        <TopNavBar title="Leave List" />

        <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingTop: topInset }]}>
          <View style={styles.topRow}>
            <View>
              <Text style={styles.topLabel}>LEAVE RECORDS</Text>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text style={styles.empName}>{error ? "Priya Khanna" : displayName(me)}</Text>
                {error ? <UIFallbackIndicator style={{ marginTop: 4 }} /> : null}
              </View>
            </View>
            <TouchableOpacity style={styles.applyBtn} onPress={() => router.push(applyHref as never)}>
              <MaterialIcons name="add" size={18} color={colors.onPrimary} />
              <Text style={styles.applyBtnText}>Apply Leave</Text>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll} contentContainerStyle={styles.filtersContainer}>
            {filters.map((chip) => {
              const active = activeFilter === chip.key;
              return (
                <TouchableOpacity key={chip.key} style={active ? styles.filterChipActive : styles.filterChip} onPress={() => setActiveFilter(chip.key)}>
                  <Text style={active ? styles.filterChipTextActive : styles.filterChipText}>{chip.label}</Text>
                  <View style={active ? styles.filterBadgeActive : styles.filterBadge}>
                    <Text style={styles.filterBadgeText}>{count(chip.key)}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
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
              const history = leave.status === "REJECTED" || leave.status === "CANCELLED" || leave.status === "WITHDRAWN";
              const meta = statusMeta(leave.status);
              const name = typeName(leave.leaveTypeId);
              const half = leave.durationType.includes("HALF") || leave.halfDayType;
              return (
                <View key={leave.leaveId} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={styles.cardInfo}>
                      <View style={styles.cardTitleRow}>
                        <Text style={styles.cardTitle}>{name}</Text>
                        <View
                          style={
                            meta.kind === "approved"
                              ? styles.statusBadgeApproved
                              : meta.kind === "rejected"
                                ? styles.statusBadgeRejected
                                : meta.kind === "draft"
                                  ? styles.statusBadgeDraft
                                  : styles.statusBadgePending
                          }
                        >
                          <MaterialIcons name={meta.icon} size={13} color={meta.kind === "approved" ? colors.onPrimary : colors.onSurface} />
                          <Text style={meta.kind === "approved" ? styles.statusBadgeTextApproved : styles.statusBadgeTextPending}>{meta.label}</Text>
                        </View>
                      </View>
                      <Text style={styles.cardDate}>{formatRange(leave.startDate, leave.endDate)}</Text>
                      <Text style={styles.cardDuration}>
                        Duration: {leave.numberOfDays} day{leave.numberOfDays === 1 ? "" : "s"}
                        {half ? ` • Half-day ${leave.halfDayType === "SECOND_HALF" ? "Second 4h" : "First 4h"}` : " (Full-time)"}
                      </Text>
                    </View>
                    <View style={styles.cardIconBox}>
                      <MaterialIcons name={draft ? "drafts" : history && leave.status === "REJECTED" ? "event-busy" : iconForType(name)} size={18} color={colors.onSurface} />
                    </View>
                  </View>

                  {leave.status === "REJECTED" && leave.hrComments ? (
                    <View style={styles.cardCommentBox}>
                      <View style={styles.commentHeader}>
                        <MaterialIcons name="chat-bubble" size={16} color={colors.onSurface} />
                        <Text style={styles.commentTitle}>HR CLARIFICATION COMMENT</Text>
                      </View>
                      <Text style={styles.commentDesc}>“{leave.hrComments}”</Text>
                    </View>
                  ) : (
                    <View style={styles.cardReasonBox}>
                      <View style={styles.reasonRow}>
                        <MaterialIcons name="assignment" size={16} color={colors.onSurface} />
                        <Text style={styles.reasonText}>Reason: {leave.reason}</Text>
                      </View>
                      {leave.hrComments ? (
                        <View style={styles.fileRow}>
                          <MaterialIcons name="verified-user" size={16} color={colors.secondary} />
                          <Text style={styles.fileText}>{leave.hrComments}</Text>
                        </View>
                      ) : types.find((row) => row.leaveTypeId === leave.leaveTypeId)?.requiresMedicalDocument ? (
                        <View style={styles.fileRow}>
                          <MaterialIcons name="lock" size={15} color={colors.secondary} />
                          <Text style={styles.fileText}>Medical file included</Text>
                        </View>
                      ) : null}
                    </View>
                  )}

                  {pending ? (
                    <View style={styles.cardFooter}>
                      <View style={styles.footerTime}>
                        <MaterialIcons name="schedule" size={16} color={colors.secondary} />
                        <Text style={styles.footerTimeText}>{relativeSubmitted(leave.createdAt)}</Text>
                      </View>
                      <TouchableOpacity style={styles.actionBtn} onPress={() => void onWithdraw(leave.leaveId)} disabled={busyId === leave.leaveId}>
                        <MaterialIcons name="undo" size={16} color={colors.onSurface} />
                        <Text style={styles.actionBtnText}>{busyId === leave.leaveId ? "..." : "Withdraw Request"}</Text>
                      </TouchableOpacity>
                    </View>
                  ) : null}

                  {leave.status === "REJECTED" ? (
                    <View style={styles.cardFooter}>
                      <View style={styles.footerTime}>
                        <MaterialIcons name="history" size={16} color={colors.secondary} />
                        <Text style={styles.footerTimeText}>{formatDateTimeIST(leave.createdAt)}</Text>
                      </View>
                      <TouchableOpacity style={styles.actionBtn} onPress={() => router.push(applyHref as never)}>
                        <Text style={styles.actionBtnText}>Resubmit New</Text>
                      </TouchableOpacity>
                    </View>
                  ) : null}

                  {draft ? (
                    <>
                      <View style={styles.cardDraftBox}>
                        <Text style={styles.draftText}>Draft saved • Pending Submission</Text>
                        <Text style={styles.draftBadge}>UNSENT</Text>
                      </View>
                      <View style={styles.cardFooterRight}>
                        <TouchableOpacity style={styles.actionBtn} onPress={() => router.push(applyHref as never)}>
                          <MaterialIcons name="edit" size={16} color={colors.onSurface} />
                          <Text style={styles.actionBtnText}>Edit Draft</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.actionBtnPrimary} onPress={() => void onSubmitDraft(leave.leaveId)} disabled={busyId === leave.leaveId}>
                          <MaterialIcons name="send" size={16} color={colors.onPrimary} />
                          <Text style={styles.actionBtnPrimaryText}>{busyId === leave.leaveId ? "..." : "Submit Draft"}</Text>
                        </TouchableOpacity>
                      </View>
                    </>
                  ) : null}
                </View>
              );
            })}
          </View>
        </ScrollView>
        <EmployeeBottomNavBar activeRoute="leave" />
      </SafeAreaView>
    </ScreenGradient>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "transparent" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    height: 56,
  },
  headerTitle: { fontSize: 20, fontWeight: "700", color: colors.onSurface, letterSpacing: -0.2 },
  profileAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  container: { flex: 1 },
  content: { paddingBottom: 100, gap: 16 },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingTop: 8 },
  topLabel: { fontSize: 11, fontWeight: "600", color: colors.secondary, letterSpacing: 0.66 },
  empName: { fontSize: 20, fontWeight: "600", color: colors.onSurface, marginTop: 4 },
  applyBtn: { flexDirection: "row", alignItems: "center", backgroundColor: colors.primary, paddingHorizontal: 16, height: 44, borderRadius: 8, gap: 8 },
  applyBtnText: { fontSize: 14, fontWeight: "500", color: colors.onPrimary },
  filtersScroll: { flexGrow: 0, marginHorizontal: 16 },
  filtersContainer: {
    gap: 8,
    padding: 8,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: 16,
  },
  filterChipActive: { flexDirection: "row", alignItems: "center", backgroundColor: colors.primary, height: 36, paddingHorizontal: 12, borderRadius: 8, gap: 8 },
  filterChipTextActive: { fontSize: 12, fontWeight: "500", color: colors.onPrimary },
  filterBadgeActive: { backgroundColor: colors.surface, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 12 },
  filterChip: { flexDirection: "row", alignItems: "center", backgroundColor: colors.glass, height: 36, paddingHorizontal: 12, borderRadius: 8, gap: 8, borderWidth: 1, borderColor: colors.glassBorder },
  filterChipText: { fontSize: 12, fontWeight: "500", color: colors.onSurface },
  filterBadge: { backgroundColor: colors.surfaceContainerHighest, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 12 },
  filterBadgeText: { fontSize: 11, fontWeight: "600", color: colors.onSurface },
  listContainer: { paddingHorizontal: 16, gap: 12 },
  card: {
    backgroundColor: colors.glass,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.1,
    shadowRadius: 25,
    elevation: 5,
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  cardInfo: { flex: 1, gap: 4 },
  cardTitleRow: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  cardTitle: { fontSize: 18, fontWeight: "600", color: colors.onSurface },
  statusBadgePending: { flexDirection: "row", alignItems: "center", backgroundColor: colors.surfaceContainerHigh, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, gap: 4 },
  statusBadgeTextPending: { fontSize: 11, fontWeight: "600", color: colors.onSurface, textTransform: "capitalize" },
  statusBadgeApproved: { flexDirection: "row", alignItems: "center", backgroundColor: colors.primary, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, gap: 4 },
  statusBadgeTextApproved: { fontSize: 11, fontWeight: "600", color: colors.onPrimary },
  statusBadgeRejected: { flexDirection: "row", alignItems: "center", backgroundColor: colors.surfaceContainerHighest, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, gap: 4 },
  statusBadgeDraft: { flexDirection: "row", alignItems: "center", backgroundColor: colors.surfaceContainer, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, gap: 4 },
  cardDate: { fontSize: 14, fontWeight: "500", color: colors.onSurface, marginTop: 4 },
  cardDuration: { fontSize: 12, color: colors.secondary },
  cardIconBox: { width: 32, height: 32, borderRadius: 8, backgroundColor: colors.surfaceContainer, alignItems: "center", justifyContent: "center" },
  cardReasonBox: { backgroundColor: colors.surfaceContainerLow, padding: 12, borderRadius: 8, gap: 8 },
  reasonRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  reasonText: { fontSize: 12, color: colors.onSurface, flex: 1 },
  fileRow: { flexDirection: "row", alignItems: "flex-start", gap: 8, paddingTop: 4 },
  fileText: { fontSize: 12, color: colors.secondary, flex: 1, lineHeight: 18 },
  cardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingTop: 4 },
  footerTime: { flexDirection: "row", alignItems: "center", gap: 4, flex: 1 },
  footerTimeText: { fontSize: 12, color: colors.secondary },
  actionBtn: { flexDirection: "row", alignItems: "center", backgroundColor: colors.surfaceContainer, height: 44, paddingHorizontal: 12, borderRadius: 8, gap: 4 },
  actionBtnText: { fontSize: 12, fontWeight: "500", color: colors.onSurface },
  cardCommentBox: { backgroundColor: colors.surfaceContainer, padding: 12, borderRadius: 8, gap: 4 },
  commentHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  commentTitle: { fontSize: 11, fontWeight: "600", color: colors.onSurface, letterSpacing: 0.5 },
  commentDesc: { fontSize: 12, color: colors.onSurfaceVariant, paddingLeft: 24, lineHeight: 18 },
  cardDraftBox: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: colors.surfaceContainerLow, padding: 12, borderRadius: 8 },
  draftText: { fontSize: 12, color: colors.secondary, fontStyle: "italic", flex: 1 },
  draftBadge: { fontSize: 11, fontWeight: "600", color: colors.secondary, letterSpacing: 0.5 },
  cardFooterRight: { flexDirection: "row", justifyContent: "flex-end", alignItems: "center", paddingTop: 4, gap: 8 },
  actionBtnPrimary: { flexDirection: "row", alignItems: "center", backgroundColor: colors.primary, height: 44, paddingHorizontal: 16, borderRadius: 8, gap: 4 },
  actionBtnPrimaryText: { fontSize: 12, fontWeight: "500", color: colors.onPrimary },
});
