import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import {
  apiErrorMessage,
  getMe,
  getOrgSettings,
  patchOrgSettings,
  type OrganisationSettings,
} from "../../../services/resources";
import { colors } from "../../theme";
import { ScreenGradient, ThemedDialog } from "../../components/ui/AppChrome";
import { BottomNavBar, TopNavBar, useTopNavContentInset } from "../../components/ui/AdminComponents";
import { UIFallbackIndicator } from "../../components/ui/UIFallback";

const DOW: { id: number; label: string }[] = [
  { id: 1, label: "Mon" },
  { id: 2, label: "Tue" },
  { id: 3, label: "Wed" },
  { id: 4, label: "Thu" },
  { id: 5, label: "Fri" },
  { id: 6, label: "Sat" },
  { id: 7, label: "Sun" },
];

function formatOffs(weeklyOffDow: number[]): string {
  if (!weeklyOffDow.length) {
    return "None";
  }
  return weeklyOffDow
    .slice()
    .sort((a, b) => a - b)
    .map((id) => {
      const row = DOW.find((d) => d.id === id);
      return row ? `${row.label} (${id})` : String(id);
    })
    .join(", ");
}

export default function OrganisationSettingsScreen() {
  const topInset = useTopNavContentInset();
  const [role, setRole] = useState<string>("admin");
  const [settings, setSettings] = useState<OrganisationSettings | null>(null);
  const [workStart, setWorkStart] = useState("09:00");
  const [workEnd, setWorkEnd] = useState("18:00");
  const [grace, setGrace] = useState("15");
  const [maxAdvance, setMaxAdvance] = useState("14");
  const [weeklyOff, setWeeklyOff] = useState<number[]>([6, 7]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [dialog, setDialog] = useState<{ title: string; message: string } | null>(null);

  const isGuest = role === "guest_admin";
  const canEdit = role === "admin";

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const me = await getMe();
        if (!cancelled) {
          setRole(me.role);
        }
      } catch {
        if (!cancelled) {
          setRole("guest_admin");
        }
      }
      try {
        const org = await getOrgSettings();
        if (cancelled) {
          return;
        }
        setSettings(org);
        setWorkStart(org.workStart ?? "09:00");
        setWorkEnd(org.workEnd ?? "18:00");
        setGrace(String(org.graceMinutes ?? 0));
        setMaxAdvance(String(org.maxAdvanceDays ?? 14));
        setWeeklyOff(org.weeklyOffDow?.length ? org.weeklyOffDow : [6, 7]);
      } catch (err) {
        if (!cancelled) {
          setError(apiErrorMessage(err));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const toggleDow = (id: number) => {
    if (!canEdit) {
      return;
    }
    setWeeklyOff((prev) => (prev.includes(id) ? prev.filter((n) => n !== id) : [...prev, id].sort((a, b) => a - b)));
  };

  const onSave = async () => {
    if (!canEdit) {
      return;
    }
    const graceMinutes = Number(grace);
    const maxAdvanceDays = Number(maxAdvance);
    if (!/^\d{2}:\d{2}$/.test(workStart) || !/^\d{2}:\d{2}$/.test(workEnd)) {
      setDialog({ title: "Invalid time", message: "Use HH:MM for shift start and end." });
      return;
    }
    if (!Number.isInteger(graceMinutes) || graceMinutes < 0) {
      setDialog({ title: "Invalid grace", message: "Grace minutes must be a whole number ≥ 0." });
      return;
    }
    if (!Number.isInteger(maxAdvanceDays) || maxAdvanceDays < 1) {
      setDialog({ title: "Invalid advance days", message: "Max advance days must be a whole number ≥ 1." });
      return;
    }
    setSaving(true);
    try {
      const next = await patchOrgSettings({
        workStart,
        workEnd,
        graceMinutes,
        weeklyOffDow: weeklyOff,
        maxAdvanceDays,
      });
      setSettings(next);
      setDialog({ title: "Saved", message: "Organisation settings updated." });
    } catch (err) {
      setDialog({ title: "Could not save", message: apiErrorMessage(err) });
    } finally {
      setSaving(false);
    }
  };

  const medicalDays = settings?.medicalDocExceedsDays ?? 2;

  return (
    <ScreenGradient>
      <SafeAreaView style={styles.safe}>
        <TopNavBar title="Organisation Settings" showBack />
        <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: topInset }]} showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Standard Timezone</Text>
            <Text style={styles.cardSub}>Enterprise operational baseline (HR-DASH-09, TZ-04)</Text>
            <Text style={styles.heroValue}>{settings?.timezone ?? "America/New_York"}</Text>
            <Text style={styles.meta}>EST/EDT • Canonical Punch Reference</Text>
            {!settings ? <UIFallbackIndicator /> : null}
          </View>

          <View style={styles.card}>
            <View style={styles.cardHead}>
              <View>
                <Text style={styles.cardTitle}>Work Shift & Grace Policy</Text>
                <Text style={styles.cardSub}>Daily punch window & late threshold</Text>
              </View>
              <Text style={styles.badge}>{canEdit ? "Admin Editable" : "Read-Only"}</Text>
            </View>
            <Text style={styles.label}>Shift Start (workStart)</Text>
            <TextInput
              style={[styles.input, !canEdit && styles.inputLocked]}
              value={workStart}
              onChangeText={setWorkStart}
              editable={canEdit}
              placeholder="09:00"
              placeholderTextColor={colors.secondary}
            />
            <Text style={styles.label}>Shift End (workEnd)</Text>
            <TextInput
              style={[styles.input, !canEdit && styles.inputLocked]}
              value={workEnd}
              onChangeText={setWorkEnd}
              editable={canEdit}
              placeholder="18:00"
              placeholderTextColor={colors.secondary}
            />
            <Text style={styles.label}>Grace Period (graceMinutes)</Text>
            <TextInput
              style={[styles.input, !canEdit && styles.inputLocked]}
              value={grace}
              onChangeText={setGrace}
              editable={canEdit}
              keyboardType="number-pad"
            />
            <Text style={styles.meta}>Late marked after grace minutes from shift start</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Work Week & Advance Days</Text>
            <Text style={styles.cardSub}>Weekly off ISO schedule & submission limits</Text>
            <Text style={styles.badgeMuted}>ISO 1-7</Text>
            <Text style={styles.label}>Weekly Off Schedule (weeklyOffDow)</Text>
            <View style={styles.dowRow}>
              {DOW.map((day) => {
                const on = weeklyOff.includes(day.id);
                return (
                  <TouchableOpacity
                    key={day.id}
                    style={[styles.dow, on && styles.dowOn]}
                    onPress={() => toggleDow(day.id)}
                    disabled={!canEdit}
                  >
                    <Text style={[styles.dowText, on && styles.dowTextOn]}>{day.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <Text style={styles.meta}>Active Offs: {formatOffs(weeklyOff)}</Text>
            <Text style={styles.label}>Max Advance Application (maxAdvanceDays)</Text>
            <TextInput
              style={[styles.input, !canEdit && styles.inputLocked]}
              value={maxAdvance}
              onChangeText={setMaxAdvance}
              editable={canEdit}
              keyboardType="number-pad"
            />
            <Text style={styles.meta}>Days in advance</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.cardHead}>
              <Text style={styles.cardTitle}>Medical & Calendar Rules</Text>
              <Text style={styles.badgeMuted}>MED-09 / COMPLIANT</Text>
            </View>
            <Text style={styles.label}>Medical Certificate Mandatory Threshold</Text>
            <Text style={styles.heroValue}>{`> ${medicalDays} Days`}</Text>
            <Text style={styles.meta}>Document proof required when leave exceeds this threshold.</Text>
            <Text style={styles.label}>Count Intervening Weekends / Holidays</Text>
            <Text style={styles.infoValue}>
              Weekends {settings?.leaveCountExcludesWeekends ? "excluded" : "included"} · Holidays{" "}
              {settings?.leaveCountExcludesHolidays ? "excluded" : "included"}
            </Text>
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Text style={styles.footerNote}>Updates will apply globally across all employee shifts and validations.</Text>
          {canEdit ? (
            <TouchableOpacity style={styles.save} onPress={onSave} disabled={saving}>
              <Text style={styles.saveText}>{saving ? "Saving…" : "Save organisation settings"}</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.lockedBar}>
              <MaterialIcons name="lock" size={16} color={colors.secondary} />
              <Text style={styles.lockedText}>
                {isGuest ? "Guest Admin cannot change organisation settings." : "Editing locked."}
              </Text>
            </View>
          )}
        </ScrollView>
        <BottomNavBar activeRoute="more" />
        <ThemedDialog
          visible={dialog != null}
          title={dialog?.title ?? ""}
          message={dialog?.message}
          onRequestClose={() => setDialog(null)}
          actions={[{ label: "OK", onPress: () => setDialog(null), primary: true }]}
        />
      </SafeAreaView>
    </ScreenGradient>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  back: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceContainerHigh,
    marginTop: 4,
  },
  kicker: {
    fontFamily: "Inter",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.4,
    textTransform: "uppercase",
    color: colors.secondary,
  },
  title: { fontFamily: "Inter", fontSize: 20, fontWeight: "800", color: colors.onSurface },
  api: { fontFamily: "Inter", fontSize: 11, color: colors.secondary, marginTop: 2 },
  scroll: { paddingHorizontal: 16, paddingBottom: 120, gap: 12 },
  card: {
    backgroundColor: colors.glass,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    padding: 16,
    gap: 8,
  },
  cardHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 8 },
  cardTitle: { fontFamily: "Inter", fontSize: 15, fontWeight: "700", color: colors.onSurface },
  cardSub: { fontFamily: "Inter", fontSize: 12, color: colors.secondary, marginTop: 2 },
  heroValue: { fontFamily: "Inter", fontSize: 22, fontWeight: "700", color: colors.onSurface, marginTop: 4 },
  meta: { fontFamily: "Inter", fontSize: 11, color: colors.secondary },
  badge: {
    fontFamily: "Inter",
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    color: colors.onPrimary,
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: "hidden",
  },
  badgeMuted: {
    fontFamily: "Inter",
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    color: colors.secondary,
  },
  label: { fontFamily: "Inter", fontSize: 12, fontWeight: "600", color: colors.onSurface, marginTop: 6 },
  input: {
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    backgroundColor: colors.surfaceContainerLowest,
    paddingHorizontal: 12,
    fontFamily: "Inter",
    fontSize: 14,
    color: colors.onSurface,
  },
  inputLocked: { backgroundColor: colors.surfaceContainerLow, color: colors.secondary },
  dowRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  dow: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: colors.surfaceContainer,
  },
  dowOn: { backgroundColor: colors.primary },
  dowText: { fontFamily: "Inter", fontSize: 12, fontWeight: "700", color: colors.onSurface },
  dowTextOn: { color: colors.onPrimary },
  infoValue: { fontFamily: "Inter", fontSize: 13, fontWeight: "600", color: colors.onSurface },
  error: { fontFamily: "Inter", fontSize: 12, color: colors.error },
  footerNote: { fontFamily: "Inter", fontSize: 12, color: colors.secondary, lineHeight: 17 },
  save: {
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  saveText: { fontFamily: "Inter", fontSize: 14, fontWeight: "700", color: colors.onPrimary },
  lockedBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: colors.surfaceContainer,
  },
  lockedText: { fontFamily: "Inter", fontSize: 12, color: colors.secondary, flex: 1 },
});
