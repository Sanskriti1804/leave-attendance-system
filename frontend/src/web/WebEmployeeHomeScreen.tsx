import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { getSession } from "../../services/auth";
import { apiErrorMessage, getMe, getOrgSettings, type EmployeePublic, type OrganisationSettings } from "../../services/resources";
import { colors } from "../theme";
import { WebCard, WebShell } from "./WebShell";
import { UIFallbackIndicator } from "../components/ui/UIFallback";

export default function WebEmployeeHomeScreen() {
  const router = useRouter();
  const applyHref = (process.env.EXPO_PUBLIC_APPLY_LEAVE as string | undefined) || "/leave/apply";
  const [me, setMe] = useState<EmployeePublic | null>(null);
  const [settings, setSettings] = useState<OrganisationSettings | null>(null);
  const [clock, setClock] = useState("");
  const [clockPeriod, setClockPeriod] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const session = await getSession();
        try {
          const profile = await getMe();
          if (!cancelled) setMe(profile);
        } catch {
          if (!cancelled) setMe((session?.user as EmployeePublic | undefined) ?? null);
        }
        try {
          const org = await getOrgSettings();
          if (!cancelled) setSettings(org);
        } catch (err) {
          if (!cancelled) setError(apiErrorMessage(err));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const zone = settings?.timezone ?? "America/New_York";
    const tick = () => {
      const formatted = new Date().toLocaleTimeString(undefined, {
        timeZone: zone,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      });
      const [timePart, periodPart] = formatted.split(" ");
      setClock(timePart ?? formatted);
      setClockPeriod(periodPart ?? "");
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [settings?.timezone]);

  const todayLabel = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: settings?.timezone,
  });
  const role = me?.role ?? "employee";

  return (
    <WebShell title="Home" variant="employee" activeRoute="home">
      <View style={styles.grid}>
        <WebCard style={styles.span2}>
          <View style={styles.rowBetween}>
            <View>
              <Text style={styles.kicker}>{settings?.timezone ?? "America/New_York"}</Text>
              <Text style={styles.date}>{loading ? "Loading…" : todayLabel}</Text>
            </View>
            <View style={styles.badges}>
              <View style={styles.badgeOn}>
                <Text style={styles.badgeOnText}>{role === "employee" ? "EMP" : role === "admin" ? "ADM" : "GST"}</Text>
              </View>
              {error ? <UIFallbackIndicator /> : null}
            </View>
          </View>
          <Text style={styles.clock}>
            {clock || "--:--:--"} <Text style={styles.ampm}>{clockPeriod || "EST"}</Text>
          </Text>
          <Text style={styles.meta}>
            Shift: {settings?.workStart ?? "—"} - {settings?.workEnd ?? "—"}
          </Text>
        </WebCard>
        <WebCard>
          <Text style={styles.cardTitle}>Check-In</Text>
          <View style={styles.disabledBtn}>
            <Text style={styles.disabledBtnText}>Checked In</Text>
          </View>
          <Text style={styles.meta}>At 08:58 AM EST</Text>
        </WebCard>
        <WebCard>
          <Text style={styles.cardTitle}>Check-Out</Text>
          <TouchableOpacity style={styles.primaryBtn}>
            <MaterialIcons name="fingerprint" size={18} color={colors.onPrimary} />
            <Text style={styles.primaryBtnText}>Check Out</Text>
          </TouchableOpacity>
          <Text style={styles.meta}>Armed • Geofence OK</Text>
        </WebCard>
      </View>
      <Text style={styles.note}>
        BR-10 Compliance: Punches permanently logged. Check-in disabled to prevent duplicate timestamp.
      </Text>
      <View style={styles.metrics}>
        <WebCard style={styles.metric}>
          <Text style={styles.kicker}>Work Log</Text>
          <Text style={styles.metricVal}>04h 16m</Text>
          <Text style={styles.meta}>Of 08h 00m</Text>
        </WebCard>
        <WebCard style={styles.metric}>
          <Text style={styles.kicker}>Attendance</Text>
          <Text style={styles.metricVal}>On Duty</Text>
          <Text style={styles.meta}>Present Tier-1</Text>
        </WebCard>
        <WebCard style={styles.metric}>
          <Text style={styles.kicker}>Break Log</Text>
          <Text style={styles.metricVal}>Not on break</Text>
          <Text style={styles.meta}>0m Taken</Text>
        </WebCard>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.action} onPress={() => router.push(applyHref as never)}>
          <Text style={styles.actionTitle}>Apply Leave</Text>
          <Text style={styles.meta}>Paid, Casual, or Medical PTO</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.action} onPress={() => router.push("/(tabs)/attendance" as never)}>
          <Text style={styles.actionTitle}>Request Correction</Text>
          <Text style={styles.meta}>Missed punch or regularize</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.action} onPress={() => router.push("/leave/list" as never)}>
          <Text style={styles.actionTitle}>My Leave</Text>
          <Text style={styles.meta}>Status history</Text>
        </TouchableOpacity>
      </View>
    </WebShell>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 16 },
  span2: { flexGrow: 1, flexBasis: 420 },
  rowBetween: { flexDirection: "row", justifyContent: "space-between" },
  kicker: { fontSize: 11, fontWeight: "700", letterSpacing: 0.5, color: colors.secondary, textTransform: "uppercase" },
  date: { fontSize: 16, fontWeight: "600", color: colors.onSurface, marginTop: 4 },
  badges: { flexDirection: "row", gap: 8, alignItems: "center" },
  badgeOn: { backgroundColor: colors.primary, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  badgeOnText: { color: colors.onPrimary, fontSize: 11, fontWeight: "700" },
  clock: { fontSize: 40, fontWeight: "700", color: colors.onSurface, marginTop: 12 },
  ampm: { fontSize: 18, color: colors.secondary },
  meta: { fontSize: 12, color: colors.secondary, marginTop: 6 },
  cardTitle: { fontSize: 16, fontWeight: "600", marginBottom: 12, color: colors.onSurface },
  disabledBtn: { backgroundColor: colors.surfaceContainer, borderRadius: 8, padding: 12, alignItems: "center" },
  disabledBtnText: { fontWeight: "600", color: colors.secondary },
  primaryBtn: { backgroundColor: colors.primary, borderRadius: 8, padding: 12, flexDirection: "row", gap: 8, justifyContent: "center", alignItems: "center" },
  primaryBtnText: { color: colors.onPrimary, fontWeight: "700" },
  note: { fontSize: 12, color: colors.secondary, lineHeight: 18 },
  metrics: { flexDirection: "row", flexWrap: "wrap", gap: 16 },
  metric: { flexGrow: 1, flexBasis: 180 },
  metricVal: { fontSize: 22, fontWeight: "700", color: colors.onSurface, marginTop: 6 },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  action: { flexGrow: 1, flexBasis: 220, backgroundColor: colors.surfaceContainerLowest, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: "rgba(0,0,0,0.08)" },
  actionTitle: { fontSize: 15, fontWeight: "600", color: colors.onSurface },
});
