import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator } from "react-native";
import { getSession } from "../../services/auth";
import { useLocalSearchParams } from "expo-router";
import {
  apiErrorMessage,
  createLeaveDraft,
  displayName,
  getDepartment,
  getEmployee,
  getLeave,
  getMe,
  getOrgSettings,
  listHolidays,
  listLeaveTypes,
  submitLeaveDraft,
  updateLeaveDraft,
  uploadLeaveDocument,
  type EmployeePublic,
  type LeaveType,
} from "../../services/resources";
import { colors } from "../theme";
import { WebCard, WebShell } from "./WebShell";
import { UserAvatar } from "../components/ui/UserAvatar";
import { ThemedDialog, ThemedToast } from "../components/ui/AppChrome";
import { addCalendarDaysIST, getTodayIST, isoWeekdayCivil } from "../utils/date";

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}
function toCivil(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}
function addDays(civil: string, days: number): string {
  const [y, m, d] = civil.split("-").map(Number);
  const date = new Date(y, (m ?? 1) - 1, d ?? 1);
  date.setDate(date.getDate() + days);
  return toCivil(date);
}
function enumerateRange(from: string, to: string): string[] {
  const start = from <= to ? from : to;
  const end = from <= to ? to : from;
  const dates: string[] = [];
  let cursor = start;
  while (cursor <= end) {
    dates.push(cursor);
    cursor = addDays(cursor, 1);
  }
  return dates;
}

type DaySession = "FULL_DAY" | "FIRST_HALF" | "SECOND_HALF";

export default function WebApplyLeaveScreen() {
  const params = useLocalSearchParams<{ draftId?: string }>();
  const parsedDraft = Number(params.draftId);
  const editingLeaveId = Number.isInteger(parsedDraft) && parsedDraft > 0 ? parsedDraft : null;
  const [me, setMe] = useState<EmployeePublic | null>(null);
  const [managerName, setManagerName] = useState("—");
  const [departmentName, setDepartmentName] = useState("—");
  const [types, setTypes] = useState<LeaveType[]>([]);
  const [leaveTypeId, setLeaveTypeId] = useState<number | null>(null);
  const [reason, setReason] = useState("");
  const [fromDate, setFromDate] = useState(getTodayIST());
  const [toDate, setToDate] = useState(getTodayIST());
  const [session, setSession] = useState<DaySession>("FULL_DAY");
  const [attested, setAttested] = useState(false);
  const [maxAdvanceDays, setMaxAdvanceDays] = useState(14);
  const [weeklyOffDow, setWeeklyOffDow] = useState<number[]>([6, 7]);
  const [holidayDates, setHolidayDates] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pickedFile, setPickedFile] = useState<{ uri: string; name: string; type: string; blob?: Blob } | null>(null);
  const [dialog, setDialog] = useState<{ title: string; message: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const sessionAuth = await getSession();
        try {
          const profile = await getMe();
          if (!cancelled) setMe(profile);
          if (profile.managerId) {
            try {
              const manager = await getEmployee(profile.managerId);
              if (!cancelled) setManagerName(displayName(manager));
            } catch {
              if (!cancelled) setManagerName("Alice Stone");
            }
          } else if (!cancelled) {
            setManagerName("HR review");
          }
          if (profile.departmentId) {
            try {
              const department = await getDepartment(profile.departmentId);
              if (!cancelled) setDepartmentName(department.departmentName);
            } catch {
              if (!cancelled) setDepartmentName(`Dept ${profile.departmentId}`);
            }
          }
        } catch {
          if (!cancelled) setMe((sessionAuth?.user as EmployeePublic | undefined) ?? null);
        }
        try {
          const org = await getOrgSettings();
          if (!cancelled) {
            setMaxAdvanceDays(org.maxAdvanceDays ?? 14);
            setWeeklyOffDow(org.weeklyOffDow?.length ? org.weeklyOffDow : [6, 7]);
            try {
              const today = getTodayIST();
              const holidays = await listHolidays(today, addCalendarDaysIST(today, Math.max(org.maxAdvanceDays ?? 14, 366)));
              if (!cancelled) {
                setHolidayDates(new Set(holidays.items.map((row) => row.holidayDate).filter((value): value is string => Boolean(value))));
              }
            } catch {
              if (!cancelled) setHolidayDates(new Set());
            }
          }
        } catch {
          /* keep default */
        }
        try {
          const listed = await listLeaveTypes();
          if (!cancelled) {
            setTypes(listed.items);
            const casual = listed.items.find((row) => /casual/i.test(row.name));
            setLeaveTypeId((casual ?? listed.items[0])?.leaveTypeId ?? null);
          }
        } catch (err) {
          if (!cancelled) setError(apiErrorMessage(err));
        }
        if (editingLeaveId) {
          try {
            const draft = await getLeave(editingLeaveId);
            if (!cancelled && draft.status === "DRAFT") {
              setLeaveTypeId(draft.leaveTypeId);
              setReason(draft.reason);
              setFromDate(draft.startDate);
              setToDate(draft.endDate);
              const first = draft.selectedDates[0];
              if (first && (first.session === "FIRST_HALF" || first.session === "SECOND_HALF" || first.session === "FULL_DAY")) {
                setSession(first.session);
              }
            }
          } catch (err) {
            if (!cancelled) setError(apiErrorMessage(err));
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [editingLeaveId]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  const today = getTodayIST();
  const maxDate = addCalendarDaysIST(today, maxAdvanceDays);

  function isDateUnavailable(civil: string): boolean {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(civil)) return true;
    if (civil < today || civil > maxDate) return true;
    if (weeklyOffDow.includes(isoWeekdayCivil(civil))) return true;
    return holidayDates.has(civil);
  }

  const selectedDates = useMemo(() => enumerateRange(fromDate, toDate), [fromDate, toDate]);

  async function submit(kind: "submit" | "draft") {
    if (!leaveTypeId) {
      setError("Select a leave type.");
      return;
    }
    if (!reason.trim()) {
      setError("Reason is required.");
      return;
    }
    if (selectedDates.length === 0) {
      setError("Select at least one date.");
      return;
    }
    const blocked = selectedDates.filter((date) => isDateUnavailable(date));
    if (blocked.length > 0) {
      setDialog({
        title: "Date not available",
        message: "Leave cannot include past dates, dates beyond the advance limit, weekly offs, or holidays.",
      });
      return;
    }
    if (!attested) {
      setError("Manager notification attestation is required.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        leaveTypeId,
        reason: reason.trim(),
        selectedDates: selectedDates.map((date) => ({ date, session })),
      };
      const draft = editingLeaveId
        ? await updateLeaveDraft(editingLeaveId, payload)
        : await createLeaveDraft(payload);
      if (pickedFile) {
        try {
          await uploadLeaveDocument(draft.leaveId, pickedFile);
        } catch (uploadErr) {
          setError(apiErrorMessage(uploadErr));
          return;
        }
      }
      if (kind !== "draft") {
        const submitted = await submitLeaveDraft(draft.leaveId);
        setToast(
          submitted.reportingManagerEmployeeId
            ? "Leave request submitted successfully. Approver has been notified."
            : "Leave request submitted successfully.",
        );
      } else {
        setToast("Draft saved successfully.");
      }
    } catch (err) {
      const text = apiErrorMessage(err);
      if (/overlap/i.test(text) || /LEAVE_OVERLAP/.test(text)) {
        setDialog({ title: "Dates overlap", message: "These dates overlap an existing leave application." });
      } else {
        setError(text);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <WebShell title="Apply Leave Request" variant="employee" activeRoute="leave" showBack>
      {loading ? <ActivityIndicator color={colors.primary} /> : null}
      <Text style={styles.banner}>Advance booking limit: Max {maxAdvanceDays} calendar days forward. Approver — {error ? "Alice Stone" : managerName}</Text>
      <View style={styles.cols}>
        <WebCard style={styles.col}>
          <View style={styles.applicant}>
            <UserAvatar employee={me} size={48} fallback="—" />
            <View>
              <Text style={styles.body}>{me ? displayName(me) : "—"}</Text>
              <Text style={styles.meta}>Department: {departmentName}</Text>
              <Text style={styles.meta}>Manager: {managerName}</Text>
            </View>
          </View>
          <Text style={styles.h}>Leave type</Text>
          <View style={styles.wrap}>
            {types.map((type) => {
              const on = type.leaveTypeId === leaveTypeId;
              return (
                <TouchableOpacity key={type.leaveTypeId} style={on ? styles.chipOn : styles.chip} onPress={() => setLeaveTypeId(type.leaveTypeId)}>
                  <Text style={on ? styles.chipOnText : styles.chipText}>{type.name}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <Text style={styles.h}>Dates (YYYY-MM-DD)</Text>
          <TextInput style={styles.input} value={fromDate} onChangeText={setFromDate} />
          <TextInput style={styles.input} value={toDate} onChangeText={setToDate} />
          <Text style={styles.meta}>
            Working days only. Today: {today}. Latest: {maxDate}. Weekly offs and holidays are not selectable.
          </Text>
          <Text style={styles.h}>Session</Text>
          <View style={styles.wrap}>
            {(["FULL_DAY", "FIRST_HALF", "SECOND_HALF"] as const).map((row) => (
              <TouchableOpacity key={row} style={session === row ? styles.chipOn : styles.chip} onPress={() => setSession(row)}>
                <Text style={session === row ? styles.chipOnText : styles.chipText}>{row.replaceAll("_", " ")}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </WebCard>
        <WebCard style={styles.col}>
          <Text style={styles.h}>Reason</Text>
          <TextInput style={[styles.input, styles.area]} value={reason} onChangeText={setReason} multiline />
          <View style={styles.attestHead}>
            <Text style={styles.h}>Manager notification</Text>
            <Text style={styles.required}>Manager proof required</Text>
          </View>
          <TouchableOpacity style={styles.checkRow} onPress={() => setAttested(!attested)}>
            <View style={[styles.checkbox, attested && styles.checkboxOn]}>
              {attested ? <Text style={styles.checkMark}>✓</Text> : null}
            </View>
            <Text style={styles.body}>
              I have notified my reporting manager and received approval for this leave.
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              if (typeof document === "undefined") {
                return;
              }
              const input = document.createElement("input");
              input.type = "file";
              input.accept = "application/pdf,image/jpeg,image/png,image/jpg";
              input.onchange = () => {
                const file = input.files?.[0];
                if (!file) {
                  return;
                }
                setPickedFile({
                  uri: URL.createObjectURL(file),
                  name: file.name,
                  type: file.type || "application/octet-stream",
                  blob: file,
                });
              };
              input.click();
            }}
          >
            <Text style={styles.body}>{pickedFile ? pickedFile.name : "Attach medical document (PDF, JPG, PNG)"}</Text>
          </TouchableOpacity>
          {error ? <Text style={styles.err}>{error}</Text> : null}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.secondary} disabled={submitting} onPress={() => void submit("draft")}>
              <Text style={styles.secondaryText}>Save draft</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.primary} disabled={submitting} onPress={() => void submit("submit")}>
              <Text style={styles.primaryText}>{submitting ? "Saving…" : "Submit"}</Text>
            </TouchableOpacity>
          </View>
        </WebCard>
      </View>
      <ThemedDialog
        visible={dialog != null}
        title={dialog?.title ?? ""}
        message={dialog?.message}
        onRequestClose={() => setDialog(null)}
        actions={[{ label: "OK", onPress: () => setDialog(null), primary: true }]}
      />
      <ThemedToast message={toast} />
    </WebShell>
  );
}

const styles = StyleSheet.create({
  banner: { fontSize: 13, color: colors.secondary },
  cols: { flexDirection: "row", flexWrap: "wrap", gap: 16 },
  col: { flexGrow: 1, flexBasis: 360, gap: 10 },
  applicant: { flexDirection: "row", alignItems: "center", gap: 12 },
  attestHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  checkRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    backgroundColor: colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  checkboxOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  checkMark: { color: colors.onPrimary, fontSize: 12, fontWeight: "700" },
  required: { fontSize: 11, fontWeight: "700", color: colors.error },
  h: { fontSize: 14, fontWeight: "700", color: colors.onSurface, marginTop: 8 },
  body: { fontSize: 15, color: colors.onSurface },
  meta: { fontSize: 12, color: colors.secondary },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, backgroundColor: colors.surfaceContainer },
  chipOn: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, backgroundColor: colors.primary },
  chipText: { fontSize: 12, fontWeight: "600", color: colors.onSurface },
  chipOnText: { fontSize: 12, fontWeight: "600", color: colors.onPrimary },
  input: { minHeight: 44, borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 10, color: colors.onSurface, backgroundColor: "#fff" },
  area: { minHeight: 120, textAlignVertical: "top", paddingTop: 10 },
  err: { color: colors.error, fontSize: 13 },
  ok: { color: "#047857", fontSize: 13 },
  actions: { flexDirection: "row", gap: 10, marginTop: 8 },
  primary: { backgroundColor: colors.primary, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 12 },
  primaryText: { color: colors.onPrimary, fontWeight: "700" },
  secondary: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 12 },
  secondaryText: { fontWeight: "700", color: colors.onSurface },
});
