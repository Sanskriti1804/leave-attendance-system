import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, TextInput } from "react-native";
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
  const otherItems = filtered.filter(
    (row) => row.employeeId !== me?.employeeId && row.reportingManagerEmployeeId !== me?.employeeId,
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
      <WebCard>
        <View style={styles.tableHead}>
          <Text style={[styles.th, { flex: 1.4 }]}>Type</Text>
          <Text style={[styles.th, { flex: 1.6 }]}>Dates</Text>
          <Text style={[styles.th, { flex: 0.8 }]}>Days</Text>
          <Text style={[styles.th, { flex: 1.2 }]}>Status</Text>
          <Text style={[styles.th, { flex: 2 }]}>Reason</Text>
        </View>
        {([
          { title: "Employee Leave Requests", rows: reviewItems },
          { title: "", rows: myItems },
          { title: "", rows: otherItems },
        ] as const).flatMap((section) =>
          section.rows.length === 0
            ? []
            : [
                section.title ? <Text key={section.title} style={styles.section}>{section.title}</Text> : null,
                ...section.rows.map((leave) => {
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
                <>
                  <TextInput
                    value={notes[leave.leaveId] ?? ""}
                    onChangeText={(value) => setNotes((current) => ({ ...current, [leave.leaveId]: value }))}
                    placeholder="Approver note"
                    placeholderTextColor={colors.secondary}
                    style={styles.noteInput}
                  />
                  <TouchableOpacity
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
                    <Text style={styles.actionLink}>Approve</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
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
                    <Text style={styles.actionLink}>Reject</Text>
                  </TouchableOpacity>
                </>
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
        }),
              ],
        )}
        {!loading && filtered.length === 0 ? <Text style={styles.meta}>No leave applications for this filter.</Text> : null}
      </WebCard>
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
  section: { fontSize: 13, fontWeight: "700", color: colors.onSurface, marginTop: 12, marginBottom: 4 },
  actionLine: { flexDirection: "row", flexWrap: "wrap", gap: 8, paddingBottom: 10, justifyContent: "flex-end" },
  td: { fontSize: 13, color: colors.onSurface, paddingRight: 8 },
  meta: { fontSize: 12, color: colors.secondary, marginTop: 8 },
  link: { fontSize: 12, fontWeight: "700", color: colors.accentDeep },
  actionLink: { fontSize: 12, fontWeight: "700", color: colors.onSurface, borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: colors.surfaceContainerLowest, overflow: "hidden" },
  noteInput: { minWidth: 120, minHeight: 36, borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 8, color: colors.onSurface, backgroundColor: colors.surfaceContainerLowest },
});
