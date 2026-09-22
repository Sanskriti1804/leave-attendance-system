import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
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
import { WebShell } from "./WebShell";
import { UserAvatar } from "../components/ui/UserAvatar";
import { ThemedDialog, ThemedToast } from "../components/ui/AppChrome";
import { addCalendarDaysIST, enumerateCivilRange, getTodayIST, isoWeekdayCivil } from "../utils/date";

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

function toCivil(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function parseCivil(civil: string): Date {
  const [y, m, d] = civil.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

function formatLong(civil: string): string {
  return parseCivil(civil).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function weekdayName(civil: string): string {
  return parseCivil(civil).toLocaleDateString(undefined, { weekday: "long" });
}

function iconForLeaveType(name: string): "medical-services" | "beach-access" | "money-off" | "event-available" {
  const lower = name.toLowerCase();
  if (lower.includes("sick") || lower.includes("medical")) return "medical-services";
  if (lower.includes("planned") || lower.includes("annual")) return "beach-access";
  if (lower.includes("emergency")) return "money-off";
  return "event-available";
}

type DaySession = "FULL_DAY" | "FIRST_HALF" | "SECOND_HALF";
type DurationMode = "FULL" | "HALF";

function sessionForMode(mode: DurationMode, half: DaySession = "FIRST_HALF"): DaySession {
  return mode === "HALF" ? half : "FULL_DAY";
}

export default function WebApplyLeaveScreen() {
  const params = useLocalSearchParams<{ draftId?: string }>();
  const draftId = Number(params.draftId);
  const editingLeaveId = Number.isInteger(draftId) && draftId > 0 ? draftId : null;
  const [me, setMe] = useState<EmployeePublic | null>(null);
  const [managerName, setManagerName] = useState("—");
  const [departmentName, setDepartmentName] = useState("—");
  const [types, setTypes] = useState<LeaveType[]>([]);
  const [leaveTypeId, setLeaveTypeId] = useState<number | null>(null);
  const [reason, setReason] = useState("");
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [dateSessions, setDateSessions] = useState<Record<string, DaySession>>({});
  const [dateOverrides, setDateOverrides] = useState<Record<string, true>>({});
  const [durationMode, setDurationMode] = useState<DurationMode>("FULL");
  const [waitingForTo, setWaitingForTo] = useState(false);
  const [rangeAnchor, setRangeAnchor] = useState<string | null>(null);
  const [sessionDialog, setSessionDialog] = useState<{ civil: string; step: "mode" | "half" } | null>(null);
  const [durationInfoOpen, setDurationInfoOpen] = useState(false);
  const [attested, setAttested] = useState(false);
  const [dateBlock, setDateBlock] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [viewMonth, setViewMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [maxAdvanceDays, setMaxAdvanceDays] = useState(14);
  const [weeklyOffDow, setWeeklyOffDow] = useState<number[]>([6, 7]);
  const [holidayDates, setHolidayDates] = useState<Set<string>>(new Set());
  const [holidayNames, setHolidayNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pickedFile, setPickedFile] = useState<{ uri: string; name: string; type: string; blob?: Blob } | null>(null);

  const today = useMemo(() => getTodayIST(), []);
  const maxDate = addCalendarDaysIST(today, maxAdvanceDays);

  const load = useCallback(async (signal?: { cancelled: boolean }) => {
    setLoading(true);
    setError(null);
    try {
      const [session, leaveTypes, settings] = await Promise.all([
        getSession(),
        listLeaveTypes(),
        getOrgSettings(),
      ]);
      if (signal?.cancelled) return;
      setMaxAdvanceDays(settings.maxAdvanceDays);
      setWeeklyOffDow(settings.weeklyOffDow?.length ? settings.weeklyOffDow : [6, 7]);
      try {
        const holidays = await listHolidays(today, addCalendarDaysIST(today, Math.max(settings.maxAdvanceDays, 366)));
        if (!signal?.cancelled) {
          const names: Record<string, string> = {};
          const dates = new Set<string>();
          for (const row of holidays.items) {
            if (!row.holidayDate) continue;
            dates.add(row.holidayDate);
            names[row.holidayDate] = row.holidayName;
          }
          setHolidayDates(dates);
          setHolidayNames(names);
        }
      } catch {
        if (!signal?.cancelled) setHolidayDates(new Set());
      }
      if (signal?.cancelled) return;
      const resolvedTypes = leaveTypes.items;
      setTypes(resolvedTypes);
      const casual = resolvedTypes.find((row) => /casual/i.test(row.name));
      setLeaveTypeId((casual ?? resolvedTypes[0])?.leaveTypeId ?? null);

      let profile = session?.user as EmployeePublic | undefined;
      try {
        profile = await getMe();
      } catch {
        /* keep session user */
      }
      if (signal?.cancelled) return;
      if (profile) {
        setMe(profile);
        if (profile.departmentId) {
          try {
            const department = await getDepartment(profile.departmentId);
            if (!signal?.cancelled) setDepartmentName(department.departmentName);
          } catch {
            if (!signal?.cancelled) setDepartmentName("—");
          }
        }
        if (profile.managerId) {
          try {
            const manager = await getEmployee(profile.managerId);
            if (!signal?.cancelled) setManagerName(displayName(manager));
          } catch {
            if (!signal?.cancelled) setManagerName("—");
          }
        } else {
          setManagerName("HR review");
        }
      }
      if (editingLeaveId) {
        try {
          const draft = await getLeave(editingLeaveId);
          if (signal?.cancelled) return;
          if (draft.status === "DRAFT") {
            setLeaveTypeId(draft.leaveTypeId);
            setReason(draft.reason);
            const dates = draft.selectedDates.map((row) => row.date).sort();
            setSelectedDates(dates);
            setDateSessions(Object.fromEntries(draft.selectedDates.map((row) => [row.date, row.session as DaySession])));
            const first = draft.selectedDates[0];
            setDurationMode(first && first.session !== "FULL_DAY" ? "HALF" : "FULL");
            setRangeAnchor(dates[0] ?? null);
            setWaitingForTo(dates.length <= 1);
          }
        } catch {
          if (!signal?.cancelled) setToast("Unable to load this draft.");
        }
      }
    } catch (err) {
      if (!signal?.cancelled) setError(apiErrorMessage(err));
    } finally {
      if (!signal?.cancelled) setLoading(false);
    }
  }, [today, editingLeaveId]);

  useEffect(() => {
    const signal = { cancelled: false };
    void load(signal);
    return () => {
      signal.cancelled = true;
    };
  }, [load]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  function dateUnavailableReason(civil: string): string | null {
    if (holidayDates.has(civil)) {
      const name = holidayNames[civil];
      return name ? `This date is an organization holiday (${name}).` : "This date is an organization holiday.";
    }
    if (weeklyOffDow.includes(isoWeekdayCivil(civil))) {
      const dow = isoWeekdayCivil(civil);
      if (dow === 6 || dow === 7) return "This date cannot be selected because it is a weekend.";
      return "This date cannot be selected because it is a weekly off.";
    }
    if (civil < today) return "This date cannot be selected because it is in the past.";
    if (civil > maxDate) return `Leave can only be applied up to ${maxAdvanceDays} days in advance.`;
    return null;
  }

  function isDateUnavailable(civil: string): boolean {
    return dateUnavailableReason(civil) != null;
  }

  const cells = useMemo(() => {
    const first = new Date(viewMonth.year, viewMonth.month, 1);
    const startOffset = (first.getDay() + 6) % 7;
    const start = new Date(first);
    start.setDate(1 - startOffset);
    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      const civil = toCivil(date);
      const dow = date.getDay();
      return {
        civil,
        day: date.getDate(),
        inMonth: date.getMonth() === viewMonth.month,
        isWeekend: dow === 0 || dow === 6,
        isToday: civil === today,
        selected: selectedDates.includes(civil),
        unavailable: isDateUnavailable(civil),
      };
    });
  }, [holidayDates, maxDate, selectedDates, today, viewMonth.month, viewMonth.year, weeklyOffDow]);

  const sortedDates = useMemo(() => [...selectedDates].sort(), [selectedDates]);
  const fromDate = sortedDates[0];
  const toDate = waitingForTo ? undefined : sortedDates[sortedDates.length - 1];
  const selectedType = types.find((row) => row.leaveTypeId === leaveTypeId);
  const leaveDayCount = sortedDates.reduce(
    (sum, date) => sum + (dateSessions[date] === "FIRST_HALF" || dateSessions[date] === "SECOND_HALF" ? 0.5 : 1),
    0,
  );
  const monthLabel = new Date(viewMonth.year, viewMonth.month, 1).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  function applyDurationMode(mode: DurationMode, half: DaySession = "FIRST_HALF") {
    setDurationMode(mode);
    const session = sessionForMode(mode, half);
    setDateSessions((current) => {
      const next = { ...current };
      for (const date of selectedDates) {
        if (!dateOverrides[date]) next[date] = session;
      }
      return next;
    });
  }

  function requestHalfDayMode() {
    Alert.alert("Half Day", "Choose First Half or Second Half", [
      { text: "First Half", onPress: () => applyDurationMode("HALF", "FIRST_HALF") },
      { text: "Second Half", onPress: () => applyDurationMode("HALF", "SECOND_HALF") },
      { text: "Cancel", style: "cancel" },
    ]);
  }

  function pickMedicalFile() {
    if (typeof document === "undefined") return;
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/pdf,image/jpeg,image/png,image/jpg";
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      setPickedFile({
        uri: URL.createObjectURL(file),
        name: file.name,
        type: file.type || "application/octet-stream",
        blob: file,
      });
    };
    input.click();
  }

  function setDateSession(civil: string, session: DaySession) {
    setDateSessions((current) => ({ ...current, [civil]: session }));
    setDateOverrides((current) => ({ ...current, [civil]: true }));
  }

  function applyRange(from: string, to: string) {
    const session = durationMode === "HALF" ? "FIRST_HALF" : "FULL_DAY";
    const range = enumerateCivilRange(from, to).filter((date) => date === from || date === to || !isDateUnavailable(date));
    const selectable = range.filter((date) => !isDateUnavailable(date));
    setSelectedDates(selectable);
    setDateSessions((current) => {
      const next = { ...current };
      for (const date of selectable) {
        if (!dateOverrides[date]) next[date] = current[date] ?? session;
      }
      return next;
    });
    setWaitingForTo(false);
  }

  function openDateSessionMenu(civil: string) {
    const blocked = dateUnavailableReason(civil);
    if (blocked) {
      setDateBlock(blocked);
      return;
    }
    if (!selectedDates.includes(civil)) {
      setSelectedDates((current) => [...current, civil].sort());
      setDateSessions((current) => ({ ...current, [civil]: "FULL_DAY" }));
    }
    setSessionDialog({ civil, step: "mode" });
  }

  function toggleDate(civil: string) {
    const blocked = dateUnavailableReason(civil);
    if (blocked) {
      setDateBlock(blocked);
      return;
    }
    setDateBlock(null);
    if (selectedDates.includes(civil)) {
      setSelectedDates((current) => current.filter((date) => date !== civil));
      setDateSessions((current) => {
        const next = { ...current };
        delete next[civil];
        return next;
      });
      setDateOverrides((current) => {
        const next = { ...current };
        delete next[civil];
        return next;
      });
      if (rangeAnchor === civil) {
        setRangeAnchor(null);
        setWaitingForTo(false);
      }
      return;
    }
    if (rangeAnchor) {
      applyRange(rangeAnchor, civil);
      return;
    }
    setSelectedDates([civil]);
    setDateSessions((current) => ({ ...current, [civil]: current[civil] ?? "FULL_DAY" }));
    setRangeAnchor(civil);
    setWaitingForTo(true);
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
    if (sortedDates.length === 0) {
      setError("Select at least one date.");
      return;
    }
    const blocked = sortedDates.filter((date) => isDateUnavailable(date));
    if (blocked.length > 0) {
      setToast("Leave cannot include past dates, dates beyond the advance limit, weekly offs, or holidays.");
      return;
    }
    if (!attested) {
      setError("Manager notification attestation is required.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const body = {
      leaveTypeId,
      reason: reason.trim(),
      selectedDates: sortedDates.map((date) => ({ date, session: dateSessions[date] ?? "FULL_DAY" })),
    };
    try {
      const result = editingLeaveId ? await updateLeaveDraft(editingLeaveId, body) : await createLeaveDraft(body);
      if (pickedFile) {
        try {
          await uploadLeaveDocument(result.leaveId, pickedFile);
        } catch (uploadErr) {
          setToast(apiErrorMessage(uploadErr));
          return;
        }
      }
      const submitted = kind === "draft" ? result : await submitLeaveDraft(result.leaveId);
      setToast(
        kind === "draft"
          ? "Draft saved successfully."
          : submitted.reportingManagerEmployeeId
            ? "Leave request submitted successfully. Approver has been notified."
            : "Leave request submitted successfully.",
      );
    } catch (err) {
      const text = apiErrorMessage(err);
      if (/overlap/i.test(text) || /LEAVE_OVERLAP/.test(text)) {
        setToast("These dates overlap an existing leave application.");
      } else {
        setToast(text);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <WebShell title="Apply Leave Request" variant="employee" activeRoute="leave" showBack>
      <View style={styles.page}>
        <View style={styles.policyBanner}>
          <MaterialIcons name="verified-user" size={12} color={colors.secondary} />
          <Text style={styles.policyText}>Advance booking limit: Max {maxAdvanceDays} calendar days forward.</Text>
        </View>

        <View style={styles.empCard}>
          <View style={styles.empCardRow}>
            <View style={styles.empInfoLeft}>
              <UserAvatar employee={me} size={40} fallback={me ? `${(me.firstName?.[0] ?? displayName(me)[0] ?? "?").toUpperCase()}${(me.lastName?.[0] ?? "").toUpperCase()}` : "?"} />
              <View style={{ flex: 1 }}>
                <Text style={styles.empName}>{loading ? "—" : displayName(me)}</Text>
                <Text style={styles.empRole}>{departmentName}</Text>
                <Text style={styles.approverLabel}>Approver</Text>
                <Text style={styles.approverName}>{managerName}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.formSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Leave Type <Text style={styles.requiredStar}>*</Text>
            </Text>
          </View>
          <View style={styles.leaveTypeGrid}>
            {types.length === 0 && !loading ? <Text style={styles.policyText}>No leave types available.</Text> : null}
            {types.map((type) => {
              const active = type.leaveTypeId === leaveTypeId;
              return (
                <TouchableOpacity
                  key={type.leaveTypeId}
                  style={active ? styles.leaveTypeItemActive : styles.leaveTypeItem}
                  onPress={() => setLeaveTypeId(type.leaveTypeId)}
                >
                  <View style={styles.leaveTypeIconRow}>
                    <MaterialIcons name={iconForLeaveType(type.name)} size={18} color={active ? colors.onPrimary : colors.secondary} />
                    {active ? <MaterialIcons name="check-circle" size={16} color={colors.onPrimary} /> : <View style={styles.radioDot} />}
                  </View>
                  <Text style={active ? styles.leaveTypeTextActive : styles.leaveTypeText}>{type.name}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.calendarCard}>
          <View style={styles.calendarHeaderRow}>
            <View style={styles.calendarTitleRow}>
              <MaterialIcons name="date-range" size={20} color={colors.primary} />
              <View>
                <Text style={styles.calendarTitle}>Leave Schedule & Calendar</Text>
                <Text style={styles.calendarSubtitle}>Today: {formatLong(today)}</Text>
              </View>
            </View>
            <View style={styles.monthBadge}>
              <Text style={styles.monthBadgeText}>{monthLabel.toUpperCase()}</Text>
            </View>
          </View>
          <View style={styles.calendarBox}>
            <View style={styles.calendarNav}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Text style={styles.calendarMonthText}>{monthLabel}</Text>
                <TouchableOpacity style={styles.infoDot} onPress={() => setDurationInfoOpen(true)}>
                  <MaterialIcons name="info-outline" size={12} color="rgba(88,95,108,0.45)" />
                </TouchableOpacity>
              </View>
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
                      <Text style={styles.calTextOff} numberOfLines={1}>
                        {pad2(cell.day)}
                      </Text>
                    </View>
                  );
                }
                const isHalf = dateSessions[cell.civil] === "FIRST_HALF" || dateSessions[cell.civil] === "SECOND_HALF";
                if (cell.selected) {
                  return (
                    <TouchableOpacity
                      key={cell.civil}
                      style={[styles.calCell, isHalf ? styles.calTextSelHalf : styles.calTextSelMid]}
                      onPress={() => toggleDate(cell.civil)}
                      onLongPress={() => openDateSessionMenu(cell.civil)}
                      delayLongPress={400}
                    >
                      <Text style={isHalf ? styles.calTextSelHalfStr : styles.calTextSelStr} numberOfLines={1}>
                        {pad2(cell.day)}
                      </Text>
                      {isHalf ? (
                        <View
                          style={[
                            styles.halfDot,
                            {
                              backgroundColor:
                                dateSessions[cell.civil] === "SECOND_HALF" ? colors.sessionSecondHalf : colors.sessionFirstHalf,
                            },
                          ]}
                        />
                      ) : null}
                    </TouchableOpacity>
                  );
                }
                return (
                  <TouchableOpacity
                    key={cell.civil}
                    style={styles.calCell}
                    onPress={() => toggleDate(cell.civil)}
                    onLongPress={() => openDateSessionMenu(cell.civil)}
                    delayLongPress={400}
                  >
                    <Text
                      style={cell.isToday ? styles.calTextTodayStr : cell.isWeekend ? styles.calTextWeekend : styles.calText}
                      numberOfLines={1}
                    >
                      {pad2(cell.day)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <View style={styles.calendarLegend}>
              <TouchableOpacity style={styles.legendItem} onPress={() => applyDurationMode("FULL")}>
                <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
                <Text style={styles.legendText}>Full Day Leave</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.legendItem} onPress={requestHalfDayMode}>
                <View style={[styles.legendDot, { backgroundColor: colors.secondaryFixedDim, borderColor: colors.secondary, borderWidth: 1 }]} />
                <Text style={styles.legendText}>Half Day Leave</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.dateRangeBox}>
            <View style={styles.dateRangeItem}>
              <Text style={styles.dateRangeLabel}>FROM (INCLUSIVE)</Text>
              <Text style={styles.dateRangeVal}>{fromDate ? formatLong(fromDate) : "Select date"}</Text>
              <Text style={styles.dateRangeDay}>{fromDate ? weekdayName(fromDate) : ""}</Text>
            </View>
            <View style={styles.dateRangeItem}>
              <Text style={styles.dateRangeLabel}>TO (INCLUSIVE)</Text>
              <Text style={styles.dateRangeVal}>{toDate ? formatLong(toDate) : "Select date"}</Text>
              <Text style={styles.dateRangeDay}>{toDate ? weekdayName(toDate) : ""}</Text>
            </View>
          </View>
          <View style={styles.durationResult}>
            <View>
              <Text style={styles.durationTitle}>
                {sortedDates.length} Selected Day{sortedDates.length === 1 ? "" : "s"}
              </Text>
              <Text style={styles.durationSubtitle}>
                {fromDate && toDate
                  ? `${formatLong(fromDate)} to ${formatLong(toDate)}`
                  : fromDate
                    ? `${formatLong(fromDate)} to Select date`
                    : "Tap calendar days"}
              </Text>
            </View>
            <View style={styles.durationBadge}>
              <Text style={styles.durationBadgeText}>{leaveDayCount.toFixed(1)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.reasonCard}>
          <Text style={styles.reasonTitle}>Absence Justification</Text>
          <TextInput
            style={styles.reasonInput}
            multiline
            numberOfLines={3}
            value={reason}
            onChangeText={setReason}
            maxLength={500}
            placeholder="Reason for leave"
            placeholderTextColor={colors.secondary}
          />
          <Text style={styles.charCount}>{reason.length} / 500</Text>
        </View>

        <TouchableOpacity style={styles.uploadCard} onPress={pickMedicalFile} activeOpacity={0.8}>
          <View style={styles.uploadHeader}>
            <View style={styles.uploadTitleRow}>
              <MaterialIcons name="attachment" size={18} color={colors.primary} />
              <Text style={styles.uploadTitle}>Medical Document Upload</Text>
            </View>
            <Text style={styles.uploadSubtitle}>
              {selectedType?.requiresMedicalDocument
                ? "This type may require a medical document. Tap to choose a local file."
                : "Medical upload applies only when the selected type requires a document."}
            </Text>
          </View>
          <View style={styles.fileCard}>
            <View style={styles.fileInfo}>
              <View style={styles.fileIconBox}>
                <MaterialIcons name="picture-as-pdf" size={20} color={colors.onPrimary} />
              </View>
              <View>
                <Text style={styles.fileName}>{pickedFile?.name ?? "No file attached"}</Text>
                <Text style={styles.fileSize}>{pickedFile ? "Ready to upload with submit or draft" : "PDF, JPG, PNG"}</Text>
              </View>
            </View>
          </View>
          <Text style={styles.uploadFormats}>Accepted Formats: PDF, JPG, PNG (server cap LEAVE_DOCUMENT_MAX_BYTES)</Text>
        </TouchableOpacity>

        <View style={styles.attestCard}>
          <View style={styles.attestHeaderRow}>
            <Text style={styles.attestTitle}>Operational Notification</Text>
            <Text style={styles.attestRequired}>Manager proof required</Text>
          </View>
          <View style={styles.checkboxRow}>
            <TouchableOpacity style={[styles.checkbox, attested && styles.checkboxOn]} onPress={() => setAttested((value) => !value)}>
              {attested ? <MaterialIcons name="check" size={16} color={colors.onPrimary} /> : null}
            </TouchableOpacity>
            <Text style={styles.checkboxText}>I have notified my reporting manager and received approval for this leave.</Text>
          </View>
        </View>

        {loading ? <ActivityIndicator color={colors.primary} /> : null}
        {error ? <Text style={styles.policyText}>{error}</Text> : null}

        <View style={styles.submitActions}>
          <TouchableOpacity style={styles.submitBtn} onPress={() => void submit("submit")} disabled={submitting}>
            <Text style={styles.submitBtnText}>{submitting ? "Submitting..." : "Submit Leave Application"}</Text>
            <MaterialIcons name="arrow-forward" size={18} color={colors.onPrimary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.draftBtn} onPress={() => void submit("draft")} disabled={submitting}>
            <Text style={styles.draftBtnText}>Save as Draft</Text>
          </TouchableOpacity>
        </View>
      </View>
      <ThemedToast message={toast} />
      <ThemedDialog
        visible={dateBlock != null}
        title="Date not available"
        message={dateBlock ?? ""}
        onRequestClose={() => setDateBlock(null)}
        actions={[{ label: "OK", onPress: () => setDateBlock(null), primary: true }]}
      />
      <ThemedDialog
        visible={sessionDialog != null}
        title={sessionDialog ? formatLong(sessionDialog.civil) : "Session"}
        message={sessionDialog?.step === "half" ? "Choose First Half or Second Half" : "Full Day or Half Day"}
        onRequestClose={() => setSessionDialog(null)}
        actions={
          sessionDialog?.step === "half"
            ? [
                { label: "First Half", onPress: () => { if (sessionDialog) setDateSession(sessionDialog.civil, "FIRST_HALF"); setSessionDialog(null); }, primary: true },
                { label: "Second Half", onPress: () => { if (sessionDialog) setDateSession(sessionDialog.civil, "SECOND_HALF"); setSessionDialog(null); } },
              ]
            : [
                { label: "Full Day", onPress: () => { if (sessionDialog) setDateSession(sessionDialog.civil, "FULL_DAY"); setSessionDialog(null); }, primary: true },
                { label: "Half Day", onPress: () => setSessionDialog((current) => (current ? { ...current, step: "half" } : null)) },
              ]
        }
      />
      <ThemedDialog
        visible={durationInfoOpen}
        title="Leave Duration Mode"
        onRequestClose={() => setDurationInfoOpen(false)}
        actions={[{ label: "Got it", onPress: () => setDurationInfoOpen(false), primary: true }]}
      >
        <Text style={styles.policyText}>Full Day (1.0): entire working day.</Text>
        <Text style={styles.policyText}>First Half (0.5): morning shift.</Text>
        <Text style={styles.policyText}>Second Half (0.5): afternoon shift. Long-press a selected date to override.</Text>
      </ThemedDialog>
    </WebShell>
  );
}

const styles = StyleSheet.create({
  page: { width: "100%", gap: 12, paddingBottom: 24 },
  policyBanner: { flexDirection: "row", alignItems: "center", paddingVertical: 8, paddingHorizontal: 10, backgroundColor: "#ececec", borderRadius: 10, gap: 6 },
  policyText: { fontSize: 12, color: colors.onSurfaceVariant, flex: 1, lineHeight: 16 },
  empCard: { padding: 16, backgroundColor: colors.surfaceContainerLowest, borderRadius: 16, borderWidth: 1, borderColor: colors.glassBorder },
  empCardRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  empInfoLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  empName: { fontSize: 18, fontWeight: "600", color: colors.onSurface },
  empRole: { fontSize: 12, color: colors.secondary },
  approverLabel: { fontSize: 12, fontWeight: "600", color: colors.secondary, marginTop: 8 },
  approverName: { fontSize: 14, fontWeight: "600", color: colors.onSurface },
  formSection: { marginTop: 4, gap: 8 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sectionTitle: { fontSize: 12, fontWeight: "500", color: colors.onSurface },
  requiredStar: { color: colors.error, fontWeight: "700" },
  leaveTypeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  leaveTypeItemActive: { flexGrow: 1, flexBasis: 140, backgroundColor: colors.accent, padding: 10, borderRadius: 8, minWidth: 0 },
  leaveTypeItem: { flexGrow: 1, flexBasis: 140, backgroundColor: colors.surfaceContainerLow, padding: 10, borderRadius: 12, minWidth: 0 },
  leaveTypeIconRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  leaveTypeTextActive: { fontSize: 11, fontWeight: "500", color: colors.onPrimary, marginTop: 6 },
  leaveTypeText: { fontSize: 11, fontWeight: "500", color: colors.onSurface, marginTop: 6 },
  radioDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.surfaceContainerHigh },
  calendarCard: { backgroundColor: colors.surfaceContainerLowest, padding: 16, borderRadius: 16, gap: 16, borderWidth: 1, borderColor: colors.glassBorder },
  calendarHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderBottomWidth: 1, borderBottomColor: colors.surfaceContainer, paddingBottom: 8 },
  calendarTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  calendarTitle: { fontSize: 14, fontWeight: "500", color: colors.onSurface },
  calendarSubtitle: { fontSize: 12, color: colors.secondary },
  monthBadge: { backgroundColor: colors.surfaceContainerHigh, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  monthBadgeText: { fontSize: 11, fontWeight: "600", color: colors.secondary },
  calendarBox: { backgroundColor: colors.surfaceContainerLow, padding: 12, borderRadius: 12, gap: 12 },
  calendarNav: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 4 },
  calendarMonthText: { fontSize: 20, fontWeight: "600", color: colors.onSurface },
  calendarNavBtns: { flexDirection: "row", gap: 4 },
  calendarDaysRow: { flexDirection: "row", justifyContent: "space-between", paddingBottom: 4 },
  calendarDayHeader: { width: "14.28%", textAlign: "center", fontSize: 11, fontWeight: "600", color: colors.secondary },
  calendarDayHeaderWeekend: { color: colors.onSurfaceVariant },
  calendarGrid: { flexDirection: "row", flexWrap: "wrap" },
  calCell: { width: "14.28%", minHeight: 36, alignItems: "center", justifyContent: "center" },
  calTextOff: { textAlign: "center", fontSize: 12, color: "rgba(88, 95, 108, 0.4)" },
  calText: { textAlign: "center", fontSize: 12, color: colors.onSurface },
  calTextWeekend: { textAlign: "center", fontSize: 12, color: "rgba(88, 95, 108, 0.7)" },
  calTextTodayStr: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: colors.primary, textAlign: "center", lineHeight: 24, fontSize: 12, fontWeight: "bold", color: colors.primary, backgroundColor: colors.surfaceContainerLowest },
  calTextSelMid: { backgroundColor: colors.primary },
  calTextSelHalf: { backgroundColor: colors.secondaryFixedDim },
  calTextSelStr: { color: colors.onPrimary, fontSize: 12, fontWeight: "500" },
  calTextSelHalfStr: { color: colors.onSurface, fontSize: 12, fontWeight: "500" },
  halfDot: { width: 5, height: 5, borderRadius: 2.5, marginTop: 2 },
  calendarLegend: { flexDirection: "row", gap: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.surfaceContainer, paddingHorizontal: 4 },
  legendItem: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4 },
  legendDot: { width: 12, height: 12, borderRadius: 6 },
  legendText: { fontSize: 12, color: colors.onSurface },
  dateRangeBox: { flexDirection: "row", gap: 8, justifyContent: "space-between" },
  dateRangeItem: { width: "48%", backgroundColor: colors.surfaceContainerLow, padding: 10, borderRadius: 12, gap: 4, borderWidth: 1, borderColor: colors.glassBorder },
  dateRangeLabel: { fontSize: 11, fontWeight: "600", color: colors.secondary },
  dateRangeVal: { fontSize: 16, fontWeight: "600", color: colors.onSurface },
  dateRangeDay: { fontSize: 12, color: colors.secondary },
  durationResult: { backgroundColor: colors.surfaceContainerLow, borderRadius: 12, padding: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  durationTitle: { fontSize: 18, fontWeight: "600", color: colors.onSurface },
  durationSubtitle: { fontSize: 12, color: colors.onSurfaceVariant, marginTop: 2 },
  durationBadge: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  durationBadgeText: { fontSize: 16, fontWeight: "600", color: colors.onPrimary },
  reasonCard: { backgroundColor: colors.surfaceContainerLowest, borderRadius: 16, padding: 16, gap: 8, borderWidth: 1, borderColor: colors.glassBorder },
  reasonTitle: { fontSize: 12, fontWeight: "500", color: colors.onSurface },
  reasonInput: { backgroundColor: colors.surfaceContainerLow, color: colors.onSurface, fontSize: 14, borderRadius: 12, padding: 12, minHeight: 80, textAlignVertical: "top" },
  charCount: { fontSize: 11, fontWeight: "600", color: colors.secondary },
  uploadCard: { backgroundColor: colors.surfaceContainerLowest, borderRadius: 16, padding: 16, gap: 12, borderWidth: 1, borderColor: colors.glassBorder },
  uploadHeader: { gap: 4 },
  uploadTitleRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  uploadTitle: { fontSize: 12, fontWeight: "500", color: colors.onSurface },
  uploadSubtitle: { fontSize: 12, color: colors.secondary },
  fileCard: { backgroundColor: colors.surfaceContainerLow, borderRadius: 8, padding: 12, flexDirection: "row", alignItems: "center", gap: 12 },
  fileIconBox: { width: 40, height: 40, borderRadius: 4, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  fileInfo: { flexDirection: "row", alignItems: "center", gap: 12 },
  fileName: { fontSize: 14, fontWeight: "500", color: colors.onSurface },
  fileSize: { fontSize: 12, color: colors.secondary },
  uploadFormats: { fontSize: 12, color: colors.secondary, paddingHorizontal: 4 },
  attestCard: { backgroundColor: colors.surfaceContainerLowest, borderRadius: 16, padding: 16, gap: 12, borderWidth: 1, borderColor: colors.glassBorder },
  attestHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  attestTitle: { fontSize: 12, fontWeight: "500", color: colors.onSurface },
  checkboxRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
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
  attestRequired: { fontSize: 11, fontWeight: "700", color: colors.error },
  checkboxText: { flex: 1, fontSize: 12, color: colors.onSurface, lineHeight: 18 },
  submitActions: { marginTop: 8, gap: 8 },
  submitBtn: { width: "100%", height: 52, backgroundColor: colors.accent, borderRadius: 8, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  submitBtnText: { fontSize: 14, fontWeight: "500", color: colors.onPrimary },
  draftBtn: { width: "100%", height: 48, backgroundColor: colors.surfaceContainerLow, borderRadius: 12, flexDirection: "row", alignItems: "center", justifyContent: "center" },
  draftBtnText: { fontSize: 14, fontWeight: "500", color: colors.onSurface },
  infoDot: { width: 16, height: 16, borderRadius: 8, alignItems: "center", justifyContent: "center" },
});
