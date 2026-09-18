import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import {
  apiErrorMessage,
  getMyAttendance,
  type AttendanceHistory,
  type AttendanceRecord,
} from "../../services/resources";
import { formatTimeIST, getTodayIST } from "../utils/date";
import { colors } from "../theme";
import { WebCard, WebShell } from "./WebShell";

type Filter = "all" | "Present" | "Absent" | "exceptions";

function monthFromDate(value: Date): string {
  return `${value.getUTCFullYear()}-${String(value.getUTCMonth() + 1).padStart(2, "0")}`;
}

function shiftMonth(month: string, delta: number): string {
  const [year, value] = month.split("-").map(Number);
  return monthFromDate(new Date(Date.UTC(year, value - 1 + delta, 1)));
}

function monthTitle(month: string): string {
  return new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", month: "long", year: "numeric" }).format(
    new Date(`${month}-01T00:00:00.000Z`),
  );
}

function isException(item: AttendanceRecord): boolean {
  return item.status === "Absent" || item.status === "Half-Day" || item.lateMinutes > 0 || (item.checkIn !== null && item.checkOut === null);
}

export default function WebAttendanceScreen() {
  const router = useRouter();
  const [month, setMonth] = useState(() => getTodayIST().slice(0, 7));
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<Filter>("all");
  const [data, setData] = useState<AttendanceHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await getMyAttendance(month, page));
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [month, page]);

  useEffect(() => {
    void load();
  }, [load]);

  const visibleItems = useMemo(() => {
    const items = data?.items ?? [];
    if (filter === "all") return items;
    if (filter === "exceptions") return items.filter(isException);
    return items.filter((item) => item.status === filter);
  }, [data, filter]);

  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / (data?.pageSize ?? 10)));
  const currentMonth = month === getTodayIST().slice(0, 7);

  return (
    <WebShell title="Attendance" variant="employee" activeRoute="attendance">
      <View style={styles.top}>
        <TouchableOpacity onPress={() => { setMonth((current) => shiftMonth(current, -1)); setPage(1); }}>
          <Text style={styles.link}>Previous</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{monthTitle(month)}</Text>
        <TouchableOpacity disabled={currentMonth} onPress={() => { if (!currentMonth) { setMonth((current) => shiftMonth(current, 1)); setPage(1); } }}>
          <Text style={[styles.link, currentMonth && styles.disabled]}>Next</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.stats}>
        <WebCard style={styles.stat}><Text style={styles.kicker}>Present</Text><Text style={styles.num}>{data?.summary.totalPresent ?? 0}</Text></WebCard>
        <WebCard style={styles.stat}><Text style={styles.kicker}>Absent</Text><Text style={styles.num}>{data?.summary.totalAbsent ?? 0}</Text></WebCard>
        <WebCard style={styles.stat}><Text style={styles.kicker}>Half-Day</Text><Text style={styles.num}>{data?.summary.totalHalfDay ?? 0}</Text></WebCard>
        <WebCard style={styles.stat}><Text style={styles.kicker}>On Leave</Text><Text style={styles.num}>{data?.summary.totalOnLeave ?? 0}</Text></WebCard>
      </View>
      <TouchableOpacity onPress={() => router.push("/attendance-corrections" as never)}>
        <Text style={styles.link}>Attendance corrections</Text>
      </TouchableOpacity>
      <View style={styles.filters}>
        {(["all", "Present", "Absent", "exceptions"] as Filter[]).map((name) => (
          <TouchableOpacity key={name} style={filter === name ? styles.chipOn : styles.chip} onPress={() => setFilter(name)}>
            <Text style={filter === name ? styles.chipOnText : styles.chipText}>
              {name === "all" ? "All" : name === "exceptions" ? "Exceptions" : name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {loading ? <ActivityIndicator color={colors.primary} /> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <WebCard>
        {visibleItems.map((item) => (
          <View key={item.attendanceId} style={styles.row}>
            <Text style={[styles.cell, { flex: 1.2 }]}>{item.attendanceDate}</Text>
            <Text style={[styles.cell, { flex: 1 }]}>{item.status}</Text>
            <Text style={[styles.cell, { flex: 1 }]}>{item.checkIn ? formatTimeIST(item.checkIn, false) : "—"}</Text>
            <Text style={[styles.cell, { flex: 1 }]}>{item.checkOut ? formatTimeIST(item.checkOut, false) : "—"}</Text>
            <Text style={[styles.cell, { flex: 0.8 }]}>{item.lateMinutes > 0 ? `${item.lateMinutes}m late` : "On time"}</Text>
          </View>
        ))}
        {!loading && !error && visibleItems.length === 0 ? <Text style={styles.meta}>No attendance records match this filter.</Text> : null}
      </WebCard>
      <View style={styles.top}>
        <TouchableOpacity disabled={page === 1} onPress={() => setPage((value) => value - 1)}>
          <Text style={[styles.link, page === 1 && styles.disabled]}>Prev page</Text>
        </TouchableOpacity>
        <Text style={styles.meta}>Page {page} of {totalPages}</Text>
        <TouchableOpacity disabled={page >= totalPages} onPress={() => setPage((value) => value + 1)}>
          <Text style={[styles.link, page >= totalPages && styles.disabled]}>Next page</Text>
        </TouchableOpacity>
      </View>
    </WebShell>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { fontSize: 18, fontWeight: "700", color: colors.onSurface },
  link: { fontSize: 13, fontWeight: "700", color: colors.primary },
  disabled: { opacity: 0.4 },
  stats: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  stat: { minWidth: 120, flexGrow: 1 },
  kicker: { fontSize: 11, fontWeight: "700", color: colors.secondary, textTransform: "uppercase" },
  num: { fontSize: 22, fontWeight: "700", color: colors.onSurface, marginTop: 4 },
  filters: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: colors.surfaceContainer },
  chipOn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: colors.primary },
  chipText: { fontSize: 12, fontWeight: "600", color: colors.onSurface },
  chipOnText: { fontSize: 12, fontWeight: "600", color: colors.onPrimary },
  row: { flexDirection: "row", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.surfaceContainerHighest },
  cell: { fontSize: 13, color: colors.onSurface, paddingRight: 8 },
  meta: { fontSize: 12, color: colors.secondary, marginTop: 8 },
  error: { color: colors.error, fontSize: 13 },
});
