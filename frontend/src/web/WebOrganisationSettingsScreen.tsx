import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from "react-native";
import {
  apiErrorMessage,
  createHoliday,
  getMe,
  getOrgSettings,
  listHolidays,
  patchOrgSettings,
  type Holiday,
  type OrganisationSettings,
} from "../../services/resources";
import { colors } from "../theme";
import { WebCard, WebShell } from "./WebShell";

const DOW = [
  { id: 1, label: "Mon" },
  { id: 2, label: "Tue" },
  { id: 3, label: "Wed" },
  { id: 4, label: "Thu" },
  { id: 5, label: "Fri" },
  { id: 6, label: "Sat" },
  { id: 7, label: "Sun" },
];

export default function WebOrganisationSettingsScreen() {
  const [role, setRole] = useState("admin");
  const [settings, setSettings] = useState<OrganisationSettings | null>(null);
  const [workStart, setWorkStart] = useState("09:00");
  const [workEnd, setWorkEnd] = useState("18:00");
  const [grace, setGrace] = useState("15");
  const [maxAdvance, setMaxAdvance] = useState("14");
  const [weeklyOff, setWeeklyOff] = useState<number[]>([6, 7]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [holidayDate, setHolidayDate] = useState("");
  const [holidayName, setHolidayName] = useState("");
  const canEdit = role === "admin";
  const isGuest = role === "guest_admin";

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const me = await getMe();
        if (!cancelled) setRole(me.role);
      } catch {
        if (!cancelled) setRole("guest_admin");
      }
      try {
        const org = await getOrgSettings();
        if (cancelled) return;
        setSettings(org);
        setWorkStart(org.workStart ?? "09:00");
        setWorkEnd(org.workEnd ?? "18:00");
        setGrace(String(org.graceMinutes ?? 0));
        setMaxAdvance(String(org.maxAdvanceDays ?? 14));
        setWeeklyOff(org.weeklyOffDow?.length ? org.weeklyOffDow : [6, 7]);
      } catch (err) {
        if (!cancelled) setError(apiErrorMessage(err));
      }
      try {
        const rows = await listHolidays();
        if (!cancelled) setHolidays(rows.items);
      } catch {
        /* keep empty */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <WebShell title="Organisation Settings" variant="admin" activeRoute="more" showBack>
      <View style={styles.cols}>
        <WebCard style={styles.col}>
          <Text style={styles.h}>Standard Timezone</Text>
          <Text style={styles.hero}>{settings?.timezone ?? "America/New_York"}</Text>
        </WebCard>
        <WebCard style={styles.col}>
          <Text style={styles.h}>Work Shift & Grace</Text>
          <Text style={styles.meta}>{canEdit ? "Admin Editable" : "Read-Only"}</Text>
          <TextInput style={styles.input} value={workStart} onChangeText={setWorkStart} editable={canEdit} />
          <TextInput style={styles.input} value={workEnd} onChangeText={setWorkEnd} editable={canEdit} />
          <TextInput style={styles.input} value={grace} onChangeText={setGrace} editable={canEdit} keyboardType="number-pad" />
        </WebCard>
        <WebCard style={styles.col}>
          <Text style={styles.h}>Weekly off & advance</Text>
          <View style={styles.wrap}>
            {DOW.map((day) => {
              const on = weeklyOff.includes(day.id);
              return (
                <TouchableOpacity
                  key={day.id}
                  style={on ? styles.chipOn : styles.chip}
                  disabled={!canEdit}
                  onPress={() =>
                    setWeeklyOff((prev) => (prev.includes(day.id) ? prev.filter((n) => n !== day.id) : [...prev, day.id].sort((a, b) => a - b)))
                  }
                >
                  <Text style={on ? styles.chipOnText : styles.chipText}>{day.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <TextInput style={styles.input} value={maxAdvance} onChangeText={setMaxAdvance} editable={canEdit} keyboardType="number-pad" />
        </WebCard>
      </View>
      <WebCard>
        <Text style={styles.h}>Medical & Calendar Rules</Text>
        <Text style={styles.meta}>Medical certificate when leave exceeds {settings?.medicalDocExceedsDays ?? 2} days</Text>
        <Text style={styles.meta}>
          Weekends {settings?.leaveCountExcludesWeekends ? "excluded" : "included"} · Holidays{" "}
          {settings?.leaveCountExcludesHolidays ? "excluded" : "included"}
        </Text>
        {error ? <Text style={styles.err}>{error}</Text> : null}
        {holidays.map((row) => (
          <Text key={`${row.holidayDate}-${row.holidayName}`} style={styles.meta}>
            {row.holidayDate} · {row.holidayName}
          </Text>
        ))}
        {canEdit ? (
          <>
            <TextInput style={styles.input} value={holidayDate} onChangeText={setHolidayDate} placeholder="YYYY-MM-DD" placeholderTextColor={colors.secondary} />
            <TextInput style={styles.input} value={holidayName} onChangeText={setHolidayName} placeholder="Holiday name" placeholderTextColor={colors.secondary} />
            <TouchableOpacity
              style={styles.save}
              onPress={async () => {
                if (!/^\d{4}-\d{2}-\d{2}$/.test(holidayDate) || !holidayName.trim()) {
                  Alert.alert("Invalid holiday", "Use YYYY-MM-DD and a holiday name.");
                  return;
                }
                try {
                  const created = await createHoliday({ date: holidayDate, name: holidayName.trim() });
                  setHolidays((prev) => [...prev, created].sort((a, b) => (a.holidayDate ?? "").localeCompare(b.holidayDate ?? "")));
                  setHolidayDate("");
                  setHolidayName("");
                } catch (err) {
                  Alert.alert("Could not add holiday", apiErrorMessage(err));
                }
              }}
            >
              <Text style={styles.saveText}>Add holiday</Text>
            </TouchableOpacity>
          </>
        ) : null}
        {canEdit ? (
          <TouchableOpacity
            style={styles.save}
            disabled={saving}
            onPress={async () => {
              const graceMinutes = Number(grace);
              const maxAdvanceDays = Number(maxAdvance);
              if (!/^\d{2}:\d{2}$/.test(workStart) || !/^\d{2}:\d{2}$/.test(workEnd)) {
                Alert.alert("Invalid time", "Use HH:MM for shift start and end.");
                return;
              }
              if (!Number.isInteger(graceMinutes) || graceMinutes < 0) {
                Alert.alert("Invalid grace", "Grace minutes must be a whole number ≥ 0.");
                return;
              }
              if (!Number.isInteger(maxAdvanceDays) || maxAdvanceDays < 1) {
                Alert.alert("Invalid advance days", "Max advance days must be a whole number ≥ 1.");
                return;
              }
              setSaving(true);
              try {
                const next = await patchOrgSettings({ workStart, workEnd, graceMinutes, weeklyOffDow: weeklyOff, maxAdvanceDays });
                setSettings(next);
                Alert.alert("Saved", "Organisation settings updated.");
              } catch (err) {
                Alert.alert("Could not save", apiErrorMessage(err));
              } finally {
                setSaving(false);
              }
            }}
          >
            <Text style={styles.saveText}>{saving ? "Saving…" : "Save organisation settings"}</Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.meta}>{isGuest ? "Guest Admin cannot PATCH organisation settings (AUTH-09)." : "Editing locked."}</Text>
        )}
      </WebCard>
    </WebShell>
  );
}

const styles = StyleSheet.create({
  cols: { flexDirection: "row", flexWrap: "wrap", gap: 16 },
  col: { flexGrow: 1, flexBasis: 280, gap: 8 },
  h: { fontSize: 16, fontWeight: "700", color: colors.onSurface },
  hero: { fontSize: 22, fontWeight: "700", color: colors.onSurface },
  meta: { fontSize: 12, color: colors.secondary },
  input: { minHeight: 44, borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 10, color: colors.onSurface, backgroundColor: colors.surfaceContainerLow },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, backgroundColor: colors.surfaceContainer },
  chipOn: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, backgroundColor: colors.accent },
  chipText: { fontSize: 12, fontWeight: "700", color: colors.onSurface },
  chipOnText: { fontSize: 12, fontWeight: "700", color: colors.onPrimary },
  err: { color: colors.error, marginTop: 8 },
  save: { marginTop: 12, backgroundColor: colors.accent, borderRadius: 8, padding: 14, alignItems: "center" },
  saveText: { color: colors.onPrimary, fontWeight: "700" },
});
