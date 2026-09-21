import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { apiErrorMessage, createAttendanceCorrection, displayName, listMyCorrections, type AttendanceCorrection } from "../../../services/resources";
import { formatDateIST, formatDateTimeIST, formatTimeIST, getTodayIST } from "../../utils/date";
import { ScreenGradient } from "../../components/ui/AppChrome";
import { TopNavBar, useTopNavContentInset } from "../../components/ui/AdminComponents";
import { EmployeeBottomNavBar } from "../../components/ui/EmployeeComponents";
import { colors as themeColors } from "../../theme";

const colors = {
  ...themeColors,
  card: themeColors.surfaceContainerLowest,
  low: themeColors.surfaceContainerLow,
  container: themeColors.surfaceContainer,
  high: themeColors.surfaceContainerHigh,
  text: themeColors.onSurface,
  variant: themeColors.onSurfaceVariant,
};
const types = ["Check-In & Check-Out", "Check-In Only", "Check-Out Only"] as const;
type CorrectionType = typeof types[number];
type Filter = "ALL" | AttendanceCorrection["status"];

function toUtcFromIst(date: string, time: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) return null;
  const value = new Date(`${date}T${time}:00.000+05:30`);
  return Number.isNaN(value.getTime()) ? null : value.toISOString();
}

function correctionLabel(value: string): string { return value.replaceAll("_", " ").replaceAll("-", " "); }

export default function AttendanceCorrectionsScreen() {
  const router = useRouter();
  const topInset = useTopNavContentInset();
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
  const [selected, setSelected] = useState<AttendanceCorrection | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { setItems((await listMyCorrections()).items); } catch (err) { setError(apiErrorMessage(err)); } finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const visibleItems = useMemo(() => filter === "ALL" ? items : items.filter((item) => item.status === filter), [filter, items]);
  const count = (value: Filter) => value === "ALL" ? items.length : items.filter((item) => item.status === value).length;
  const needsIn = type !== "Check-Out Only";
  const needsOut = type !== "Check-In Only";

  async function submit() {
    setMessage(null); setError(null);
    const correctLoginTime = needsIn ? toUtcFromIst(date, checkIn) : null;
    const correctLogoutTime = needsOut ? toUtcFromIst(date, checkOut) : null;
    if ((needsIn && !correctLoginTime) || (needsOut && !correctLogoutTime)) { setError("Use YYYY-MM-DD and HH:mm values for IST time."); return; }
    if (reason.trim().length < 3) { setError("Please provide a reason with at least 3 characters."); return; }
    setSubmitting(true);
    try {
      const created = await createAttendanceCorrection({ correctionDate: date, correctionType: type, correctLoginTime, correctLogoutTime, reason: reason.trim() });
      setItems((current) => [created, ...current]); setMessage(`Submitted correction #CORR-${created.correctionId}.`); setReason("");
    } catch (err) { setError(apiErrorMessage(err)); } finally { setSubmitting(false); }
  }

  return (
    <ScreenGradient>
    <SafeAreaView style={styles.safe}>
      <TopNavBar title="Attendance Corrections" showBack />
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: topInset }]} showsVerticalScrollIndicator={false}>
    <View style={styles.formCard}><Text style={styles.formTitle}>Request Attendance Correction</Text>
      <Label text="Attendance date" hint="YYYY-MM-DD" required /><View style={styles.inputWrap}><MaterialIcons name="calendar-month" size={19} color={colors.variant} /><TextInput value={date} onChangeText={setDate} style={styles.input} autoCapitalize="none" placeholder="YYYY-MM-DD" /></View>
      <Label text="Correction type" required /><View style={styles.typeRow}>{types.map((option) => <TouchableOpacity key={option} onPress={() => setType(option)} style={[styles.typeButton, type === option && styles.typeButtonActive]}><Text style={[styles.typeText, type === option && styles.typeTextActive]}>{option}</Text></TouchableOpacity>)}</View>
      <View style={styles.times}>{needsIn ? <TimeField label="Correct ingress (IN)" value={checkIn} onChangeText={setCheckIn} /> : null}{needsOut ? <TimeField label="Correct egress (OUT)" value={checkOut} onChangeText={setCheckOut} /> : null}</View>
      <Label text="Reason for correction" hint="Required" required /><TextInput value={reason} onChangeText={setReason} style={styles.reason} multiline maxLength={500} textAlignVertical="top" placeholder="Describe the attendance issue" placeholderTextColor={colors.secondary} />
      {error ? <Text selectable style={styles.error}>{error}</Text> : null}{message ? <Text selectable style={styles.message}>{message}</Text> : null}
      <TouchableOpacity style={[styles.submit, submitting && styles.disabled]} disabled={submitting} onPress={() => void submit()}><MaterialIcons name={submitting ? "sync" : "send"} size={18} color={colors.onPrimary} /><Text style={styles.submitText}>{submitting ? "Validating rules…" : "Submit Correction"}</Text></TouchableOpacity>
      <TouchableOpacity style={styles.reset} onPress={() => { setDate(getTodayIST()); setType(types[0]); setCheckIn("09:00"); setCheckOut("18:00"); setReason(""); setError(null); setMessage(null); }}><Text style={styles.resetText}>Reset Fields</Text></TouchableOpacity>
    </View>
    <View style={styles.historyHeader}><Text style={styles.historyTitle}>My Correction Requests</Text><Text style={styles.entryCount}>{items.length} ENTRIES</Text></View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>{(["ALL", "PENDING", "APPROVED", "REJECTED"] as Filter[]).map((value) => <TouchableOpacity key={value} onPress={() => setFilter(value)} style={[styles.filter, filter === value && styles.filterActive]}><Text style={[styles.filterText, filter === value && styles.filterTextActive]}>{correctionLabel(value)} ({count(value)})</Text></TouchableOpacity>)}</ScrollView>
    {loading ? <ActivityIndicator color={colors.primary} style={styles.loader} /> : null}{!loading && visibleItems.length === 0 ? <Text style={styles.empty}>No correction requests in this filter.</Text> : null}
    {visibleItems.map((item) => <CorrectionCard key={item.correctionId} item={item} onPress={() => setSelected(item)} />)}
  </ScrollView>
      <CorrectionInspector item={selected} onClose={() => setSelected(null)} />
      <EmployeeBottomNavBar activeRoute="attendance" />
    </SafeAreaView>
    </ScreenGradient>
  );
}

function Label({ text, hint, required }: { text: string; hint?: string; required?: boolean }) { return <View style={styles.labelRow}><Text style={styles.label}>{text}{required ? " *" : ""}</Text>{hint ? <Text style={styles.hint}>{hint}</Text> : null}</View>; }
function TimeField({ label, value, onChangeText }: { label: string; value: string; onChangeText: (value: string) => void }) { return <View style={styles.timeField}><Label text={label} hint="IST" required /><View style={styles.inputWrap}><MaterialIcons name="schedule" size={19} color={colors.variant} /><TextInput value={value} onChangeText={onChangeText} style={styles.input} placeholder="HH:mm" keyboardType="numbers-and-punctuation" /></View></View>; }
function time(value: string | null): string { return value ? formatTimeIST(value, false) : "[MISSING SWIPE]"; }
function CorrectionCard({ item, onPress }: { item: AttendanceCorrection; onPress: () => void }) { const original = item.attendance; return <TouchableOpacity style={styles.ticket} onPress={onPress} activeOpacity={0.75}><View style={styles.ticketTop}><Text style={styles.ticketId}>#CORR-{item.correctionId}</Text><Status value={item.status} /></View><Text style={styles.ticketDate}>{formatDateIST(`${item.correctionDate}T00:00:00.000Z`, "short")} • IST</Text><View style={styles.comparison}><Pair label="Original record" value={`In: ${time(original?.checkIn ?? null)} | Out: ${time(original?.checkOut ?? null)}`} /><Pair label="Proposed correction" value={`In: ${time(item.correctLoginTime)} | Out: ${time(item.correctLogoutTime)}`} /></View><Text numberOfLines={1} style={styles.reasonText}><Text style={styles.muted}>Reason: </Text>{item.reason}</Text><View style={styles.inspectRow}><Text style={styles.muted}>{item.status === "PENDING" ? "Awaiting review" : item.reviewer ? `Reviewed by ${displayName(item.reviewer)}` : "Review complete"}</Text><Text style={styles.inspect}>Inspect ›</Text></View></TouchableOpacity>; }
function Status({ value }: { value: AttendanceCorrection["status"] }) { return <View style={styles.status}><MaterialIcons name={value === "APPROVED" ? "check" : value === "REJECTED" ? "close" : "pending"} size={14} color={colors.text} /><Text style={styles.statusText}>{value}</Text></View>; }
function Pair({ label, value }: { label: string; value: string }) { return <View style={styles.pair}><Text style={styles.muted}>{label}:</Text><Text style={styles.pairValue}>{value}</Text></View>; }
function CorrectionInspector({ item, onClose }: { item: AttendanceCorrection | null; onClose: () => void }) { if (!item) return null; const original = item.attendance; return <Modal visible transparent animationType="slide" onRequestClose={onClose}><Pressable style={styles.overlay} onPress={onClose}><Pressable style={styles.sheet} onPress={() => {}}><View style={styles.sheetHeader}><View><Text style={styles.hint}>TICKET INSPECTOR</Text><Text style={styles.sheetTitle}>#CORR-{item.correctionId}</Text></View><TouchableOpacity style={styles.icon} onPress={onClose}><MaterialIcons name="close" size={21} color={colors.text} /></TouchableOpacity></View><View style={styles.statusBanner}><Status value={item.status} /><Text style={styles.hint}>IST VALIDATED</Text></View><Pair label="Attendance date" value={formatDateIST(`${item.correctionDate}T00:00:00.000Z`, "short")} /><Pair label="Correction type" value={item.correctionType} /><Text style={styles.sectionLabel}>TIMESTAMP RECONCILIATION</Text><View style={styles.comparison}><Pair label="Original ingress" value={time(original?.checkIn ?? null)} /><Pair label="Proposed ingress" value={time(item.correctLoginTime)} /><Pair label="Original egress" value={time(original?.checkOut ?? null)} /><Pair label="Proposed egress" value={time(item.correctLogoutTime)} /></View><Text style={styles.sectionLabel}>APPLICANT JUSTIFICATION</Text><Text selectable style={styles.justification}>{item.reason}</Text><Text style={styles.sectionLabel}>WORKFLOW AUDIT TRAIL</Text><Text style={styles.justification}>{item.reviewer ? `Reviewed by ${displayName(item.reviewer)}` : "Awaiting reviewer decision"}{item.reviewedAt ? ` • ${formatDateTimeIST(item.reviewedAt)}` : ""}{item.hrComments ? `\n${item.hrComments}` : ""}</Text><TouchableOpacity style={styles.reset} onPress={onClose}><Text style={styles.resetText}>Close Inspector</Text></TouchableOpacity></Pressable></Pressable></Modal>; }

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.surface }, content: { padding: 16, paddingBottom: 36, gap: 12 }, header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", height: 48 }, icon: { width: 44, height: 44, alignItems: "center", justifyContent: "center", borderRadius: 6 }, brand: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }, brandText: { backgroundColor: colors.primary, color: colors.onPrimary, fontSize: 11, fontWeight: "700", padding: 7, borderRadius: 6 }, brandTitle: { fontSize: 16, fontWeight: "600", color: colors.text }, profile: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" }, context: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, backText: { flexDirection: "row", alignItems: "center", gap: 4 }, backLabel: { color: colors.text, fontWeight: "500", fontSize: 12 }, istDot: { backgroundColor: colors.high, borderRadius: 4, padding: 6 }, dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary }, intro: { gap: 4, marginBottom: 4 }, title: { fontSize: 24, fontWeight: "700", color: colors.text }, subtitle: { fontSize: 14, lineHeight: 20, color: colors.variant }, formCard: { padding: 16, gap: 10, backgroundColor: colors.card, borderRadius: 6 }, formTitle: { fontSize: 17, fontWeight: "600", color: colors.text, marginBottom: 4 }, labelRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 2 }, label: { fontSize: 11, fontWeight: "700", color: colors.text, textTransform: "uppercase" }, hint: { fontSize: 10, fontWeight: "600", color: colors.variant, textTransform: "uppercase" }, inputWrap: { height: 48, paddingHorizontal: 12, backgroundColor: colors.low, borderRadius: 4, flexDirection: "row", alignItems: "center", gap: 8 }, input: { flex: 1, fontSize: 14, color: colors.text, paddingVertical: 0 }, typeRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 }, typeButton: { paddingHorizontal: 10, minHeight: 34, justifyContent: "center", borderRadius: 4, backgroundColor: colors.high }, typeButtonActive: { backgroundColor: colors.primary }, typeText: { color: colors.text, fontSize: 11, fontWeight: "600" }, typeTextActive: { color: colors.onPrimary }, times: { flexDirection: "row", gap: 10 }, timeField: { flex: 1, gap: 4 }, reason: { minHeight: 78, borderRadius: 4, backgroundColor: colors.low, padding: 12, fontSize: 14, color: colors.text }, submit: { height: 48, marginTop: 6, borderRadius: 4, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 }, submitText: { color: colors.onPrimary, fontSize: 14, fontWeight: "600" }, reset: { height: 44, borderRadius: 4, backgroundColor: colors.high, alignItems: "center", justifyContent: "center", marginTop: 2 }, resetText: { color: colors.text, fontSize: 14, fontWeight: "600" }, error: { color: colors.error, fontSize: 12 }, message: { color: colors.secondary, fontSize: 12 }, historyHeader: { marginTop: 8, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, historyTitle: { fontSize: 20, fontWeight: "700", color: colors.text }, entryCount: { fontSize: 10, fontWeight: "700", color: colors.variant }, filters: { gap: 8, paddingVertical: 2 }, filter: { height: 32, paddingHorizontal: 12, borderRadius: 4, backgroundColor: colors.high, justifyContent: "center" }, filterActive: { backgroundColor: colors.primary }, filterText: { fontSize: 12, fontWeight: "600", color: colors.text }, filterTextActive: { color: colors.onPrimary }, loader: { marginVertical: 28 }, empty: { textAlign: "center", padding: 24, color: colors.secondary }, ticket: { padding: 16, backgroundColor: colors.card, borderRadius: 4, gap: 9 }, ticketTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, ticketId: { fontSize: 17, color: colors.text, fontWeight: "600" }, status: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 7, paddingVertical: 4, borderRadius: 4, backgroundColor: colors.high }, statusText: { fontSize: 10, fontWeight: "700", color: colors.text }, ticketDate: { fontSize: 12, color: colors.variant }, comparison: { backgroundColor: colors.low, padding: 11, borderRadius: 4, gap: 7 }, pair: { flexDirection: "row", justifyContent: "space-between", gap: 12 }, muted: { fontSize: 12, color: colors.variant, flexShrink: 1 }, pairValue: { flex: 1, fontSize: 12, fontWeight: "600", color: colors.text, textAlign: "right" }, reasonText: { fontSize: 12, color: colors.text }, inspectRow: { borderTopWidth: 1, borderTopColor: colors.high, paddingTop: 9, flexDirection: "row", justifyContent: "space-between", gap: 8 }, inspect: { color: colors.text, fontSize: 12, fontWeight: "600" }, overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.35)", justifyContent: "flex-end" }, sheet: { backgroundColor: colors.card, borderTopLeftRadius: 12, borderTopRightRadius: 12, padding: 16, gap: 13, maxHeight: "90%" }, sheetHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, sheetTitle: { fontSize: 18, fontWeight: "600", color: colors.text }, statusBanner: { backgroundColor: colors.low, borderRadius: 4, padding: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, sectionLabel: { fontSize: 10, fontWeight: "700", color: colors.variant, marginTop: 2 }, justification: { backgroundColor: colors.low, borderRadius: 4, padding: 12, color: colors.text, fontSize: 12, lineHeight: 18 }, disabled: { opacity: 0.5 } });
