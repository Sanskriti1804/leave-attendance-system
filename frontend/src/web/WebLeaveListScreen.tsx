import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
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

  const typeName = (leaveTypeId: number) => types.find((row) => row.leaveTypeId === leaveTypeId)?.name ?? `Type ${leaveTypeId}`;
  const filtered = useMemo(() => items.filter((row) => matchesFilter(row.status, activeFilter)), [activeFilter, items]);
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
          <Text style={[styles.th, { flex: 1 }]}>Actions</Text>
        </View>
        {filtered.map((leave) => (
          <View key={leave.leaveId} style={styles.tr}>
            <Text style={[styles.td, { flex: 1.4 }]}>{typeName(leave.leaveTypeId)}</Text>
            <Text style={[styles.td, { flex: 1.6 }]}>
              {leave.startDate} – {leave.endDate}
            </Text>
            <Text style={[styles.td, { flex: 0.8 }]}>{leave.numberOfDays}</Text>
            <Text style={[styles.td, { flex: 1.2 }]}>{leave.status.replaceAll("_", " ")}</Text>
            <View style={{ flex: 2, gap: 4 }}>
              <Text style={styles.td} numberOfLines={2}>{leave.reason}</Text>
              {leave.hrComments ? (
                <TouchableOpacity onPress={() => setNoteText(leave.hrComments)}>
                  <Text style={styles.link}>View HR note</Text>
                </TouchableOpacity>
              ) : null}
            </View>
            <View style={{ flex: 1, flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
              {leave.status === "DRAFT" && leave.employeeId === me?.employeeId ? (
                <>
                  <TouchableOpacity onPress={() => router.push(`${applyHref}?draftId=${leave.leaveId}` as never)}>
                    <Text style={styles.link}>Edit</Text>
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
                  <Text style={styles.link}>Submit</Text>
                </TouchableOpacity>
                </>
              ) : null}
              {leave.status === "SUBMITTED" &&
              leave.managerApprovalStatus === "PENDING" &&
              leave.reportingManagerEmployeeId === me?.employeeId &&
              leave.employeeId !== me?.employeeId ? (
                <>
                  <TouchableOpacity
                    disabled={busyId === leave.leaveId}
                    onPress={async () => {
                      setBusyId(leave.leaveId);
                      try {
                        await managerApproveLeave(leave.leaveId);
                        await load();
                      } catch (err) {
                        setError(apiErrorMessage(err));
                      } finally {
                        setBusyId(null);
                      }
                    }}
                  >
                    <Text style={styles.link}>Approve</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    disabled={busyId === leave.leaveId}
                    onPress={async () => {
                      setBusyId(leave.leaveId);
                      try {
                        await managerRejectLeave(leave.leaveId);
                        await load();
                      } catch (err) {
                        setError(apiErrorMessage(err));
                      } finally {
                        setBusyId(null);
                      }
                    }}
                  >
                    <Text style={styles.link}>Reject</Text>
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
                  <Text style={styles.link}>Cancel</Text>
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
                  <Text style={styles.link}>Withdraw</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        ))}
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
  tableHead: { flexDirection: "row", paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: colors.surfaceContainerHighest },
  th: { fontSize: 11, fontWeight: "700", color: colors.secondary, textTransform: "uppercase" },
  tr: { flexDirection: "row", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.surfaceContainerHighest, alignItems: "center" },
  td: { fontSize: 13, color: colors.onSurface, paddingRight: 8 },
  meta: { fontSize: 12, color: colors.secondary, marginTop: 8 },
  link: { fontSize: 12, fontWeight: "700", color: colors.accentDeep },
});
