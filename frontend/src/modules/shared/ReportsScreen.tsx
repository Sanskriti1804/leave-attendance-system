import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TextInput,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import {
  apiErrorMessage,
  downloadReport,
  getReport,
  REPORT_SLUGS,
  type ReportSlug,
  type ReportTable,
} from "../../../services/resources";
import { colors } from "../../theme";
import { RoleBottomNav, ScreenGradient } from "../../components/ui/AppChrome";
import { SCROLL_UNDER_BOTTOM_NAV, TopNavBar, useTopNavContentInset } from "../../components/ui/AdminComponents";

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

function defaultRange(): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  from.setUTCDate(from.getUTCDate() - 30);
  const civil = (d: Date) => d.toISOString().slice(0, 10);
  return { from: civil(from), to: civil(to) };
}

export default function ReportsScreen() {
  const topInset = useTopNavContentInset();
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

  return (
    <ScreenGradient>
      <SafeAreaView style={styles.safe}>
        <TopNavBar title="Reports" />
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingTop: topInset }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            <Text style={styles.kicker}>AUTH-07</Text>
            <Text style={styles.copy}>Org leave and attendance reports from live records. Range is required.</Text>
            <View style={styles.chips}>
              {REPORT_SLUGS.map((item) => (
                <TouchableOpacity
                  key={item}
                  style={[styles.chip, slug === item && styles.chipOn]}
                  onPress={() => setSlug(item)}
                >
                  <Text style={[styles.chipText, slug === item && styles.chipTextOn]}>{LABELS[item]}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.row}>
              <TextInput style={styles.input} value={from} onChangeText={setFrom} placeholder="From YYYY-MM-DD" placeholderTextColor={colors.secondary} />
              <TextInput style={styles.input} value={to} onChangeText={setTo} placeholder="To YYYY-MM-DD" placeholderTextColor={colors.secondary} />
            </View>
            <TouchableOpacity style={styles.primary} onPress={() => void run()}>
              <Text style={styles.primaryText}>Run report</Text>
            </TouchableOpacity>
          </View>
          {loading ? <ActivityIndicator color={colors.primary} /> : null}
          {error ? <Text style={styles.copy}>{error}</Text> : null}
          {!loading && !error && table && table.rows.length === 0 ? (
            <Text style={styles.copy}>No rows in this range.</Text>
          ) : null}
          {table ? (
            <View style={styles.card}>
              <Text style={styles.title}>{LABELS[slug]}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View>
                  <View style={styles.tr}>
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
            </View>
          ) : null}
        </ScrollView>
        <RoleBottomNav variant="admin" activeRoute="reports" />
      </SafeAreaView>
    </ScreenGradient>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingBottom: SCROLL_UNDER_BOTTOM_NAV, gap: 12 },
  card: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 10,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  kicker: { fontSize: 11, fontWeight: "700", color: colors.secondary, textTransform: "uppercase" },
  title: { fontSize: 16, fontWeight: "700", color: colors.onSurface },
  copy: { fontSize: 13, color: colors.secondary, lineHeight: 18 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { borderRadius: 999, borderWidth: 1, borderColor: colors.glassBorder, paddingHorizontal: 10, paddingVertical: 6 },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 12, fontWeight: "600", color: colors.onSurface },
  chipTextOn: { color: colors.onPrimary },
  row: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  input: {
    flex: 1,
    minWidth: 140,
    minHeight: 44,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    color: colors.onSurface,
    backgroundColor: colors.surfaceContainerLowest,
  },
  primary: { backgroundColor: colors.primary, borderRadius: 8, paddingVertical: 12, alignItems: "center" },
  primaryText: { color: colors.onPrimary, fontWeight: "700" },
  tr: { flexDirection: "row" },
  th: { fontWeight: "700" },
  cell: { width: 128, paddingVertical: 6, paddingRight: 8, fontSize: 12, color: colors.onSurface },
  export: { borderWidth: 1, borderColor: colors.glassBorder, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  exportText: { fontSize: 12, fontWeight: "700", color: colors.primary },
});
