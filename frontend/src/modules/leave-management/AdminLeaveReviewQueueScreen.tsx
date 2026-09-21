import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator, TextInput, Modal } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { ScreenGradient } from "../../components/ui/AppChrome";
import { BottomNavBar, TopNavBar, useTopNavContentInset } from "../../components/ui/AdminComponents";
import { UserAvatar } from "../../components/ui/UserAvatar";
import { getSession } from "../../../services/auth";
import {
  apiErrorMessage,
  approveLeave,
  displayName,
  downloadLeaveDocument,
  getMe,
  listEmployees,
  listLeaveTypes,
  listLeaves,
  rejectLeave,
  type EmployeePublic,
  type LeaveApplication,
  type LeaveType,
} from "../../../services/resources";
import { colors } from "../../theme";

type QueueFilter = "pending" | "medical" | "approved" | "clarify";

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
  const [filter, setFilter] = useState<QueueFilter>("pending");
  const [items, setItems] = useState<LeaveApplication[]>([]);
  const [types, setTypes] = useState<LeaveType[]>([]);
  const [employees, setEmployees] = useState<EmployeePublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [hrNote, setHrNote] = useState("");
  const [noteLeaveId, setNoteLeaveId] = useState<number | null>(null);
  const [notes, setNotes] = useState<Record<number, string>>({});

  const isGuest = me?.role === "guest_admin";
  const canAct = me?.role === "admin";

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
      setItems([]);
      setTypes([]);
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

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
      await approveLeave(leaveId, notes[leaveId]);
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
      await rejectLeave(leaveId, notes[leaveId]);
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
                <Text style={styles.roleName}>{isGuest ? "Guest Admin (View Only)" : "HR Admin (Full Authority)"}</Text>
                <Text style={styles.roleUser}>{error ? "—" : displayName(me)}</Text>
              </View>
            </View>
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
                    <UserAvatar
                      employee={employees.find((row) => row.employeeId === leave.employeeId) ?? { employeeId: leave.employeeId, firstName: employeeName(leave.employeeId), lastName: null }}
                      size={48}
                    />
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
                  {leave.statusHistory && leave.statusHistory.length > 0 ? (
                    <View style={styles.detailFullRow}>
                      <Text style={styles.detailLabel}>STATUS HISTORY</Text>
                      <Text style={styles.detailDesc}>
                        {leave.statusHistory.map((row) => row.newStatus.replaceAll("_", " ")).join(" → ")}
                      </Text>
                    </View>
                  ) : null}
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
                        <TouchableOpacity
                          style={styles.downloadBtn}
                          onPress={() => {
                            const doc = leave.documents?.[0];
                            if (!doc) {
                              setError("No medical file is attached to this application.");
                              return;
                            }
                            void downloadLeaveDocument(doc.documentId, doc.fileName).catch((err) => {
                              setError(apiErrorMessage(err));
                            });
                          }}
                        >
                          <MaterialIcons name="download" size={16} color={colors.onPrimary} />
                          <Text style={styles.downloadBtnText}>Download</Text>
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  </View>
                ) : null}

                {leave.hrComments ? (
                  <View style={styles.threadBox}>
                    <Text style={styles.detailLabel}>HR NOTE</Text>
                    <View style={styles.threadBubble}>
                      <Text style={styles.threadAuthor}>HR OPERATIONS</Text>
                      <Text style={styles.threadBody}>“{leave.hrComments}”</Text>
                    </View>
                  </View>
                ) : null}

                {canAct && leave.status === "PENDING_HR_REVIEW" ? (
                  <View style={styles.actionsBox}>
                    <View style={styles.actionRow}>
                      <TouchableOpacity style={styles.approveBtn} onPress={() => void onApprove(leave.leaveId)} disabled={busyId === leave.leaveId}>
                        <MaterialIcons name="done-all" size={18} color={colors.onPrimary} />
                        <Text style={styles.approveBtnText}>{busyId === leave.leaveId ? "..." : "Approve Leave"}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.rejectBtn} onPress={() => void onReject(leave.leaveId)} disabled={busyId === leave.leaveId}>
                        <MaterialIcons name="close" size={18} color={colors.onSurface} />
                        <Text style={styles.rejectBtnText}>Reject</Text>
                      </TouchableOpacity>
                    </View>
                    <TouchableOpacity style={styles.noteBtn} onPress={() => { setNoteLeaveId(leave.leaveId); setHrNote(notes[leave.leaveId] ?? ""); }}>
                      <MaterialIcons name="note-add" size={16} color={colors.secondary} />
                      <Text style={styles.noteBtnText}>Add HR Note</Text>
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

        <Modal visible={noteLeaveId != null} transparent animationType="fade" onRequestClose={() => setNoteLeaveId(null)}>
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <Text style={styles.empName}>Add HR Note</Text>
              <TextInput
                style={styles.reasonInput}
                multiline
                value={hrNote}
                onChangeText={setHrNote}
                placeholder="Note is sent only if you save it here, then approve or reject."
                placeholderTextColor={colors.secondary}
              />
              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.rejectBtn} onPress={() => setNoteLeaveId(null)}>
                  <Text style={styles.rejectBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.approveBtn}
                  onPress={() => {
                    if (noteLeaveId != null) {
                      setNotes((current) => ({ ...current, [noteLeaveId]: hrNote.trim() }));
                    }
                    setNoteLeaveId(null);
                  }}
                >
                  <Text style={styles.approveBtnText}>Save note</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
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
    backgroundColor: colors.surfaceContainerLowest,
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
    backgroundColor: colors.accent,
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
    backgroundColor: colors.surfaceContainerLowest,
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
  detailsMatrix: { flexDirection: "row", flexWrap: "wrap", padding: 12, backgroundColor: colors.surfaceContainerLowest, borderRadius: 8, gap: 8, borderWidth: 1, borderColor: colors.glassBorder },
  detailItem: { width: "48%" },
  detailFullRow: { width: "100%", marginTop: 8 },
  detailFullRowFlex: { width: "100%", flexDirection: "row", alignItems: "center", gap: 4, marginTop: 8 },
  detailLabel: { fontSize: 11, fontWeight: "600", color: colors.secondary, marginBottom: 2 },
  detailValue: { fontSize: 12, fontWeight: "500", color: colors.onSurface },
  detailDesc: { fontSize: 12, color: colors.onSurface, lineHeight: 16 },
  detailNote: { fontSize: 12, color: colors.secondary },
  attachmentBox: { padding: 12, backgroundColor: colors.surfaceContainerLowest, borderRadius: 8, gap: 12, borderWidth: 1, borderColor: colors.glassBorder },
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
  threadBubble: { padding: 8, backgroundColor: colors.surfaceContainerLowest, borderRadius: 8, borderWidth: 1, borderColor: colors.glassBorder, gap: 4 },
  threadAuthor: { fontSize: 11, fontWeight: "600", color: colors.onSurface },
  threadBody: { fontSize: 12, fontStyle: "italic", color: colors.onSurface },
  actionsBox: { gap: 8, marginTop: 8 },
  actionRow: { flexDirection: "row", gap: 8 },
  approveBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: colors.accent, height: 44, borderRadius: 4, gap: 4 },
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
  modalCard: { backgroundColor: colors.surfaceContainerLowest, borderRadius: 16, padding: 16, gap: 12, borderWidth: 1, borderColor: colors.glassBorder },
  reasonInput: { backgroundColor: colors.surfaceContainerLow, color: colors.onSurface, fontSize: 14, borderRadius: 8, padding: 12, minHeight: 80, textAlignVertical: "top" },
});
