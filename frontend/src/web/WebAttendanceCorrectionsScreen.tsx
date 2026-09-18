import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import {
  apiErrorMessage,
  createAttendanceCorrection,
  displayName,
  listMyCorrections,
  type AttendanceCorrection,
} from "../../services/resources";
import { formatDateIST, formatTimeIST, getTodayIST } from "../utils/date";
import { colors } from "../theme";
import { WebCard, WebShell } from "./WebShell";

const types = ["Check-In & Check-Out", "Check-In Only", "Check-Out Only"] as const;
type CorrectionType = (typeof types)[number];
type Filter = "ALL" | AttendanceCorrection["status"];

function toUtcFromIst(date: string, time: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) return null;
  const value = new Date(`${date}T${time}:00.000+05:30`);
  return Number.isNaN(value.getTime()) ? null : value.toISOString();
}

export default function WebAttendanceCorrectionsScreen() {
  const [date, setDate] = useState(getTodayIST());
  const [type, setType] = useState<CorrectionType>(types[0]);
  const [checkIn, setCheckIn] = useState("09:00");
  const [checkOut, setCheckOut] = useState("18:00");
  const [reason, setReason] = useState("");
  const [items, setItems] = useState<AttendanceCorrection[]>([]);
  const [filter, setFilter] = useState<Filter>("ALL");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setItems((await listMyCorrections()).items);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const visibleItems = useMemo(
    () => (filter === "ALL" ? items : items.filter((item) => item.status === filter)),
    [filter, items],
  );
  const needsIn = type !== "Check-Out Only";
  const needsOut = type !== "Check-In Only";

  async function submit() {
    setMessage(null);
    setError(null);
    const correctLoginTime = needsIn ? toUtcFromIst(date, checkIn) : null;
    const correctLogoutTime = needsOut ? toUtcFromIst(date, checkOut) : null;
    if ((needsIn && !correctLoginTime) || (needsOut && !correctLogoutTime)) {
      setError("Use YYYY-MM-DD and HH:mm values for IST time.");
      return;
    }
    if (reason.trim().length < 3) {
      setError("Please provide a reason with at least 3 characters.");
      return;
    }
    setSubmitting(true);
    try {
      const created = await createAttendanceCorrection({
        correctionDate: date,
        correctionType: type,
        correctLoginTime,
        correctLogoutTime,
        reason: reason.trim(),
      });
      setItems((current) => [created, ...current]);
      setMessage(`Submitted correction #CORR-${created.correctionId}.`);
      setReason("");
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <WebShell title="Attendance Corrections" variant="employee" activeRoute="attendance" showBack>
      <WebCard>
        <Text style={styles.title}>Request Attendance Correction</Text>
        <Text style={styles.label}>Attendance date</Text>
        <TextInput value={date} onChangeText={setDate} style={styles.input} autoCapitalize="none" />
        <View style={styles.filters}>
          {types.map((option) => (
            <TouchableOpacity key={option} style={type === option ? styles.chipOn : styles.chip} onPress={() => setType(option)}>
              <Text style={type === option ? styles.chipOnText : styles.chipText}>{option}</Text>
            </TouchableOpacity>
          ))}
        </View>
        {needsIn ? (
          <>
            <Text style={styles.label}>Correct ingress (IN)</Text>
            <TextInput value={checkIn} onChangeText={setCheckIn} style={styles.input} />
          </>
        ) : null}
        {needsOut ? (
          <>
            <Text style={styles.label}>Correct egress (OUT)</Text>
            <TextInput value={checkOut} onChangeText={setCheckOut} style={styles.input} />
          </>
        ) : null}
        <Text style={styles.label}>Reason</Text>
        <TextInput value={reason} onChangeText={setReason} style={[styles.input, styles.reason]} multiline />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {message ? <Text style={styles.meta}>{message}</Text> : null}
        <TouchableOpacity style={styles.submit} disabled={submitting} onPress={() => void submit()}>
          <Text style={styles.submitText}>{submitting ? "Submitting…" : "Submit Correction"}</Text>
        </TouchableOpacity>
      </WebCard>
      <View style={styles.filters}>
        {(["ALL", "PENDING", "APPROVED", "REJECTED"] as Filter[]).map((value) => (
          <TouchableOpacity key={value} style={filter === value ? styles.chipOn : styles.chip} onPress={() => setFilter(value)}>
            <Text style={filter === value ? styles.chipOnText : styles.chipText}>{value}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {loading ? <ActivityIndicator color={colors.primary} /> : null}
      <WebCard>
        {visibleItems.map((item) => (
          <View key={item.correctionId} style={styles.row}>
            <Text style={styles.cell}>#CORR-{item.correctionId} · {formatDateIST(`${item.correctionDate}T00:00:00.000Z`, "short")}</Text>
            <Text style={styles.cell}>{item.status} · {item.correctionType}</Text>
            <Text style={styles.meta}>
              In {item.correctLoginTime ? formatTimeIST(item.correctLoginTime, false) : "—"} · Out{" "}
              {item.correctLogoutTime ? formatTimeIST(item.correctLogoutTime, false) : "—"}
              {item.reviewer ? ` · ${displayName(item.reviewer)}` : ""}
            </Text>
            <Text style={styles.meta}>{item.reason}</Text>
          </View>
        ))}
        {!loading && visibleItems.length === 0 ? <Text style={styles.meta}>No correction requests in this filter.</Text> : null}
      </WebCard>
    </WebShell>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 18, fontWeight: "700", color: colors.onSurface, marginBottom: 8 },
  label: { fontSize: 11, fontWeight: "700", color: colors.secondary, textTransform: "uppercase", marginTop: 8 },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, color: colors.onSurface, marginTop: 4 },
  reason: { minHeight: 80, textAlignVertical: "top" },
  filters: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: colors.surfaceContainer },
  chipOn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: colors.primary },
  chipText: { fontSize: 12, fontWeight: "600", color: colors.onSurface },
  chipOnText: { fontSize: 12, fontWeight: "600", color: colors.onPrimary },
  submit: { marginTop: 12, backgroundColor: colors.primary, borderRadius: 8, paddingVertical: 12, alignItems: "center" },
  submitText: { color: colors.onPrimary, fontWeight: "700" },
  row: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.surfaceContainerHighest, gap: 4 },
  cell: { fontSize: 14, color: colors.onSurface, fontWeight: "600" },
  meta: { fontSize: 12, color: colors.secondary },
  error: { color: colors.error, fontSize: 13, marginTop: 8 },
});
