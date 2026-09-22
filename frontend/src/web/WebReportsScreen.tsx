import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, TextInput, ActivityIndicator, TouchableOpacity, ScrollView } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import {
  apiErrorMessage,
  downloadReport,
  getReport,
  REPORT_SLUGS,
  type ReportSlug,
  type ReportTable,
} from "../../services/resources";
import { colors } from "../theme";
import { WebCard, WebShell } from "./WebShell";

const LABELS: Record<ReportSlug, string> = {
  "leave-employee": "Leave by employee",
  "leave-department": "Leave by department",
  "leave-monthly": "Leave monthly",
  "leave-type": "Leave by type",
  "leave-decisions": "Leave decisions",
  "attendance-daily": "Attendance daily",
  "attendance-monthly": "Attendance monthly",
  "attendance-employee": "Attendance by employee",
  "attendance-late": "Late arrivals",
  "attendance-missing-logout": "Missing logout",
};

const LEAVE_SLUGS = REPORT_SLUGS.filter((item) => item.startsWith("leave-"));
const ATTENDANCE_SLUGS = REPORT_SLUGS.filter((item) => item.startsWith("attendance-"));

function defaultRange(): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  from.setUTCDate(from.getUTCDate() - 30);
  const civil = (d: Date) => d.toISOString().slice(0, 10);
  return { from: civil(from), to: civil(to) };
}

export default function WebReportsScreen() {
  const initial = useMemo(defaultRange, []);
  const [slug, setSlug] = useState<ReportSlug>("leave-employee");
  const [from, setFrom] = useState(initial.from);
  const [to, setTo] = useState(initial.to);
  const [table, setTable] = useState<ReportTable | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setError(null);
    try {
      setTable(await getReport({ slug, from, to }));
    } catch (err) {
      setTable(null);
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  function ChipRow({ items }: { items: ReportSlug[] }) {
    return (
      <View style={styles.chips}>
        {items.map((item) => (
          <TouchableOpacity key={item} style={[styles.chip, slug === item && styles.chipOn]} onPress={() => setSlug(item)}>
            <Text style={[styles.chipText, slug === item && styles.chipTextOn]}>{LABELS[item]}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  }

  return (
    <WebShell title="Reports" variant="admin" activeRoute="reports">
      <WebCard style={styles.page}>
        <Text style={styles.title}>Organisation reports</Text>
        <Text style={styles.copy}>Choose a report, set the date range, then run. Results come from live records.</Text>
        <Text style={styles.group}>Leave</Text>
        <ChipRow items={LEAVE_SLUGS} />
        <Text style={styles.group}>Attendance</Text>
        <ChipRow items={ATTENDANCE_SLUGS} />
        <View style={styles.row}>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>From</Text>
            <TextInput style={styles.input} value={from} onChangeText={setFrom} placeholder="YYYY-MM-DD" placeholderTextColor={colors.secondary} />
          </View>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>To</Text>
            <TextInput style={styles.input} value={to} onChangeText={setTo} placeholder="YYYY-MM-DD" placeholderTextColor={colors.secondary} />
          </View>
          <TouchableOpacity style={styles.primary} onPress={() => void run()}>
            <MaterialIcons name="play-arrow" size={18} color={colors.onPrimary} />
            <Text style={styles.primaryText}>Run report</Text>
          </TouchableOpacity>
        </View>
      </WebCard>
      {loading ? <ActivityIndicator color={colors.primary} /> : null}
      {error ? <Text style={styles.copy}>{error}</Text> : null}
      {!loading && !error && table && table.rows.length === 0 ? <Text style={styles.copy}>No rows in this range.</Text> : null}
      {table ? (
        <WebCard style={styles.page}>
          <View style={styles.resultHead}>
            <Text style={styles.title}>{LABELS[slug]}</Text>
            <Text style={styles.copy}>{table.rows.length} row{table.rows.length === 1 ? "" : "s"}</Text>
          </View>
          <ScrollView horizontal>
            <View>
              <View style={styles.trHead}>
                {table.columns.map((col) => (
                  <Text key={col} style={[styles.th, styles.cell]}>
                    {col}
                  </Text>
                ))}
              </View>
              {table.rows.slice(0, 80).map((row, index) => (
                <View key={index} style={styles.tr}>
                  {row.map((cell, cellIndex) => (
                    <Text key={cellIndex} style={styles.cell} numberOfLines={1}>
                      {cell || "—"}
                    </Text>
                  ))}
                </View>
              ))}
            </View>
          </ScrollView>
          <View style={styles.row}>
            {(["csv", "xlsx", "pdf"] as const).map((format) => (
              <TouchableOpacity
                key={format}
                style={styles.export}
                onPress={() => void downloadReport({ slug, from, to, format }).catch((err) => setError(apiErrorMessage(err)))}
              >
                <Text style={styles.exportText}>{format.toUpperCase()}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </WebCard>
      ) : null}
    </WebShell>
  );
}

const styles = StyleSheet.create({
  page: { width: "100%", gap: 10 },
  title: { fontSize: 16, fontWeight: "700", color: colors.onSurface },
  copy: { fontSize: 13, color: colors.secondary, lineHeight: 18 },
  group: { fontSize: 11, fontWeight: "700", color: colors.accentDeep, textTransform: "uppercase", letterSpacing: 1, marginTop: 6 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { borderRadius: 999, borderWidth: 1, borderColor: colors.glassBorder, paddingHorizontal: 10, paddingVertical: 6 },
  chipOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText: { fontSize: 12, fontWeight: "600", color: colors.onSurface },
  chipTextOn: { color: colors.onPrimary },
  row: { flexDirection: "row", gap: 8, flexWrap: "wrap", marginTop: 8, alignItems: "flex-end" },
  field: { gap: 4 },
  fieldLabel: { fontSize: 11, fontWeight: "700", color: colors.secondary },
  input: {
    minWidth: 140,
    minHeight: 44,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    color: colors.onSurface,
    backgroundColor: colors.surfaceContainerLow,
  },
  primary: {
    backgroundColor: colors.accent,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  primaryText: { color: colors.onPrimary, fontWeight: "700" },
  resultHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", gap: 12 },
  trHead: { flexDirection: "row", backgroundColor: colors.surfaceContainer, borderRadius: 6 },
  tr: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: colors.surfaceContainerHighest },
  th: { fontWeight: "700" },
  cell: { width: 140, paddingVertical: 8, paddingHorizontal: 8, fontSize: 12, color: colors.onSurface },
  export: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  exportText: { fontWeight: "700", color: colors.accentDeep, fontSize: 12 },
});
