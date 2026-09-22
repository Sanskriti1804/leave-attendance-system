import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Alert, Modal, Pressable } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { getSession } from "../../services/auth";
import {
  apiErrorMessage,
  approveLeave,
  displayName,
  getMe,
  downloadLeaveDocument,
  listEmployees,
  listLeaveTypes,
  listLeaves,
  managerApproveLeave,
  managerRejectLeave,
  rejectLeave,
  type EmployeePublic,
  type LeaveApplication,
  type LeaveType,
} from "../../services/resources";
import { colors } from "../theme";
import { WebCard, WebShell } from "./WebShell";

type QueueFilter = "pending" | "medical" | "approved" | "clarify";

const FILTERS: { key: QueueFilter; label: string }[] = [
  { key: "pending", label: "Pending" },
  { key: "medical", label: "Medical" },
  { key: "approved", label: "Approved" },
  { key: "clarify", label: "Clarify" },
];

function matchesQueue(leave: LeaveApplication, type: LeaveType | undefined, filter: QueueFilter): boolean {
  if (filter === "pending") return leave.status === "SUBMITTED" || leave.status === "PENDING_HR_REVIEW";
  if (filter === "approved") return leave.status === "APPROVED";
  if (filter === "medical") return Boolean(type?.requiresMedicalDocument) && (leave.status === "SUBMITTED" || leave.status === "PENDING_HR_REVIEW");
  return leave.status === "REJECTED" || Boolean(leave.hrComments);
}

export default function WebAdminReviewScreen() {
  const [me, setMe] = useState<EmployeePublic | null>(null);
  const [filter, setFilter] = useState<QueueFilter>("pending");
  const [items, setItems] = useState<LeaveApplication[]>([]);
  const [types, setTypes] = useState<LeaveType[]>([]);
  const [employees, setEmployees] = useState<EmployeePublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [noteTarget, setNoteTarget] = useState<number | null>(null);
  const [hrNote, setHrNote] = useState("");

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
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const typeOf = (id: number) => types.find((row) => row.leaveTypeId === id);
  const employeeName = (id: number) => {
    const row = employees.find((item) => item.employeeId === id);
    return row ? displayName(row) : `EMP-${id}`;
  };
  const queued = useMemo(() => items.filter((row) => matchesQueue(row, typeOf(row.leaveTypeId), filter)), [filter, items, types]);

  return (
    <WebShell title="Leave Review Queue" variant="admin" activeRoute="leave">
      <Text style={styles.role}>{canAct ? "HR Admin (Full Authority)" : "Guest Admin (View Only)"}</Text>
      <View style={styles.filters}>
        {FILTERS.map((item) => (
          <TouchableOpacity key={item.key} style={filter === item.key ? styles.chipOn : styles.chip} onPress={() => setFilter(item.key)}>
            <Text style={filter === item.key ? styles.chipOnText : styles.chipText}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {loading ? <ActivityIndicator color={colors.primary} /> : null}
      {error ? <Text style={styles.err}>{error}</Text> : null}
      <WebCard style={styles.tableCard}>
        <View style={styles.head}>
          <Text style={[styles.th, styles.colPerson]}>Employee</Text>
          <Text style={[styles.th, styles.colDates]}>Dates</Text>
          <Text style={[styles.th, styles.colStatus]}>Status</Text>
          <Text style={[styles.th, styles.colReason]}>Reason</Text>
          <Text style={[styles.th, styles.colActions]}>Actions</Text>
        </View>
        {queued.map((leave) => (
          <View key={leave.leaveId} style={styles.row}>
            <View style={styles.colPerson}>
              <Text style={styles.name}>{employeeName(leave.employeeId)}</Text>
              <Text style={styles.meta}>{typeOf(leave.leaveTypeId)?.name ?? `Type ${leave.leaveTypeId}`}</Text>
            </View>
            <Text style={[styles.meta, styles.colDates]}>
              {leave.startDate} – {leave.endDate}
              {"\n"}
              {leave.numberOfDays}d
            </Text>
            <Text style={[styles.meta, styles.colStatus]}>{leave.status.replaceAll("_", " ")}</Text>
            <View style={styles.colReason}>
              <Text style={styles.meta} numberOfLines={2}>
                {leave.reason}
              </Text>
              {leave.hrComments ? (
                <Text style={styles.note} numberOfLines={1}>
                  HR Note: {leave.hrComments.length > 72 ? `${leave.hrComments.slice(0, 72).trimEnd()}...` : leave.hrComments}
                </Text>
              ) : null}
            </View>
            <View style={styles.colActions}>
              {canAct && leave.status === "PENDING_HR_REVIEW" ? (
                <View style={styles.actions}>
                  <TouchableOpacity
                    style={styles.btnApprove}
                    disabled={busyId === leave.leaveId}
                    onPress={async () => {
                      setBusyId(leave.leaveId);
                      try {
                        await approveLeave(leave.leaveId, notes[leave.leaveId]);
                        await load();
                      } catch (err) {
                        setError(apiErrorMessage(err));
                      } finally {
                        setBusyId(null);
                      }
                    }}
                  >
                    <Text style={styles.btnApproveText}>Approve</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.btnReject}
                    onPress={async () => {
                      setBusyId(leave.leaveId);
                      try {
                        await rejectLeave(leave.leaveId, notes[leave.leaveId]);
                        await load();
                      } catch (err) {
                        Alert.alert("Could not reject", apiErrorMessage(err));
                      } finally {
                        setBusyId(null);
                      }
                    }}
                  >
                    <Text style={styles.btnRejectText}>Reject</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.btnGhost} onPress={() => setNoteTarget(leave.leaveId)}>
                    <Text style={styles.btnGhostText}>Add HR Note</Text>
                  </TouchableOpacity>
                  {leave.documents?.[0] ? (
                    <TouchableOpacity
                      style={styles.btnGhost}
                      onPress={() => {
                        const doc = leave.documents![0]!;
                        void downloadLeaveDocument(doc.documentId, doc.fileName).catch((err) => {
                          setError(apiErrorMessage(err));
                        });
                      }}
                    >
                      <Text style={styles.btnGhostText}>Medical file</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              ) : canAct && leave.status === "SUBMITTED" && leave.reportingManagerEmployeeId === me?.employeeId ? (
                <View style={styles.actions}>
                  <TouchableOpacity
                    style={styles.btnApprove}
                    disabled={busyId === leave.leaveId}
                    onPress={async () => {
                      setBusyId(leave.leaveId);
                      try {
                        await managerApproveLeave(leave.leaveId, notes[leave.leaveId]);
                        await load();
                      } catch (err) {
                        setError(apiErrorMessage(err));
                      } finally {
                        setBusyId(null);
                      }
                    }}
                  >
                    <Text style={styles.btnApproveText}>Manager approve</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.btnReject}
                    onPress={async () => {
                      setBusyId(leave.leaveId);
                      try {
                        await managerRejectLeave(leave.leaveId, notes[leave.leaveId]);
                        await load();
                      } catch (err) {
                        Alert.alert("Could not reject", apiErrorMessage(err));
                      } finally {
                        setBusyId(null);
                      }
                    }}
                  >
                    <Text style={styles.btnRejectText}>Reject</Text>
                  </TouchableOpacity>
                </View>
              ) : canAct && leave.status === "SUBMITTED" ? (
                <Text style={styles.meta}>Awaiting manager</Text>
              ) : (
                <Text style={styles.meta}>—</Text>
              )}
            </View>
          </View>
        ))}
      </WebCard>
      <Modal visible={noteTarget != null} transparent animationType="fade" onRequestClose={() => setNoteTarget(null)}>
        <Pressable style={styles.backdrop} onPress={() => setNoteTarget(null)}>
          <Pressable style={styles.dialog} onPress={(event) => event.stopPropagation()}>
            <View style={styles.dialogHead}>
              <Text style={styles.name}>Add HR Note for leave #{noteTarget}</Text>
              <TouchableOpacity onPress={() => setNoteTarget(null)}>
                <MaterialIcons name="close" size={18} color={colors.secondary} />
              </TouchableOpacity>
            </View>
            <TextInput style={styles.input} value={hrNote} onChangeText={setHrNote} placeholder="Saved only if you choose Add HR Note" placeholderTextColor={colors.secondary} />
            <View style={styles.dialogActions}>
              <TouchableOpacity style={styles.btnGhost} onPress={() => setNoteTarget(null)}>
                <Text style={styles.btnGhostText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.btnApprove}
                onPress={() => {
                  if (noteTarget == null) return;
                  setNotes((current) => ({ ...current, [noteTarget]: hrNote.trim() }));
                  setNoteTarget(null);
                  setHrNote("");
                }}
              >
                <Text style={styles.btnApproveText}>Save note</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </WebShell>
  );
}

const styles = StyleSheet.create({
  role: { fontSize: 13, fontWeight: "600", color: colors.onSurface },
  filters: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: colors.surfaceContainer },
  chipOn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: colors.accent },
  chipText: { fontSize: 12, fontWeight: "600", color: colors.onSurface, textTransform: "uppercase" },
  chipOnText: { fontSize: 12, fontWeight: "600", color: colors.onPrimary, textTransform: "uppercase" },
  tableCard: { width: "100%", padding: 8, overflow: "hidden" },
  head: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceContainerHighest,
    gap: 12,
  },
  th: { fontSize: 11, fontWeight: "700", color: colors.secondary, textTransform: "uppercase", letterSpacing: 0.6 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceContainerHighest,
    gap: 12,
  },
  colPerson: { flex: 1.3, minWidth: 140 },
  colDates: { flex: 1.2, minWidth: 130 },
  colStatus: { flex: 0.9, minWidth: 110 },
  colReason: { flex: 1.6, minWidth: 160, gap: 4 },
  colActions: { flex: 1.6, minWidth: 220 },
  name: { fontSize: 14, fontWeight: "700", color: colors.onSurface },
  meta: { fontSize: 12, color: colors.secondary },
  note: { fontSize: 11, color: colors.accentDeep },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  btnApprove: { backgroundColor: colors.accent, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  btnApproveText: { color: colors.onPrimary, fontSize: 12, fontWeight: "700" },
  btnReject: { backgroundColor: colors.surfaceContainer, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: colors.error },
  btnRejectText: { color: colors.error, fontSize: 12, fontWeight: "700" },
  btnGhost: { borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceContainerLowest },
  btnGhostText: { color: colors.onSurface, fontSize: 12, fontWeight: "700" },
  err: { color: colors.error, fontSize: 13 },
  backdrop: { flex: 1, backgroundColor: "rgba(16,16,16,0.45)", justifyContent: "center", alignItems: "center", padding: 24 },
  dialog: {
    width: "100%",
    maxWidth: 440,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 10,
    padding: 20,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderLeftWidth: 4,
    borderLeftColor: colors.accent,
  },
  dialogHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12 },
  dialogActions: { flexDirection: "row", justifyContent: "flex-end", gap: 8 },
  input: { minHeight: 44, borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 10, color: colors.onSurface, backgroundColor: colors.surfaceContainerLow },
});
