import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
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
import { addCalendarDaysIST, enumerateCivilRange, getTodayIST, isoWeekdayCivil } from "../utils/date";

type DaySession = "FULL_DAY" | "FIRST_HALF" | "SECOND_HALF";

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

function toCivil(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function formatLong(civil: string): string {
  const [year, month, day] = civil.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function weekdayName(civil: string): string {
  const [year, month, day] = civil.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-US", { weekday: "long" });
}

function monthTitle(year: number, month: number): string {
  return new Date(year, month, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

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
  const [waitingForTo, setWaitingForTo] = useState(false);
  const [viewMonth, setViewMonth] = useState(() => {
    const [year, month] = getTodayIST().split("-").map(Number);
    return { year, month: month - 1 };
  });

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
              if (!cancelled) setManagerName("—");
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

  const selectedDates = useMemo(
    () => enumerateCivilRange(fromDate, toDate).filter((date) => !isDateUnavailable(date)),
    [fromDate, toDate, today, maxDate, weeklyOffDow, holidayDates],
  );

  const cells = useMemo(() => {
    const first = new Date(viewMonth.year, viewMonth.month, 1);
    const startOffset = (first.getDay() + 6) % 7;
    const start = new Date(first);
    start.setDate(1 - startOffset);
    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      const civil = toCivil(date);
      const inRange = civil >= fromDate && civil <= toDate;
      return {
        civil,
        day: date.getDate(),
        inMonth: date.getMonth() === viewMonth.month,
        isWeekend: date.getDay() === 0 || date.getDay() === 6,
        isToday: civil === today,
        selected: inRange && !isDateUnavailable(civil),
        unavailable: isDateUnavailable(civil),
      };
    });
  }, [fromDate, toDate, today, maxDate, weeklyOffDow, holidayDates, viewMonth.month, viewMonth.year]);

  const selectedType = types.find((row) => row.leaveTypeId === leaveTypeId);
  const monthLabel = monthTitle(viewMonth.year, viewMonth.month);

  function pickMedicalFile() {
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
  }

  function selectCivil(civil: string) {
    if (isDateUnavailable(civil)) {
      setDialog({
        title: "Date not available",
        message: "Leave cannot include past dates, dates beyond the advance limit, weekly offs, or holidays.",
      });
      return;
    }
    if (!waitingForTo) {
      setFromDate(civil);
      setToDate(civil);
      setWaitingForTo(true);
      return;
    }
    if (civil < fromDate) {
      setFromDate(civil);
      setToDate(civil);
      return;
    }
    setToDate(civil);
    setWaitingForTo(false);
  }

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
      <WebCard style={styles.pageCard}>
        {loading ? <ActivityIndicator color={colors.primary} /> : null}
        <View style={styles.policyBanner}>
          <MaterialIcons name="verified-user" size={12} color={colors.secondary} />
          <Text style={styles.banner}>Advance booking limit: Max {maxAdvanceDays} calendar days forward. Approver — {managerName}</Text>
        </View>
        <View style={styles.applicant}>
          <UserAvatar employee={me} size={48} fallback="—" />
          <View>
            <Text style={styles.body}>{me ? displayName(me) : "—"}</Text>
            <Text style={styles.meta}>Department: {departmentName}</Text>
            <Text style={styles.meta}>Approver</Text>
            <Text style={styles.body}>{managerName}</Text>
          </View>
        </View>
        <Text style={styles.h}>Leave Type *</Text>
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

        <View style={styles.calendarHeaderRow}>
          <View style={styles.calendarTitleRow}>
            <MaterialIcons name="date-range" size={20} color={colors.primary} />
            <View>
              <Text style={styles.calendarTitle}>Leave Schedule & Calendar</Text>
              <Text style={styles.meta}>Today: {formatLong(today)}</Text>
            </View>
          </View>
          <View style={styles.monthBadge}>
            <Text style={styles.monthBadgeText}>{monthLabel.toUpperCase()}</Text>
          </View>
        </View>
        <View style={styles.calendarBox}>
          <View style={styles.calendarNav}>
            <Text style={styles.calendarMonthText}>{monthLabel}</Text>
            <View style={styles.calendarNavBtns}>
              <TouchableOpacity
                onPress={() =>
                  setViewMonth((current) => {
                    const date = new Date(current.year, current.month - 1, 1);
                    return { year: date.getFullYear(), month: date.getMonth() };
                  })
                }
              >
                <MaterialIcons name="chevron-left" size={18} color={colors.secondary} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() =>
                  setViewMonth((current) => {
                    const date = new Date(current.year, current.month + 1, 1);
                    return { year: date.getFullYear(), month: date.getMonth() };
                  })
                }
              >
                <MaterialIcons name="chevron-right" size={18} color={colors.secondary} />
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.calendarDaysRow}>
            {["M", "T", "W", "T", "F", "S", "S"].map((day, i) => (
              <Text key={`${day}-${i}`} style={[styles.calendarDayHeader, (i === 5 || i === 6) && styles.calendarDayHeaderWeekend]}>
                {day}
              </Text>
            ))}
          </View>
          <View style={styles.calendarGrid}>
            {cells.map((cell) => {
              if (!cell.inMonth || cell.unavailable) {
                return (
                  <View key={cell.civil} style={styles.calCell}>
                    <Text style={styles.calTextOff}>{pad2(cell.day)}</Text>
                  </View>
                );
              }
              const half = session === "FIRST_HALF" || session === "SECOND_HALF";
              if (cell.selected) {
                return (
                  <TouchableOpacity key={cell.civil} style={[styles.calCell, half ? styles.calSelHalf : styles.calSel]} onPress={() => selectCivil(cell.civil)}>
                    <Text style={half ? styles.calTextSelHalf : styles.calTextSel}>{pad2(cell.day)}</Text>
                  </TouchableOpacity>
                );
              }
              return (
                <TouchableOpacity key={cell.civil} style={styles.calCell} onPress={() => selectCivil(cell.civil)}>
                  <Text style={cell.isToday ? styles.calTextToday : cell.isWeekend ? styles.calTextWeekend : styles.calText}>{pad2(cell.day)}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <View style={styles.calendarLegend}>
            <TouchableOpacity style={styles.legendItem} onPress={() => setSession("FULL_DAY")}>
              <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
              <Text style={styles.meta}>Full Day Leave</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.legendItem} onPress={() => setSession("FIRST_HALF")}>
              <View style={[styles.legendDot, { backgroundColor: colors.secondaryFixedDim, borderWidth: 1, borderColor: colors.secondary }]} />
              <Text style={styles.meta}>Half Day Leave</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.dateRangeBox}>
          <View style={styles.dateRangeItem}>
            <Text style={styles.dateRangeLabel}>FROM (INCLUSIVE)</Text>
            <Text style={styles.body}>{fromDate ? formatLong(fromDate) : "Select date"}</Text>
            <Text style={styles.meta}>{fromDate ? weekdayName(fromDate) : ""}</Text>
          </View>
          <View style={styles.dateRangeItem}>
            <Text style={styles.dateRangeLabel}>TO (INCLUSIVE)</Text>
            <Text style={styles.body}>{toDate ? formatLong(toDate) : "Select date"}</Text>
            <Text style={styles.meta}>{toDate ? weekdayName(toDate) : ""}</Text>
          </View>
        </View>
        <Text style={styles.meta}>{selectedDates.length} selected working day{selectedDates.length === 1 ? "" : "s"}</Text>
        <Text style={styles.h}>Session</Text>
        <View style={styles.wrap}>
          {(["FULL_DAY", "FIRST_HALF", "SECOND_HALF"] as const).map((row) => (
            <TouchableOpacity key={row} style={session === row ? styles.chipOn : styles.chip} onPress={() => setSession(row)}>
              <Text style={session === row ? styles.chipOnText : styles.chipText}>{row.replaceAll("_", " ")}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.h}>Absence Justification</Text>
        <TextInput style={[styles.input, styles.area]} value={reason} onChangeText={setReason} multiline placeholder="Reason for leave" placeholderTextColor={colors.secondary} />
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
        <TouchableOpacity style={styles.uploadCard} onPress={pickMedicalFile}>
          <View style={styles.uploadTitleRow}>
            <MaterialIcons name="attachment" size={18} color={colors.primary} />
            <Text style={styles.h}>Medical Document Upload</Text>
          </View>
          <Text style={styles.meta}>
            {selectedType?.requiresMedicalDocument
              ? "This type may require a medical document. Tap to choose a local file."
              : "Medical upload applies only when the selected type requires a document."}
          </Text>
          <View style={styles.fileCard}>
            <View style={styles.fileIconBox}>
              <MaterialIcons name="picture-as-pdf" size={20} color={colors.onPrimary} />
            </View>
            <View>
              <Text style={styles.body}>{pickedFile?.name ?? "No file attached"}</Text>
              <Text style={styles.meta}>{pickedFile ? "Ready to upload with submit or draft" : "PDF, JPG, PNG"}</Text>
            </View>
          </View>
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
  pageCard: { width: "100%", gap: 14 },
  policyBanner: { flexDirection: "row", alignItems: "center", gap: 8 },
  banner: { fontSize: 13, color: colors.secondary, flex: 1 },
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
  h: { fontSize: 14, fontWeight: "700", color: colors.onSurface, marginTop: 4 },
  body: { fontSize: 15, color: colors.onSurface },
  meta: { fontSize: 12, color: colors.secondary },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, backgroundColor: colors.surfaceContainer },
  chipOn: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, backgroundColor: colors.accent },
  chipText: { fontSize: 12, fontWeight: "600", color: colors.onSurface },
  chipOnText: { fontSize: 12, fontWeight: "600", color: colors.onPrimary },
  input: { minHeight: 44, borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 10, color: colors.onSurface, backgroundColor: colors.surfaceContainerLow },
  area: { minHeight: 120, textAlignVertical: "top", paddingTop: 10 },
  err: { color: colors.error, fontSize: 13 },
  actions: { flexDirection: "row", gap: 10, marginTop: 8 },
  primary: { backgroundColor: colors.accent, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 12 },
  primaryText: { color: colors.onPrimary, fontWeight: "700" },
  secondary: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 12 },
  secondaryText: { fontWeight: "700", color: colors.onSurface },
  calendarHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderBottomWidth: 1, borderBottomColor: colors.surfaceContainer, paddingBottom: 8 },
  calendarTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  calendarTitle: { fontSize: 14, fontWeight: "500", color: colors.onSurface },
  monthBadge: { backgroundColor: colors.surfaceContainerHigh, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  monthBadgeText: { fontSize: 11, fontWeight: "600", color: colors.secondary },
  calendarBox: { backgroundColor: colors.surfaceContainerLow, padding: 12, borderRadius: 12, gap: 12 },
  calendarNav: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  calendarMonthText: { fontSize: 20, fontWeight: "600", color: colors.onSurface },
  calendarNavBtns: { flexDirection: "row", gap: 4 },
  calendarDaysRow: { flexDirection: "row", justifyContent: "space-between" },
  calendarDayHeader: { width: "14.28%", textAlign: "center", fontSize: 11, fontWeight: "600", color: colors.secondary },
  calendarDayHeaderWeekend: { color: colors.onSurfaceVariant },
  calendarGrid: { flexDirection: "row", flexWrap: "wrap" },
  calCell: { width: "14.28%", minHeight: 36, alignItems: "center", justifyContent: "center" },
  calTextOff: { fontSize: 12, color: "rgba(88, 95, 108, 0.4)" },
  calText: { fontSize: 12, color: colors.onSurface },
  calTextWeekend: { fontSize: 12, color: "rgba(88, 95, 108, 0.7)" },
  calTextToday: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: colors.primary, textAlign: "center", lineHeight: 24, fontSize: 12, fontWeight: "700", color: colors.primary },
  calSel: { backgroundColor: colors.primary, borderRadius: 16 },
  calSelHalf: { backgroundColor: colors.secondaryFixedDim, borderRadius: 16 },
  calTextSel: { color: colors.onPrimary, fontSize: 12, fontWeight: "500" },
  calTextSelHalf: { color: colors.onSurface, fontSize: 12, fontWeight: "500" },
  calendarLegend: { flexDirection: "row", gap: 16, paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.surfaceContainer },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 8 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  dateRangeBox: { flexDirection: "row", gap: 16 },
  dateRangeItem: { flex: 1, gap: 4 },
  dateRangeLabel: { fontSize: 11, fontWeight: "700", color: colors.secondary },
  uploadCard: { gap: 8, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: colors.glassBorder, backgroundColor: colors.surfaceContainerLow },
  uploadTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  fileCard: { flexDirection: "row", alignItems: "center", gap: 12, padding: 10, borderRadius: 8, backgroundColor: colors.surfaceContainerLowest },
  fileIconBox: { width: 36, height: 36, borderRadius: 8, backgroundColor: colors.accent, alignItems: "center", justifyContent: "center" },
});
