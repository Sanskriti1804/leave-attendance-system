import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, TextInput, Modal, Pressable } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { getSession } from "../../services/auth";
import {
  apiErrorMessage,
  cancelLeave,
  displayName,
  getMe,
  listLeaveTypes,
  listLeaves,
  managerApproveLeave,
  managerRejectLeave,
  submitLeaveDraft,
  withdrawLeave,
  type EmployeePublic,
  type LeaveApplication,
  type LeaveType,
} from "../../services/resources";
import { colors } from "../theme";
import { WebCard, WebShell } from "./WebShell";
import { ThemedDialog } from "../components/ui/AppChrome";

function matchesFilter(status: string, filter: string): boolean {
  if (filter === "all") return true;
  if (filter === "pending") return status === "DRAFT" || status === "SUBMITTED" || status === "PENDING_HR_REVIEW";
  if (filter === "approved") return status === "APPROVED";
  return status === "REJECTED" || status === "CANCELLED" || status === "WITHDRAWN";
}

export default function WebLeaveListScreen() {
  const router = useRouter();
  const applyHref = (process.env.EXPO_PUBLIC_APPLY_LEAVE as string | undefined) || "/leave/apply";
  const [activeFilter, setActiveFilter] = useState("all");
  const [me, setMe] = useState<EmployeePublic | null>(null);
  const [types, setTypes] = useState<LeaveType[]>([]);
  const [items, setItems] = useState<LeaveApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [noteText, setNoteText] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [noteTarget, setNoteTarget] = useState<number | null>(null);
  const [approverNote, setApproverNote] = useState("");

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
    if (typeof window === "undefined") return;
    const onFocus = () => void load();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [load]);

  const typeName = (leaveTypeId: number) => types.find((row) => row.leaveTypeId === leaveTypeId)?.name ?? `Type ${leaveTypeId}`;
  const filtered = useMemo(() => items.filter((row) => matchesFilter(row.status, activeFilter)), [activeFilter, items]);
  const reviewItems = filtered.filter(
    (row) => row.reportingManagerEmployeeId === me?.employeeId && row.employeeId !== me?.employeeId,
  );
  const myItems = filtered.filter((row) => row.employeeId === me?.employeeId);
  const isApprover = items.some(
    (row) => row.reportingManagerEmployeeId === me?.employeeId && row.employeeId !== me?.employeeId,
  );
  const count = (filter: string) => items.filter((row) => matchesFilter(row.status, filter)).length;

  const filters = [
    { key: "all", label: "All" },
    { key: "pending", label: "Pending" },
    { key: "approved", label: "Approved" },
    { key: "history", label: "Past / History" },
  ] as const;

  return (
    <WebShell title="Leave List" variant="employee" activeRoute="leave">
      <View style={styles.top}>
        <View>
          <Text style={styles.kicker}>LEAVE RECORDS</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Text style={styles.name}>{displayName(me)}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.apply} onPress={() => router.push(applyHref as never)}>
          <MaterialIcons name="add" size={18} color={colors.onPrimary} />
          <Text style={styles.applyText}>Apply Leave</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.filters}>
        {filters.map((chip) => {
          const active = activeFilter === chip.key;
          return (
            <TouchableOpacity key={chip.key} style={active ? styles.chipOn : styles.chip} onPress={() => setActiveFilter(chip.key)}>
              <Text style={active ? styles.chipOnText : styles.chipText}>
                {chip.label} ({count(chip.key)})
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {loading ? <ActivityIndicator color={colors.primary} /> : null}
      {error ? <Text style={styles.meta}>{error}</Text> : null}
      <View style={isApprover ? styles.cards : undefined}>
      {(isApprover
        ? [
            { key: "employees", title: "Employee Leave Requests", hint: "", rows: reviewItems },
            { key: "mine", title: "My Leave Requests", hint: `Approver: ${me?.managerName?.trim() || "Not assigned"}`, rows: myItems },
          ]
        : [{ key: "all", title: "", hint: "", rows: filtered }]
      ).map((section) => (
      <WebCard key={section.key}>
        {section.title ? <Text style={styles.section}>{section.title}</Text> : null}
        {section.hint ? <Text style={styles.approverLine}>{section.hint}</Text> : null}
        <View style={styles.tableHead}>
          <Text style={[styles.th, { flex: 1.4 }]}>Type</Text>
          <Text style={[styles.th, { flex: 1.6 }]}>Dates</Text>
          <Text style={[styles.th, { flex: 0.8 }]}>Days</Text>
          <Text style={[styles.th, { flex: 1.2 }]}>Status</Text>
          <Text style={[styles.th, { flex: 2 }]}>Reason</Text>
        </View>
        {section.rows.map((leave) => {
          const canDecide =
            leave.status === "SUBMITTED" &&
            leave.managerApprovalStatus === "PENDING" &&
            leave.reportingManagerEmployeeId === me?.employeeId &&
            leave.employeeId !== me?.employeeId;
          return (
          <View key={leave.leaveId} style={styles.entry}>
          <View style={styles.tr}>
            <Text style={[styles.td, { flex: 1.4 }]}>{typeName(leave.leaveTypeId)}</Text>
            <Text style={[styles.td, { flex: 1.6 }]}>
              {leave.startDate} - {leave.endDate}
            </Text>
            <Text style={[styles.td, { flex: 0.8 }]}>{leave.numberOfDays}</Text>
            <Text style={[styles.td, { flex: 1.2 }]}>{leave.status.replaceAll("_", " ")}</Text>
            <View style={{ flex: 2, gap: 4 }}>
              <Text style={styles.td} numberOfLines={2}>{leave.reason}</Text>
              {leave.managerComments ? <Text style={styles.meta}>Approver note: {leave.managerComments}</Text> : null}
              {leave.hrComments ? (
                <TouchableOpacity onPress={() => setNoteText(leave.hrComments)}>
                  <Text style={styles.link}>View HR note</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
            <View style={styles.actionLine}>
              {canDecide ? (
                <View style={styles.actionsBox}>
                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      style={styles.approveBtn}
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
                      <MaterialIcons name="done-all" size={18} color={colors.onPrimary} />
                      <Text style={styles.approveBtnText}>{busyId === leave.leaveId ? "..." : "Approve Leave"}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.rejectBtn}
                      disabled={busyId === leave.leaveId}
                      onPress={async () => {
                        setBusyId(leave.leaveId);
                        try {
                          await managerRejectLeave(leave.leaveId, notes[leave.leaveId]);
                          await load();
                        } catch (err) {
                          setError(apiErrorMessage(err));
                        } finally {
                          setBusyId(null);
                        }
                      }}
                    >
                      <MaterialIcons name="close" size={18} color={colors.onSurface} />
                      <Text style={styles.rejectBtnText}>Reject</Text>
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity
                    style={styles.noteBtn}
                    onPress={() => {
                      setApproverNote(notes[leave.leaveId] ?? "");
                      setNoteTarget(leave.leaveId);
                    }}
                  >
                    <MaterialIcons name="note-add" size={16} color={colors.secondary} />
                    <Text style={styles.noteBtnText}>Add Approver Note</Text>
                  </TouchableOpacity>
                </View>
              ) : null}
              {leave.status === "DRAFT" && leave.employeeId === me?.employeeId ? (
                <>
                  <TouchableOpacity onPress={() => router.push(`${applyHref}?draftId=${leave.leaveId}` as never)}>
                    <Text style={styles.actionLink}>Edit</Text>
                  </TouchableOpacity>
                <TouchableOpacity
                  disabled={busyId === leave.leaveId}
                  onPress={async () => {
                    setBusyId(leave.leaveId);
                    try {
                      await submitLeaveDraft(leave.leaveId);
                      await load();
                    } catch (err) {
                      setError(apiErrorMessage(err));
                    } finally {
                      setBusyId(null);
                    }
                  }}
                >
                  <Text style={styles.actionLink}>Submit</Text>
                </TouchableOpacity>
                </>
              ) : null}
              {leave.status === "APPROVED" && leave.employeeId === me?.employeeId ? (
                <TouchableOpacity
                  disabled={busyId === leave.leaveId}
                  onPress={async () => {
                    setBusyId(leave.leaveId);
                    try {
                      await cancelLeave(leave.leaveId);
                      await load();
                    } catch (err) {
                      setError(apiErrorMessage(err));
                    } finally {
                      setBusyId(null);
                    }
                  }}
                >
                  <Text style={styles.actionLink}>Cancel</Text>
                </TouchableOpacity>
              ) : null}
              {(leave.status === "SUBMITTED" || leave.status === "PENDING_HR_REVIEW" || leave.status === "DRAFT") &&
              leave.employeeId === me?.employeeId ? (
                <TouchableOpacity
                  disabled={busyId === leave.leaveId}
                  onPress={async () => {
                    setBusyId(leave.leaveId);
                    try {
                      await withdrawLeave(leave.leaveId);
                      await load();
                    } catch (err) {
                      setError(apiErrorMessage(err));
                    } finally {
                      setBusyId(null);
                    }
                  }}
                >
                  <Text style={styles.actionLink}>Withdraw</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
          );
        })}
        {!loading && section.rows.length === 0 ? <Text style={styles.meta}>No leave applications for this filter.</Text> : null}
      </WebCard>
      ))}
      </View>
      <Modal visible={noteTarget != null} transparent animationType="fade" onRequestClose={() => setNoteTarget(null)}>
        <Pressable style={styles.backdrop} onPress={() => setNoteTarget(null)}>
          <Pressable style={styles.dialog} onPress={(event) => event.stopPropagation()}>
            <View style={styles.dialogHead}>
              <Text style={styles.name}>Add Approver Note for leave #{noteTarget}</Text>
              <TouchableOpacity onPress={() => setNoteTarget(null)}>
                <MaterialIcons name="close" size={18} color={colors.secondary} />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.noteInput}
              value={approverNote}
              onChangeText={setApproverNote}
              placeholder="Saved only if you choose Add Approver Note"
              placeholderTextColor={colors.secondary}
            />
            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.rejectBtn} onPress={() => setNoteTarget(null)}>
                <Text style={styles.rejectBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.approveBtn}
                onPress={() => {
                  if (noteTarget == null) return;
                  setNotes((current) => ({ ...current, [noteTarget]: approverNote.trim() }));
                  setNoteTarget(null);
                  setApproverNote("");
                }}
              >
                <Text style={styles.approveBtnText}>Save note</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
      <ThemedDialog
        visible={noteText != null}
        compact
        title="HR note"
        message={noteText ?? ""}
        onRequestClose={() => setNoteText(null)}
        actions={[{ label: "Close", onPress: () => setNoteText(null), primary: true }]}
      />
    </WebShell>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 },
  kicker: { fontSize: 11, fontWeight: "700", color: colors.secondary, letterSpacing: 0.5 },
  name: { fontSize: 20, fontWeight: "700", color: colors.onSurface },
  apply: { flexDirection: "row", gap: 6, backgroundColor: colors.accent, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8, alignItems: "center" },
  applyText: { color: colors.onPrimary, fontWeight: "700" },
  filters: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: colors.surfaceContainer },
  chipOn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: colors.accent },
  chipText: { fontSize: 12, fontWeight: "600", color: colors.onSurface },
  chipOnText: { fontSize: 12, fontWeight: "600", color: colors.onPrimary },
  tableHead: { flexDirection: "row", width: "100%", paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: colors.surfaceContainerHighest },
  th: { fontSize: 11, fontWeight: "700", color: colors.secondary, textTransform: "uppercase" },
  tr: { flexDirection: "row", width: "100%", paddingVertical: 12, alignItems: "center" },
  entry: { width: "100%", borderBottomWidth: 1, borderBottomColor: colors.surfaceContainerHighest, paddingBottom: 8 },
  section: { fontSize: 13, fontWeight: "700", color: colors.onSurface, marginBottom: 8 },
  cards: { gap: 20 },
  approverLine: { fontSize: 13, color: colors.secondary, marginBottom: 8 },
  actionLine: { flexDirection: "row", flexWrap: "wrap", gap: 8, paddingBottom: 10, justifyContent: "flex-end" },
  actionsBox: { gap: 8, width: "100%", maxWidth: 420 },
  actionRow: { flexDirection: "row", gap: 8 },
  approveBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: colors.accent, height: 44, borderRadius: 4, gap: 4, paddingHorizontal: 8 },
  approveBtnText: { color: colors.onPrimary, fontWeight: "700" },
  rejectBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", height: 44, borderRadius: 4, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceContainerLowest, gap: 4 },
  rejectBtnText: { color: colors.onSurface, fontWeight: "700" },
  noteBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", height: 44, gap: 4, borderWidth: 1, borderColor: colors.border, borderRadius: 4, backgroundColor: colors.surfaceContainerLowest },
  noteBtnText: { color: colors.secondary, fontWeight: "700" },
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.35)", justifyContent: "center", alignItems: "center", padding: 24 },
  dialog: { width: "100%", maxWidth: 420, backgroundColor: colors.surfaceContainerLowest, borderRadius: 12, padding: 16, gap: 12 },
  dialogHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 },
  td: { fontSize: 13, color: colors.onSurface, paddingRight: 8 },
  meta: { fontSize: 12, color: colors.secondary, marginTop: 8 },
  link: { fontSize: 12, fontWeight: "700", color: colors.accentDeep },
  actionLink: { fontSize: 12, fontWeight: "700", color: colors.onSurface, borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: colors.surfaceContainerLowest, overflow: "hidden" },
  noteInput: { minWidth: 120, minHeight: 36, borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 8, color: colors.onSurface, backgroundColor: colors.surfaceContainerLowest },
});
