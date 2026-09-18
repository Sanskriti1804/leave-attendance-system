import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Alert } from "react-native";
import { getSession } from "../../services/auth";
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
} from "../../services/resources";
import { colors } from "../theme";
import { WebCard, WebShell } from "./WebShell";

type QueueFilter = "pending" | "medical" | "approved" | "clarify";

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
  const [rejectTarget, setRejectTarget] = useState<number | null>(null);
  const [rejectComment, setRejectComment] = useState("");

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
        {(["pending", "medical", "approved", "clarify"] as const).map((key) => (
          <TouchableOpacity key={key} style={filter === key ? styles.chipOn : styles.chip} onPress={() => setFilter(key)}>
            <Text style={filter === key ? styles.chipOnText : styles.chipText}>{key}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {loading ? <ActivityIndicator color={colors.primary} /> : null}
      {error ? <Text style={styles.err}>{error}</Text> : null}
      <WebCard>
        {queued.map((leave) => (
          <View key={leave.leaveId} style={styles.row}>
            <View style={{ flex: 1.4 }}>
              <Text style={styles.name}>{employeeName(leave.employeeId)}</Text>
              <Text style={styles.meta}>{typeOf(leave.leaveTypeId)?.name ?? `Type ${leave.leaveTypeId}`}</Text>
            </View>
            <Text style={[styles.meta, { flex: 1.4 }]}>
              {leave.startDate} – {leave.endDate} ({leave.numberOfDays}d)
            </Text>
            <Text style={[styles.meta, { flex: 1 }]}>{leave.status.replaceAll("_", " ")}</Text>
            <Text style={[styles.meta, { flex: 2 }]} numberOfLines={2}>
              {leave.reason}
            </Text>
            {canAct && (leave.status === "PENDING_HR_REVIEW" || leave.status === "SUBMITTED") ? (
              <View style={styles.actions}>
                <TouchableOpacity
                  disabled={busyId === leave.leaveId}
                  onPress={async () => {
                    setBusyId(leave.leaveId);
                    try {
                      await approveLeave(leave.leaveId);
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
                <TouchableOpacity onPress={() => setRejectTarget(leave.leaveId)}>
                  <Text style={styles.link}>Reject</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        ))}
      </WebCard>
      {rejectTarget != null ? (
        <WebCard>
          <Text style={styles.name}>Reject leave #{rejectTarget}</Text>
          <TextInput style={styles.input} value={rejectComment} onChangeText={setRejectComment} placeholder="Comment" placeholderTextColor={colors.secondary} />
          <View style={styles.actions}>
            <TouchableOpacity onPress={() => setRejectTarget(null)}>
              <Text style={styles.meta}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={async () => {
                setBusyId(rejectTarget);
                try {
                  await rejectLeave(rejectTarget, rejectComment.trim() || "Rejected / clarify from review queue");
                  setRejectTarget(null);
                  setRejectComment("");
                  await load();
                } catch (err) {
                  Alert.alert("Could not reject", apiErrorMessage(err));
                } finally {
                  setBusyId(null);
                }
              }}
            >
              <Text style={styles.link}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </WebCard>
      ) : null}
    </WebShell>
  );
}

const styles = StyleSheet.create({
  role: { fontSize: 13, fontWeight: "600", color: colors.onSurface },
  filters: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: colors.surfaceContainer },
  chipOn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: colors.primary },
  chipText: { fontSize: 12, fontWeight: "600", color: colors.onSurface, textTransform: "uppercase" },
  chipOnText: { fontSize: 12, fontWeight: "600", color: colors.onPrimary, textTransform: "uppercase" },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.surfaceContainerHighest, alignItems: "center" },
  name: { fontSize: 14, fontWeight: "700", color: colors.onSurface },
  meta: { fontSize: 12, color: colors.secondary },
  actions: { flexDirection: "row", gap: 12 },
  link: { fontSize: 12, fontWeight: "700", color: colors.primary },
  err: { color: colors.error, fontSize: 13 },
  input: { minHeight: 44, borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 10, marginTop: 8, color: colors.onSurface },
});
