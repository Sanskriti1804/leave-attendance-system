import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { colors } from "../theme";
import { WebCard, WebShell } from "./WebShell";
import { formatDateIST, formatDurationMinutes, formatTimeIST, workingMinutes } from "../utils/date";
import { useTodayAttendance } from "../modules/attendance-management/useTodayAttendance";

export default function WebEmployeeHomeScreen() {
  const router = useRouter();
  const applyHref = (process.env.EXPO_PUBLIC_APPLY_LEAVE as string | undefined) || "/leave/apply";
  const {
    me,
    settings,
    dashboard,
    pendingCorrections,
    loading,
    error,
    punchError,
    punching,
    punchIn,
    punchOut,
  } = useTodayAttendance();
  const [clock, setClock] = useState("");

  useEffect(() => {
    const tick = () => setClock(formatTimeIST(new Date(), true));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const attendance = dashboard?.attendance ?? null;
  const shiftStart = settings?.workStart ?? "09:00";
  const shiftEnd = settings?.workEnd ?? "18:00";
  const worked = workingMinutes(attendance?.checkIn, attendance?.checkOut);
  const todayLabel = formatDateIST(new Date(), "full");
  const role = me?.role ?? "employee";
  const canCheckIn = Boolean(dashboard?.canCheckIn) && !punching;
  const canCheckOut = Boolean(dashboard?.canCheckOut) && !punching;

  return (
    <WebShell title="Home" variant="employee" activeRoute="home">
      <View style={styles.grid}>
        <WebCard style={styles.span2}>
          <View style={styles.rowBetween}>
            <View>
              <Text style={styles.kicker}>{settings?.timezone ?? "Asia/Kolkata"}</Text>
              <Text style={styles.date}>{loading ? "Loading…" : todayLabel}</Text>
            </View>
            <View style={styles.badges}>
              <View style={styles.badgeOn}>
                <Text style={styles.badgeOnText}>{role === "employee" ? "EMP" : role === "admin" ? "ADM" : "GST"}</Text>
              </View>
            </View>
          </View>
          <Text style={styles.clock}>{clock || "--:--:-- IST"}</Text>
          <Text style={styles.meta}>
            Shift: {shiftStart} - {shiftEnd}
          </Text>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          {punchError ? <Text style={styles.error}>{punchError}</Text> : null}
        </WebCard>
        <WebCard>
          <Text style={styles.cardTitle}>Check-In</Text>
          {loading ? <ActivityIndicator color={colors.primary} /> : canCheckIn ? (
            <TouchableOpacity style={styles.primaryBtn} onPress={() => void punchIn()} disabled={punching}>
              <MaterialIcons name="fingerprint" size={18} color={colors.onPrimary} />
              <Text style={styles.primaryBtnText}>{punching ? "Saving…" : "Check In"}</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.disabledBtn}>
              <Text style={styles.disabledBtnText}>{attendance?.checkIn ? "Checked In" : "Unavailable"}</Text>
            </View>
          )}
          <Text style={styles.meta}>
            {attendance?.checkIn ? formatTimeIST(attendance.checkIn, false) : "Not checked in"}
          </Text>
        </WebCard>
        <WebCard>
          <Text style={styles.cardTitle}>Check-Out</Text>
          {canCheckOut ? (
            <TouchableOpacity style={styles.primaryBtn} onPress={() => void punchOut()} disabled={punching}>
              <MaterialIcons name="logout" size={18} color={colors.onPrimary} />
              <Text style={styles.primaryBtnText}>{punching ? "Saving…" : "Check Out"}</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.disabledBtn}>
              <Text style={styles.disabledBtnText}>{attendance?.checkOut ? "Checked Out" : "Check-out locked"}</Text>
            </View>
          )}
          <Text style={styles.meta}>
            {attendance?.checkOut ? formatTimeIST(attendance.checkOut, false) : "Not checked out"}
          </Text>
        </WebCard>
      </View>
      <Text style={styles.note}>
        Check-in and check-out call `/api/v1/attendance`. Duplicate punches are blocked by the server and disabled in this UI.
      </Text>
      <View style={styles.metrics}>
        <WebCard style={styles.metric}>
          <Text style={styles.kicker}>Work Log</Text>
          <Text style={styles.metricVal}>{formatDurationMinutes(worked)}</Text>
          <Text style={styles.meta}>Of scheduled shift</Text>
        </WebCard>
        <WebCard style={styles.metric}>
          <Text style={styles.kicker}>Attendance</Text>
          <Text style={styles.metricVal}>{dashboard?.status ?? "Not Marked"}</Text>
          <Text style={styles.meta}>
            {(dashboard?.lateMinutes ?? 0) > 0 ? `${dashboard?.lateMinutes} min late` : "On time"}
          </Text>
        </WebCard>
        <WebCard style={styles.metric}>
          <Text style={styles.kicker}>Corrections</Text>
          <Text style={styles.metricVal}>{pendingCorrections}</Text>
          <Text style={styles.meta}>Pending requests</Text>
        </WebCard>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.action} onPress={() => router.push(applyHref as never)}>
          <Text style={styles.actionTitle}>Apply Leave</Text>
          <Text style={styles.meta}>Paid, Casual, or Medical PTO</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.action} onPress={() => router.push("/attendance-corrections" as never)}>
          <Text style={styles.actionTitle}>Request Correction</Text>
          <Text style={styles.meta}>Missed punch or regularize</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.action} onPress={() => router.push("/leave/list" as never)}>
          <Text style={styles.actionTitle}>My Leave</Text>
          <Text style={styles.meta}>Status history</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.action} onPress={() => router.push("/(tabs)/attendance" as never)}>
          <Text style={styles.actionTitle}>Attendance ledger</Text>
          <Text style={styles.meta}>Monthly history</Text>
        </TouchableOpacity>
      </View>
    </WebShell>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 16 },
  span2: { flexGrow: 1, flexBasis: 420 },
  rowBetween: { flexDirection: "row", justifyContent: "space-between" },
  kicker: { fontSize: 11, fontWeight: "700", letterSpacing: 2, color: colors.accentDeep, textTransform: "uppercase" },
  date: { fontSize: 16, fontWeight: "600", color: colors.onSurface, marginTop: 4 },
  badges: { flexDirection: "row", gap: 8, alignItems: "center" },
  badgeOn: { backgroundColor: colors.accent, borderRadius: 4, paddingHorizontal: 8, paddingVertical: 4 },
  badgeOnText: { color: colors.onPrimary, fontSize: 11, fontWeight: "700" },
  clock: { fontSize: 48, fontWeight: "700", color: colors.onSurface, marginTop: 12, letterSpacing: -1.2 },
  meta: { fontSize: 12, color: colors.secondary, marginTop: 6 },
  error: { fontSize: 13, color: colors.error, marginTop: 8 },
  cardTitle: { fontSize: 16, fontWeight: "600", marginBottom: 12, color: colors.onSurface },
  disabledBtn: { backgroundColor: colors.surfaceContainer, borderRadius: 8, padding: 12, alignItems: "center" },
  disabledBtnText: { fontWeight: "600", color: colors.secondary },
  primaryBtn: { backgroundColor: colors.accent, borderRadius: 8, padding: 12, flexDirection: "row", gap: 8, justifyContent: "center", alignItems: "center" },
  primaryBtnText: { color: colors.onPrimary, fontWeight: "700" },
  note: { fontSize: 12, color: colors.secondary, lineHeight: 18 },
  metrics: { flexDirection: "row", flexWrap: "wrap", gap: 16 },
  metric: { flexGrow: 1, flexBasis: 180 },
  metricVal: { fontSize: 22, fontWeight: "700", color: colors.onSurface, marginTop: 6 },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  action: { flexGrow: 1, flexBasis: 220, backgroundColor: colors.surfaceContainerLowest, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: "rgba(0,0,0,0.08)" },
  actionTitle: { fontSize: 15, fontWeight: "600", color: colors.onSurface },
});
