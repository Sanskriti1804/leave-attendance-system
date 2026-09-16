import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator, TextInput, Modal } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { ScreenGradient, ThemedDialog } from "../../components/ui/AppChrome";
import { TopNavBar, useTopNavContentInset, BottomNavBar } from "../../components/ui/AdminComponents";
import { getSession } from "../../../services/auth";
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
  error: "#ba1a1a",
  onSurface: "#1c1b1b",
  onSurfaceVariant: "#4c4546",
  glass: "rgb(222, 223, 227)",
  glassBorder: "rgba(0, 0, 0, 0.15)",
};

type QueueFilter = "pending" | "medical" | "approved" | "clarify";

const FALLBACK_EMPLOYEES: EmployeePublic[] = [
  { employeeId: 1, firstName: "Milind", lastName: "Rawat", email: "milind@enterprisehrms.internal", departmentId: 1, role: "employee", managerId: null, joiningDate: null, createdAt: "", status: "ACTIVE", obsolete: false },
  { employeeId: 2, firstName: "Elena", lastName: "D'Souza", email: "elena@enterprisehrms.internal", departmentId: 1, role: "employee", managerId: null, joiningDate: null, createdAt: "", status: "ACTIVE", obsolete: false },
  { employeeId: 3, firstName: "Rajesh", lastName: "Patel", email: "rajesh@enterprisehrms.internal", departmentId: 1, role: "employee", managerId: null, joiningDate: null, createdAt: "", status: "ACTIVE", obsolete: false },
];

const FALLBACK_TYPES: LeaveType[] = [
  { leaveTypeId: 1, name: "Medical / Sick Leave", description: null, requiresMedicalDocument: true, allowedSex: null, obsolete: false },
  { leaveTypeId: 2, name: "Casual Leave", description: null, requiresMedicalDocument: false, allowedSex: null, obsolete: false },
  { leaveTypeId: 3, name: "Clarification Thread", description: null, requiresMedicalDocument: false, allowedSex: null, obsolete: false },
];

const FALLBACK_LEAVES: LeaveApplication[] = [
  { leaveId: 1, employeeId: 1, leaveTypeId: 1, startDate: "2026-10-26", endDate: "2026-10-29", numberOfDays: 3, durationType: "FULL_DAY", halfDayType: null, status: "PENDING_HR_REVIEW", reason: "Post-operative surgical recovery following outpatient procedure. Doctor advised strict rest.", hrComments: null, createdAt: "2026-10-25T10:00:00Z", selectedDates: [] },
  { leaveId: 2, employeeId: 2, leaveTypeId: 2, startDate: "2026-11-02", endDate: "2026-11-02", numberOfDays: 0.5, durationType: "HALF_DAY", halfDayType: "SECOND_HALF", status: "PENDING_HR_REVIEW", reason: "Family administrative matter and appointment.", hrComments: null, createdAt: "2026-11-01T10:00:00Z", selectedDates: [] },
  { leaveId: 3, employeeId: 3, leaveTypeId: 3, startDate: "2026-11-05", endDate: "2026-11-05", numberOfDays: 1, durationType: "FULL_DAY", halfDayType: null, status: "REJECTED", reason: "Clarification required on previous leave", hrComments: "Please verify if shift coverage has been arranged with lead.", createdAt: "2026-11-04T10:00:00Z", selectedDates: [] },
];

function matchesQueue(leave: LeaveApplication, type: LeaveType | undefined, filter: QueueFilter): boolean {
  if (filter === "pending") {
    return leave.status === "SUBMITTED" || leave.status === "PENDING_HR_REVIEW";
  }
  if (filter === "approved") {
    return leave.status === "APPROVED";
  }
  if (filter === "medical") {
    return Boolean(type?.requiresMedicalDocument) && (leave.status === "SUBMITTED" || leave.status === "PENDING_HR_REVIEW");
  }
  return leave.status === "REJECTED" || Boolean(leave.hrComments);
}

export default function AdminLeaveReviewQueueScreen() {
  const topInset = useTopNavContentInset();
  const [me, setMe] = useState<EmployeePublic | null>(null);
  const [previewGuest, setPreviewGuest] = useState(false);
  const [filter, setFilter] = useState<QueueFilter>("pending");
  const [items, setItems] = useState<LeaveApplication[]>([]);
  const [types, setTypes] = useState<LeaveType[]>([]);
  const [employees, setEmployees] = useState<EmployeePublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [rejectTarget, setRejectTarget] = useState<number | null>(null);
  const [rejectComment, setRejectComment] = useState("");
  const [noteVisible, setNoteVisible] = useState(false);
  const [guestDialog, setGuestDialog] = useState(false);

  const actualGuest = me?.role === "guest_admin";
  const isGuest = actualGuest || previewGuest;
  const canAct = me?.role === "admin" && !previewGuest;

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
        listLeaves(),
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
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (me?.role === "guest_admin") {
      setPreviewGuest(true);
    }
  }, [me?.role]);

  const typeOf = (leaveTypeId: number) => types.find((row) => row.leaveTypeId === leaveTypeId);

  const employeeName = (employeeId: number) => {
    const row = employees.find((item) => item.employeeId === employeeId);
    return row ? displayName(row) : `EMP-${employeeId}`;
  };

  const queued = useMemo(
    () => items.filter((row) => matchesQueue(row, typeOf(row.leaveTypeId), filter)),
    [filter, items, types],
  );

  const count = (key: QueueFilter) => items.filter((row) => matchesQueue(row, typeOf(row.leaveTypeId), key)).length;

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

  async function onRejectConfirm() {
    if (rejectTarget == null) {
      return;
    }
    setBusyId(rejectTarget);
    setError(null);
    try {
      await rejectLeave(rejectTarget, rejectComment.trim() || "Rejected / clarify from review queue");
      setRejectTarget(null);
      setRejectComment("");
      await load();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  const chips: { key: QueueFilter; label: string }[] = [
    { key: "pending", label: "PENDING REVIEW" },
    { key: "medical", label: "MEDICAL ATTESTED" },
    { key: "approved", label: "APPROVED" },
    { key: "clarify", label: "CLARIFICATION" },
  ];

  return (
    <ScreenGradient>
      <SafeAreaView style={styles.safeArea}>
        <TopNavBar title="Leave Review Queue" />

        <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingTop: topInset }]}>
          <View style={styles.roleToggle}>
            <View style={styles.roleInfo}>
              <View style={[styles.roleDot, { backgroundColor: isGuest ? colors.error : colors.primary }]} />
              <View>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Text style={styles.roleName}>{isGuest ? "Guest Admin (View Only)" : "HR Admin (Full Authority)"}</Text>
                  {error ? <UIFallbackIndicator style={{ marginTop: 2 }} /> : null}
                </View>
                <Text style={styles.roleUser}>{error ? "Preeti Kaur" : displayName(me)}</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.toggleBtn}
              onPress={() => {
                if (actualGuest) {
                  setGuestDialog(true);
                  return;
                }
                setPreviewGuest((value) => !value);
              }}
            >
              <MaterialIcons name="swap-horiz" size={16} color={colors.onSurface} />
              <Text style={styles.toggleBtnText}>{isGuest ? "Switch to HR Admin" : "Switch to Guest"}</Text>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statusChips} contentContainerStyle={styles.statusChipsContent}>
            {chips.map((chip) => {
              const active = filter === chip.key;
              return (
                <TouchableOpacity key={chip.key} style={active ? styles.chipActive : styles.chipInactive} onPress={() => setFilter(chip.key)}>
                  <Text style={active ? styles.chipActiveText : styles.chipInactiveText}>{chip.label}</Text>
                  <View style={active ? styles.chipBadgeActive : styles.chipBadgeInactive}>
                    <Text style={active ? styles.chipBadgeTextActive : styles.chipBadgeTextInactive}>{count(chip.key)}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {loading ? <ActivityIndicator color={colors.primary} /> : null}
          {error ? <Text style={styles.empRole}>{error}</Text> : null}
          {!loading && queued.length === 0 ? <Text style={styles.empRole}>No applications in this queue.</Text> : null}

          {queued.map((leave) => {
            const type = typeOf(leave.leaveTypeId);
            const medical = Boolean(type?.requiresMedicalDocument);
            const clarify = leave.status === "REJECTED" || Boolean(leave.hrComments);
            return (
              <View key={leave.leaveId} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.empInfo}>
                    <View style={styles.avatarPlaceholder}>
                      <MaterialIcons name="person" size={22} color={colors.secondary} />
                    </View>
                    <View>
                      <View style={styles.nameRow}>
                        <Text style={styles.empName}>{employeeName(leave.employeeId)}</Text>
                        <View style={styles.empIdBadge}>
                          <Text style={styles.empIdText}>EMP-{leave.employeeId}</Text>
                        </View>
                      </View>
                      <Text style={styles.empRole}>{employees.find((row) => row.employeeId === leave.employeeId)?.email ?? leave.status.replaceAll("_", " ")}</Text>
                    </View>
                  </View>
                  {clarify ? (
                    <View style={styles.clarifyBadge}>
                      <MaterialIcons name="sync-problem" size={14} color={colors.onSurface} />
                      <Text style={styles.clarifyBadgeText}>CLARIFY</Text>
                    </View>
                  ) : null}
                </View>

                <View style={styles.detailsMatrix}>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>LEAVE CLASSIFICATION</Text>
                    <Text style={styles.detailValue}>{type?.name ?? `Type ${leave.leaveTypeId}`}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>STATUTORY DURATION</Text>
                    <Text style={styles.detailValue}>
                      {leave.numberOfDays} Day{leave.numberOfDays === 1 ? "" : "s"} · {leave.startDate}–{leave.endDate}
                    </Text>
                  </View>
                  <View style={styles.detailFullRow}>
                    <Text style={styles.detailLabel}>ATTESTED JUSTIFICATION</Text>
                    <Text style={styles.detailDesc}>{leave.reason}</Text>
                  </View>
                  <View style={styles.detailFullRowFlex}>
                    <MaterialIcons name="verified" size={14} color={colors.secondary} />
                    <Text style={styles.detailNote}>Direct Manager notified / Self-attested</Text>
                  </View>
                </View>

                {medical ? (
                  <View style={styles.attachmentBox}>
                    <View style={styles.attachmentHeader}>
                      <View style={styles.attachmentTitleRow}>
                        <MaterialIcons name="healing" size={18} color={colors.primary} />
                        <Text style={styles.attachmentTitle}>MEDICAL PROOF</Text>
                      </View>
                      <View style={styles.reqBadge}>
                        <Text style={styles.reqBadgeText}>REQUIRED &gt;2 DAYS</Text>
                      </View>
                    </View>
                    <View style={styles.fileCard}>
                      <View style={styles.fileInfo}>
                        <View style={styles.fileIconBox}>
                          <MaterialIcons name="picture-as-pdf" size={20} color={colors.onSurface} />
                        </View>
                        <View>
                          <Text style={styles.fileName}>Medical certificate on file</Text>
                          <Text style={styles.fileSize}>Employee download blocked (MED-09)</Text>
                        </View>
                      </View>
                      {canAct ? (
                        <View style={styles.downloadBtn}>
                          <MaterialIcons name="download" size={16} color={colors.onPrimary} />
                          <Text style={styles.downloadBtnText}>HR ONLY</Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                ) : null}

                {leave.hrComments ? (
                  <View style={styles.threadBox}>
                    <Text style={styles.detailLabel}>CLARIFICATION THREAD</Text>
                    <View style={styles.threadBubble}>
                      <Text style={styles.threadAuthor}>HR OPERATIONS</Text>
                      <Text style={styles.threadBody}>“{leave.hrComments}”</Text>
                    </View>
                  </View>
                ) : null}

                {canAct && (leave.status === "PENDING_HR_REVIEW" || leave.status === "SUBMITTED") ? (
                  <View style={styles.actionsBox}>
                    <View style={styles.actionRow}>
                      <TouchableOpacity style={styles.approveBtn} onPress={() => void onApprove(leave.leaveId)} disabled={busyId === leave.leaveId}>
                        <MaterialIcons name="done-all" size={18} color={colors.onPrimary} />
                        <Text style={styles.approveBtnText}>{busyId === leave.leaveId ? "..." : "Approve Leave"}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.rejectBtn} onPress={() => setRejectTarget(leave.leaveId)} disabled={busyId === leave.leaveId}>
                        <MaterialIcons name="chat-bubble-outline" size={18} color={colors.onSurface} />
                        <Text style={styles.rejectBtnText}>Reject / Clarify</Text>
                      </TouchableOpacity>
                    </View>
                    <TouchableOpacity style={styles.noteBtn} onPress={() => setNoteVisible(true)}>
                      <MaterialIcons name="note-add" size={16} color={colors.secondary} />
                      <Text style={styles.noteBtnText}>Add Internal HR Note (Private)</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.guestNotice}>
                    <View style={styles.guestNoticeLeft}>
                      <MaterialIcons name="visibility" size={18} color={colors.secondary} />
                      <View>
                        <Text style={styles.guestNoticeTitle}>{isGuest ? "GUEST VIEW ACCESS" : leave.status.replaceAll("_", " ")}</Text>
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
            );
          })}
        </ScrollView>
        <BottomNavBar activeRoute="leave" />

        <Modal visible={rejectTarget != null} transparent animationType="fade" onRequestClose={() => setRejectTarget(null)}>
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <Text style={styles.empName}>Reject / Clarify</Text>
              <TextInput
                style={styles.reasonInput}
                multiline
                value={rejectComment}
                onChangeText={setRejectComment}
                placeholder="HR clarification comment"
                placeholderTextColor={colors.secondary}
              />
              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.rejectBtn} onPress={() => setRejectTarget(null)}>
                  <Text style={styles.rejectBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.approveBtn} onPress={() => void onRejectConfirm()}>
                  <Text style={styles.approveBtnText}>Send</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
        <Modal visible={noteVisible} transparent animationType="fade" onRequestClose={() => setNoteVisible(false)}>
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <Text style={styles.empName}>Internal HR note</Text>
              <Text style={styles.empRole}>Private notes are not stored yet (audit API pending). This control matches the Stitch layout only.</Text>
              <TouchableOpacity style={styles.approveBtn} onPress={() => setNoteVisible(false)}>
                <Text style={styles.approveBtnText}>Got it</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
        <ThemedDialog
          visible={guestDialog}
          title="Guest admin"
          message="Write actions stay disabled. Preview only."
          onRequestClose={() => setGuestDialog(false)}
          actions={[{ label: "OK", onPress: () => setGuestDialog(false), primary: true }]}
        />
      </SafeAreaView>
    </ScreenGradient>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "transparent" },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: { fontSize: 20, fontWeight: "700", color: colors.primary, letterSpacing: -0.2 },
  profileAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 100, gap: 16 },
  roleToggle: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 8,
    backgroundColor: colors.glass,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  roleInfo: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1 },
  roleDot: { width: 8, height: 8, borderRadius: 4 },
  roleName: { fontSize: 12, fontWeight: "500", color: colors.onSurface },
  roleUser: { fontSize: 12, color: colors.secondary },
  toggleBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceContainerHighest,
    paddingHorizontal: 12,
    height: 44,
    borderRadius: 4,
    gap: 4,
  },
  toggleBtnText: { fontSize: 11, fontWeight: "600", color: colors.onSurface },
  statusChips: { marginHorizontal: -16 },
  statusChipsContent: { paddingHorizontal: 16, gap: 8 },
  chipActive: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
    gap: 4,
  },
  chipActiveText: { fontSize: 11, fontWeight: "600", color: colors.onPrimary },
  chipBadgeActive: { backgroundColor: "rgba(252,249,248,0.2)", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  chipBadgeTextActive: { fontSize: 11, color: colors.onPrimary },
  chipInactive: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceContainer,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
    gap: 4,
  },
  chipInactiveText: { fontSize: 11, fontWeight: "600", color: colors.secondary },
  chipBadgeInactive: { backgroundColor: colors.surfaceContainerHigh, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  chipBadgeTextInactive: { fontSize: 11, color: colors.onSurface },
  card: {
    backgroundColor: colors.glass,
    borderRadius: 16,
    padding: 16,
    gap: 16,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.1,
    shadowRadius: 25,
    elevation: 5,
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  empInfo: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  avatarPlaceholder: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.surfaceContainerHigh, alignItems: "center", justifyContent: "center" },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 4, flexWrap: "wrap" },
  empName: { fontSize: 16, fontWeight: "500", color: colors.onSurface },
  empIdBadge: { backgroundColor: colors.surfaceContainer, paddingHorizontal: 4, paddingVertical: 2, borderRadius: 4 },
  empIdText: { fontSize: 11, fontWeight: "600", color: colors.secondary },
  empRole: { fontSize: 12, color: colors.secondary },
  clarifyBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: colors.surfaceContainerHigh, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  clarifyBadgeText: { fontSize: 11, fontWeight: "600", color: colors.onSurface },
  detailsMatrix: { flexDirection: "row", flexWrap: "wrap", padding: 12, backgroundColor: colors.glass, borderRadius: 8, gap: 8, borderWidth: 1, borderColor: colors.glassBorder },
  detailItem: { width: "48%" },
  detailFullRow: { width: "100%", marginTop: 8 },
  detailFullRowFlex: { width: "100%", flexDirection: "row", alignItems: "center", gap: 4, marginTop: 8 },
  detailLabel: { fontSize: 11, fontWeight: "600", color: colors.secondary, marginBottom: 2 },
  detailValue: { fontSize: 12, fontWeight: "500", color: colors.onSurface },
  detailDesc: { fontSize: 12, color: colors.onSurface, lineHeight: 16 },
  detailNote: { fontSize: 12, color: colors.secondary },
  attachmentBox: { padding: 12, backgroundColor: colors.glass, borderRadius: 8, gap: 12, borderWidth: 1, borderColor: colors.glassBorder },
  attachmentHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  attachmentTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  attachmentTitle: { fontSize: 11, fontWeight: "600", color: colors.onSurface, letterSpacing: 0.5 },
  reqBadge: { backgroundColor: colors.surfaceContainerHigh, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  reqBadgeText: { fontSize: 11, fontWeight: "600", color: colors.secondary },
  fileCard: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: colors.surfaceContainerLowest, padding: 8, borderRadius: 16, borderWidth: 1, borderColor: colors.glassBorder },
  fileInfo: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1 },
  fileIconBox: { width: 36, height: 36, borderRadius: 4, backgroundColor: colors.surfaceContainerHigh, alignItems: "center", justifyContent: "center" },
  fileName: { fontSize: 12, fontWeight: "500", color: colors.onSurface },
  fileSize: { fontSize: 12, color: colors.secondary },
  downloadBtn: { flexDirection: "row", alignItems: "center", backgroundColor: colors.primary, paddingHorizontal: 12, height: 44, borderRadius: 4, gap: 4 },
  downloadBtnText: { fontSize: 11, fontWeight: "600", color: colors.onPrimary },
  threadBox: { gap: 8 },
  threadBubble: { padding: 8, backgroundColor: colors.glass, borderRadius: 8, borderWidth: 1, borderColor: colors.glassBorder, gap: 4 },
  threadAuthor: { fontSize: 11, fontWeight: "600", color: colors.onSurface },
  threadBody: { fontSize: 12, fontStyle: "italic", color: colors.onSurface },
  actionsBox: { gap: 8, marginTop: 8 },
  actionRow: { flexDirection: "row", gap: 8 },
  approveBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: colors.primary, height: 44, borderRadius: 4, gap: 4 },
  approveBtnText: { fontSize: 14, fontWeight: "500", color: colors.onPrimary },
  rejectBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: colors.surfaceContainerHighest, height: 44, borderRadius: 4, gap: 4 },
  rejectBtnText: { fontSize: 14, fontWeight: "500", color: colors.onSurface },
  noteBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", height: 44, gap: 4 },
  noteBtnText: { fontSize: 12, fontWeight: "500", color: colors.secondary },
  guestNotice: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 12, backgroundColor: colors.surfaceContainerLow, borderRadius: 8 },
  guestNoticeLeft: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1 },
  guestNoticeTitle: { fontSize: 11, fontWeight: "600", color: colors.secondary },
  guestNoticeSub: { fontSize: 12, color: colors.secondary },
  readOnlyBadge: { backgroundColor: colors.surfaceContainerHighest, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  readOnlyText: { fontSize: 11, fontWeight: "600", color: colors.secondary },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(49,48,48,0.6)", justifyContent: "center", padding: 16 },
  modalCard: { backgroundColor: colors.glass, borderRadius: 16, padding: 16, gap: 12, borderWidth: 1, borderColor: colors.glassBorder },
  reasonInput: { backgroundColor: colors.surfaceContainerLow, color: colors.onSurface, fontSize: 14, borderRadius: 8, padding: 12, minHeight: 80, textAlignVertical: "top" },
});
