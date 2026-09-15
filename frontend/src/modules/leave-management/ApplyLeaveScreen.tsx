import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, SafeAreaView, ActivityIndicator, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { getSession } from '../../../services/auth';
import {
  apiErrorMessage,
  createLeave,
  createLeaveDraft,
  displayName,
  getEmployee,
  getMe,
  getOrgSettings,
  listLeaveTypes,
  type EmployeePublic,
  type LeaveType,
} from '../../../services/resources';
import { UIFallbackIndicator } from '../../components/ui/UIFallback';

const colors = {
  surface: "#fcf9f8",
  primary: "#000000",
  onPrimary: "#ffffff",
  surfaceContainerLowest: "#ffffff",
  surfaceContainerLow: "#f6f3f2",
  surfaceContainer: "#f0edec",
  surfaceContainerHigh: "#ebe7e7",
  surfaceContainerHighest: "#e5e2e1",
  secondary: "#585f6c",
  error: "#ba1a1a",
  border: "#cfc4c5",
  onSurface: "#1c1b1b",
  onSurfaceVariant: "#4c4546",
  secondaryFixedDim: "#c0c7d6",
};

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

function addDays(civil: string, days: number): string {
  const date = parseCivil(civil);
  date.setDate(date.getDate() + days);
  return toCivil(date);
}

function formatLong(civil: string): string {
  return parseCivil(civil).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function weekdayName(civil: string): string {
  return parseCivil(civil).toLocaleDateString(undefined, { weekday: "long" });
}

function iconForLeaveType(name: string): "medical-services" | "beach-access" | "money-off" | "event-available" {
  const lower = name.toLowerCase();
  if (lower.includes("sick") || lower.includes("medical")) {
    return "medical-services";
  }
  if (lower.includes("planned") || lower.includes("annual")) {
    return "beach-access";
  }
  if (lower.includes("emergency")) {
    return "money-off";
  }
  return "event-available";
}

function initials(employee: EmployeePublic | null): string {
  if (!employee) {
    return "—";
  }
  return `${employee.firstName[0] ?? ""}${employee.lastName?.[0] ?? ""}`.toUpperCase();
}

const FALLBACK_LEAVE_TYPES: LeaveType[] = [
  { leaveTypeId: 1, name: "Casual", description: "Casual leave", requiresMedicalDocument: false, allowedSex: null, obsolete: false },
  { leaveTypeId: 2, name: "Sick", description: "Medical leave", requiresMedicalDocument: true, allowedSex: null, obsolete: false },
  { leaveTypeId: 3, name: "Emergency", description: "Emergency leave", requiresMedicalDocument: false, allowedSex: null, obsolete: false },
  { leaveTypeId: 4, name: "Planned", description: "Planned leave", requiresMedicalDocument: false, allowedSex: null, obsolete: false },
];

type DaySession = "FULL_DAY" | "FIRST_HALF";
type DurationMode = "FULL" | "HALF";

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

function sessionForMode(mode: DurationMode): DaySession {
  return mode === "HALF" ? "FIRST_HALF" : "FULL_DAY";
}

export default function ApplyLeaveScreen() {
  const router = useRouter();
  const [me, setMe] = useState<EmployeePublic | null>(null);
  const [managerName, setManagerName] = useState("—");
  const [types, setTypes] = useState<LeaveType[]>([]);
  const [leaveTypeId, setLeaveTypeId] = useState<number | null>(null);
  const [reason, setReason] = useState("");
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [dateSessions, setDateSessions] = useState<Record<string, DaySession>>({});
  const [dateOverrides, setDateOverrides] = useState<Record<string, true>>({});
  const [durationMode, setDurationMode] = useState<DurationMode>("FULL");
  const [waitingForTo, setWaitingForTo] = useState(false);
  const [sessionMenuOpen, setSessionMenuOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [viewMonth, setViewMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [maxAdvanceDays, setMaxAdvanceDays] = useState(14);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const today = toCivil(new Date());

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [session, leaveTypes, settings] = await Promise.all([
        getSession(),
        listLeaveTypes(),
        getOrgSettings(),
      ]);
      setMaxAdvanceDays(settings.maxAdvanceDays);
      const resolvedTypes = leaveTypes.items.length > 0 ? leaveTypes.items : FALLBACK_LEAVE_TYPES;
      setTypes(resolvedTypes);
      const sick = resolvedTypes.find((row) => /sick|medical/i.test(row.name));
      setLeaveTypeId((sick ?? resolvedTypes[0])?.leaveTypeId ?? null);
      const tomorrow = addDays(today, 1);
      setSelectedDates([tomorrow]);
      setDateSessions({ [tomorrow]: "FULL_DAY" });
      setDateOverrides({});
      setDurationMode("FULL");
      setWaitingForTo(true);

      let profile = session?.user as EmployeePublic | undefined;
      try {
        profile = await getMe();
      } catch {
        // Pass/dev session has no API user.
      }
      if (profile) {
        setMe(profile);
        if (profile.managerId) {
          try {
            const manager = await getEmployee(profile.managerId);
            setManagerName(displayName(manager));
          } catch {
            setManagerName(`EMP-${profile.managerId}`);
          }
        }
      }
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [today]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!toast) {
      return;
    }
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  const cells = useMemo(() => {
    const first = new Date(viewMonth.year, viewMonth.month, 1);
    const startOffset = (first.getDay() + 6) % 7;
    const start = new Date(first);
    start.setDate(1 - startOffset);
    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      const civil = toCivil(date);
      const inMonth = date.getMonth() === viewMonth.month;
      const dow = date.getDay();
      return {
        civil,
        day: date.getDate(),
        inMonth,
        isWeekend: dow === 0 || dow === 6,
        isToday: civil === today,
        selected: selectedDates.includes(civil),
      };
    });
  }, [selectedDates, today, viewMonth.month, viewMonth.year]);

  const sortedDates = [...selectedDates].sort();
  const fromDate = sortedDates[0];
  const toDate = waitingForTo ? undefined : sortedDates[sortedDates.length - 1];
  const selectedType = types.find((row) => row.leaveTypeId === leaveTypeId);
  const leaveDayCount = sortedDates.reduce(
    (sum, date) => sum + (dateSessions[date] === "FIRST_HALF" ? 0.5 : 1),
    0,
  );

  function applyDurationMode(mode: DurationMode) {
    setDurationMode(mode);
    setSessionMenuOpen(false);
    const session = sessionForMode(mode);
    setDateSessions((current) => {
      const next = { ...current };
      for (const date of selectedDates) {
        if (!dateOverrides[date]) {
          next[date] = session;
        }
      }
      return next;
    });
  }

  function setDateSession(civil: string, session: DaySession) {
    setDateSessions((current) => ({ ...current, [civil]: session }));
    setDateOverrides((current) => ({ ...current, [civil]: true }));
  }

  function openDateSessionMenu(civil: string) {
    Alert.alert(formatLong(civil), "Session type for this date", [
      { text: "Full Day", onPress: () => setDateSession(civil, "FULL_DAY") },
      { text: "Half Day", onPress: () => setDateSession(civil, "FIRST_HALF") },
      { text: "Cancel", style: "cancel" },
    ]);
  }

  function toggleDate(civil: string) {
    if (waitingForTo && fromDate) {
      const range = enumerateRange(fromDate, civil);
      setSelectedDates(range);
      setDateSessions(Object.fromEntries(range.map((date) => [date, "FULL_DAY"])));
      setDateOverrides({});
      setDurationMode("FULL");
      setWaitingForTo(false);
      return;
    }
    if (selectedDates.includes(civil)) {
      return;
    }
    setSelectedDates([civil]);
    setDateSessions({ [civil]: "FULL_DAY" });
    setDateOverrides({});
    setDurationMode("FULL");
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
    setSubmitting(true);
    setError(null);
    setMessage(null);
    const body = {
      leaveTypeId,
      reason: reason.trim(),
      selectedDates: sortedDates.map((date) => ({ date, session: dateSessions[date] ?? "FULL_DAY" })),
    };
    try {
      const result = kind === "draft" ? await createLeaveDraft(body) : await createLeave(body);
      setMessage(`${kind === "draft" ? "Draft saved" : "Submitted"} (#${result.leaveId}, ${result.status}).`);
    } catch (err) {
      setToast(apiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  const monthLabel = new Date(viewMonth.year, viewMonth.month, 1).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={20} color={colors.onSurface} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Apply Leave Request</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconButton}>
            <MaterialIcons name="more-vert" size={20} color={colors.secondary} />
          </TouchableOpacity>
          <View style={styles.profileAvatar}>
            <MaterialIcons name="person" size={18} color={colors.onPrimary} />
          </View>
        </View>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        
        {/* Micro Policy Guidance Banner */}
        <View style={styles.policyBanner}>
          <MaterialIcons name="verified-user" size={18} color={colors.secondary} style={styles.policyIcon} />
          <Text style={styles.policyText}>Advance booking limit: Max {maxAdvanceDays} calendar days forward.</Text>
        </View>

        {/* Employee Context Header */}
        <View style={styles.empCard}>
          <View style={styles.empCardRow}>
            <View style={styles.empInfoLeft}>
              <View style={styles.empInitialsBox}>
                <Text style={styles.empInitials}>{error ? "AC" : initials(me)}</Text>
              </View>
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={styles.empName}>{error ? "Anand Chadda" : displayName(me)}</Text>
                  {error && <UIFallbackIndicator style={{ marginTop: 2 }} />}
                </View>
                <Text style={styles.empRole}>{error ? "Engineering & DevOps" : me?.email ?? "Sign in required for live data"}</Text>
              </View>
            </View>
            <View style={styles.approverBox}>
              <Text style={styles.approverLabel}>APPROVER</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.approverName}>{error ? "Marcus Vance" : managerName}</Text>
                {error && <UIFallbackIndicator style={{ marginTop: 2, marginLeft: 2 }} />}
              </View>
            </View>
          </View>
        </View>

        <View style={styles.formSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Leave Type</Text>
            <Text style={styles.requiredLabel}>REQUIRED</Text>
          </View>

          <View style={styles.leaveTypeGrid}>
            {types.length === 0 && !loading ? (
              FALLBACK_LEAVE_TYPES.map((type) => {
                const active = type.leaveTypeId === leaveTypeId;
                return (
                  <TouchableOpacity
                    key={type.leaveTypeId}
                    style={active ? styles.leaveTypeItemActive : styles.leaveTypeItem}
                    onPress={() => {
                      setTypes(FALLBACK_LEAVE_TYPES);
                      setLeaveTypeId(type.leaveTypeId);
                    }}
                  >
                    <View style={styles.leaveTypeIconRow}>
                      <MaterialIcons
                        name={iconForLeaveType(type.name)}
                        size={18}
                        color={active ? colors.onPrimary : colors.secondary}
                      />
                      {active ? (
                        <MaterialIcons name="check-circle" size={16} color={colors.onPrimary} />
                      ) : (
                        <View style={styles.radioDot} />
                      )}
                    </View>
                    <Text style={active ? styles.leaveTypeTextActive : styles.leaveTypeText}>{type.name}</Text>
                  </TouchableOpacity>
                );
              })
            ) : null}
            {types.map((type) => {
              const active = type.leaveTypeId === leaveTypeId;
              return (
                <TouchableOpacity
                  key={type.leaveTypeId}
                  style={active ? styles.leaveTypeItemActive : styles.leaveTypeItem}
                  onPress={() => setLeaveTypeId(type.leaveTypeId)}
                >
                  <View style={styles.leaveTypeIconRow}>
                    <MaterialIcons
                      name={iconForLeaveType(type.name)}
                      size={18}
                      color={active ? colors.onPrimary : colors.secondary}
                    />
                    {active ? (
                      <MaterialIcons name="check-circle" size={16} color={colors.onPrimary} />
                    ) : (
                      <View style={styles.radioDot} />
                    )}
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
              {['M','T','W','T','F','S','S'].map((day, i) => (
                <Text key={i} style={[styles.calendarDayHeader, (i===5||i===6) && styles.calendarDayHeaderWeekend]}>{day}</Text>
              ))}
            </View>
            <View style={styles.calendarGrid}>
              {cells.map((cell) => {
                if (!cell.inMonth) {
                  return <Text key={cell.civil} style={styles.calTextOff}>{cell.day}</Text>;
                }
                if (cell.selected) {
                  const isHalf = dateSessions[cell.civil] === "FIRST_HALF";
                  return (
                    <TouchableOpacity
                      key={cell.civil}
                      style={isHalf ? styles.calTextSelHalf : styles.calTextSelMid}
                      onPress={() => toggleDate(cell.civil)}
                      onLongPress={() => openDateSessionMenu(cell.civil)}
                      delayLongPress={400}
                    >
                      <Text style={isHalf ? styles.calTextSelHalfStr : styles.calTextSelStr}>{cell.day}</Text>
                    </TouchableOpacity>
                  );
                }
                if (cell.isToday) {
                  return (
                    <TouchableOpacity key={cell.civil} style={styles.calTextToday} onPress={() => toggleDate(cell.civil)}>
                      <Text style={styles.calTextTodayStr}>{cell.day}</Text>
                    </TouchableOpacity>
                  );
                }
                return (
                  <TouchableOpacity key={cell.civil} style={{ width: "14%" }} onPress={() => toggleDate(cell.civil)}>
                    <Text style={cell.isWeekend ? styles.calTextWeekend : styles.calText}>{cell.day}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <View style={styles.calendarLegend}>
              <TouchableOpacity style={styles.legendItem} onPress={() => setSessionMenuOpen((open) => !open)}>
                <View style={[styles.legendDot, {backgroundColor: durationMode === "HALF" ? colors.secondaryFixedDim : colors.primary, borderColor: colors.secondary, borderWidth: durationMode === "HALF" ? 1 : 0}]} />
                <Text style={styles.legendText}>{durationMode === "HALF" ? "Half Day" : "Full Day"}</Text>
                <MaterialIcons name="expand-more" size={18} color={colors.secondary} />
              </TouchableOpacity>
            </View>
            {sessionMenuOpen ? (
              <View style={styles.calendarLegend}>
                <TouchableOpacity style={styles.legendItem} onPress={() => applyDurationMode("FULL")}>
                  <View style={[styles.legendDot, {backgroundColor: colors.primary}]} />
                  <Text style={styles.legendText}>Full Day</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.legendItem} onPress={() => applyDurationMode("HALF")}>
                  <View style={[styles.legendDot, {backgroundColor: colors.secondaryFixedDim, borderColor: colors.secondary, borderWidth: 1}]} />
                  <Text style={styles.legendText}>Half Day</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>

          <View style={styles.dateRangeBox}>
            <View style={styles.dateRangeItem}>
              <Text style={styles.dateRangeLabel}>FROM (INCLUSIVE)</Text>
              <View style={styles.dateRangeValRow}>
                <MaterialIcons name="calendar-today" size={18} color={colors.secondary} />
                <Text style={styles.dateRangeVal}>{fromDate ? formatLong(fromDate) : "Select date"}</Text>
              </View>
              <Text style={styles.dateRangeDay}>{fromDate ? weekdayName(fromDate) : "—"}</Text>
            </View>
            <View style={styles.dateRangeItem}>
              <Text style={styles.dateRangeLabel}>TO (INCLUSIVE)</Text>
              <View style={styles.dateRangeValRow}>
                <MaterialIcons name="event" size={18} color={colors.secondary} />
                <Text style={styles.dateRangeVal}>{toDate ? formatLong(toDate) : "Select date"}</Text>
              </View>
              <Text style={styles.dateRangeDay}>{toDate ? weekdayName(toDate) : "—"}</Text>
            </View>
          </View>

          <View style={styles.durationResult}>
            <View>
              <Text style={styles.durationTitle}>{sortedDates.length} Selected Day{sortedDates.length === 1 ? "" : "s"}</Text>
              <Text style={styles.durationSubtitle}>
                {fromDate && toDate ? `${formatLong(fromDate)} – ${formatLong(toDate)}` : fromDate ? `${formatLong(fromDate)} – Select date` : "Tap calendar days"}
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

        <View style={styles.uploadCard}>
          <View style={styles.uploadHeader}>
            <View style={styles.uploadTitleRow}>
              <MaterialIcons name="attachment" size={18} color={colors.primary} />
              <Text style={styles.uploadTitle}>Medical Document Upload</Text>
            </View>
            <Text style={styles.uploadSubtitle}>
              {selectedType?.requiresMedicalDocument
                ? "This type may require a medical document on the server (upload API needs a file picker; not wired)."
                : "Medical upload applies only when the selected type requires a document."}
            </Text>
          </View>
          <View style={styles.fileCard}>
            <View style={styles.fileInfo}>
              <View style={styles.fileIconBox}>
                <MaterialIcons name="picture-as-pdf" size={20} color={colors.onPrimary} />
              </View>
              <View>
                <Text style={styles.fileName}>No file attached</Text>
                <Text style={styles.fileSize}>Use draft + documents API later</Text>
              </View>
            </View>
          </View>
          <Text style={styles.uploadFormats}>Accepted Formats: PDF, JPG, PNG (server cap LEAVE_DOCUMENT_MAX_BYTES)</Text>
        </View>

        <View style={styles.attestCard}>
          <View style={styles.attestHeaderRow}>
            <Text style={styles.attestTitle}>Operational Notification</Text>
            <View style={styles.attestBadge}>
              <Text style={styles.attestBadgeText}>MANAGER_PROOF_REQUIRED</Text>
            </View>
          </View>
          <View style={styles.checkboxRow}>
            <View style={styles.checkbox}>
              <MaterialIcons name="check" size={16} color={colors.onPrimary} />
            </View>
            <Text style={styles.checkboxText}>
              I certify that I have notified my reporting manager (<Text style={styles.checkboxTextBold}>{error ? "Marcus Vance" : managerName}</Text>) regarding this absence.
            </Text>
          </View>
        </View>

        {loading ? <ActivityIndicator color={colors.primary} /> : null}
        {error ? <Text style={styles.policyText}>{error}</Text> : null}
        {message ? <Text style={styles.policyText}>{message}</Text> : null}

        <View style={styles.submitActions}>
          <TouchableOpacity style={styles.submitBtn} onPress={() => void submit("submit")} disabled={submitting}>
            <Text style={styles.submitBtnText}>{submitting ? "Submitting..." : "Submit Leave Application"}</Text>
            <MaterialIcons name="arrow-forward" size={18} color={colors.onPrimary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.draftBtn} onPress={() => void submit("draft")} disabled={submitting}>
            <Text style={styles.draftBtnText}>Save as Draft</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
      {toast ? (
        <View pointerEvents="none" style={styles.toastBox}>
          <Text style={styles.toastText}>{toast}</Text>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.surface },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, height: 56, backgroundColor: 'rgba(252, 249, 248, 0.9)',
    borderBottomWidth: 1, borderBottomColor: colors.surfaceContainer,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginLeft: -8 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: colors.onSurface },
  profileAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 64, gap: 12 },
  policyBanner: { flexDirection: 'row', alignItems: 'flex-start', padding: 12, backgroundColor: colors.surfaceContainerLow, borderRadius: 12, gap: 8, marginTop: 12 },
  policyIcon: { marginTop: 2 },
  policyText: { fontSize: 12, color: colors.onSurfaceVariant, flex: 1, lineHeight: 16 },
  empCard: { padding: 16, backgroundColor: colors.surfaceContainerLowest, borderRadius: 12 },
  empCardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  empInfoLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  empInitialsBox: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surfaceContainerHigh, alignItems: 'center', justifyContent: 'center' },
  empInitials: { fontSize: 18, fontWeight: '600', color: colors.onSurface },
  empName: { fontSize: 18, fontWeight: '600', color: colors.onSurface },
  empRole: { fontSize: 12, color: colors.secondary },
  approverBox: { alignItems: 'flex-end', paddingLeft: 8 },
  approverLabel: { fontSize: 11, fontWeight: '600', color: colors.secondary },
  approverName: { fontSize: 12, fontWeight: '500', color: colors.onSurface },
  formSection: { marginTop: 16, gap: 8 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 12, fontWeight: '500', color: colors.onSurface },
  requiredLabel: { fontSize: 11, fontWeight: '600', color: colors.secondary },
  leaveTypeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'space-between' },
  leaveTypeItemActive: { width: '48%', backgroundColor: colors.primary, padding: 12, borderRadius: 8 },
  leaveTypeItem: { width: '48%', backgroundColor: colors.surfaceContainerLowest, padding: 12, borderRadius: 8 },
  leaveTypeIconRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  leaveTypeTextActive: { fontSize: 14, fontWeight: '500', color: colors.onPrimary, marginTop: 8 },
  leaveTypeText: { fontSize: 14, fontWeight: '500', color: colors.onSurface, marginTop: 8 },
  radioDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.surfaceContainerHigh },
  radioSelected: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.primary },
  calendarCard: { backgroundColor: colors.surfaceContainerLowest, padding: 16, borderRadius: 12, gap: 16 },
  calendarHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.surfaceContainer, paddingBottom: 8 },
  calendarTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  calendarTitle: { fontSize: 14, fontWeight: '500', color: colors.onSurface },
  calendarSubtitle: { fontSize: 12, color: colors.secondary },
  monthBadge: { backgroundColor: colors.surfaceContainerHigh, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  monthBadgeText: { fontSize: 11, fontWeight: '600', color: colors.secondary },
  calendarBox: { backgroundColor: colors.surfaceContainerLow, padding: 12, borderRadius: 12, gap: 12 },
  calendarNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 4 },
  calendarMonthText: { fontSize: 18, fontWeight: '600', color: colors.onSurface },
  calendarNavBtns: { flexDirection: 'row', gap: 4 },
  calendarDaysRow: { flexDirection: 'row', justifyContent: 'space-between', paddingBottom: 4 },
  calendarDayHeader: { width: '14%', textAlign: 'center', fontSize: 11, fontWeight: '600', color: colors.secondary },
  calendarDayHeaderWeekend: { color: colors.onSurfaceVariant },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  calTextOff: { width: '14%', textAlign: 'center', paddingVertical: 8, fontSize: 12, color: 'rgba(88, 95, 108, 0.4)' },
  calText: { width: '14%', textAlign: 'center', paddingVertical: 8, fontSize: 12, color: colors.onSurface },
  calTextWeekend: { width: '14%', textAlign: 'center', paddingVertical: 8, fontSize: 12, color: 'rgba(88, 95, 108, 0.7)', backgroundColor: 'rgba(235, 231, 231, 0.4)' },
  calTextToday: { width: '14%', alignItems: 'center', justifyContent: 'center' },
  calTextTodayStr: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: colors.primary, textAlign: 'center', lineHeight: 24, fontSize: 12, fontWeight: 'bold', color: colors.primary, backgroundColor: colors.surfaceContainerLowest },
  calTextSelLeft: { width: '14%', backgroundColor: colors.primary, borderTopLeftRadius: 16, borderBottomLeftRadius: 16, alignItems: 'center', justifyContent: 'center' },
  calTextSelMid: { width: '14%', backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  calTextSelHalf: { width: '14%', backgroundColor: colors.secondaryFixedDim, alignItems: 'center', justifyContent: 'center' },
  calTextSelRight: { width: '14%', backgroundColor: colors.primary, borderTopRightRadius: 16, borderBottomRightRadius: 16, alignItems: 'center', justifyContent: 'center' },
  calTextSelStr: { color: colors.onPrimary, fontSize: 12, fontWeight: '500', paddingVertical: 8 },
  calTextSelHalfStr: { color: colors.onSurface, fontSize: 12, fontWeight: '500', paddingVertical: 8 },
  calendarLegend: { flexDirection: 'row', gap: 12, paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.surfaceContainer, paddingHorizontal: 4 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 12, height: 12, borderRadius: 6 },
  legendText: { fontSize: 12, color: colors.onSurface },
  dateRangeBox: { flexDirection: 'row', gap: 8, justifyContent: 'space-between' },
  dateRangeItem: { width: '48%', backgroundColor: colors.surfaceContainerLow, padding: 8, borderRadius: 8, gap: 4, borderWidth: 1, borderColor: colors.surfaceContainer },
  dateRangeLabel: { fontSize: 11, fontWeight: '600', color: colors.secondary },
  dateRangeValRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dateRangeVal: { fontSize: 16, fontWeight: '600', color: colors.onSurface },
  dateRangeDay: { fontSize: 12, color: colors.secondary },
  durationResult: { backgroundColor: 'rgba(235, 231, 231, 0.6)', borderRadius: 8, padding: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  durationTitle: { fontSize: 18, fontWeight: '600', color: colors.onSurface },
  durationSubtitle: { fontSize: 12, color: colors.onSurfaceVariant, marginTop: 2 },
  durationBadge: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  durationBadgeText: { fontSize: 16, fontWeight: '600', color: colors.onPrimary },
  reasonCard: { backgroundColor: colors.surfaceContainerLowest, borderRadius: 12, padding: 16, gap: 8 },
  reasonTitle: { fontSize: 12, fontWeight: '500', color: colors.onSurface },
  reasonInput: { backgroundColor: colors.surfaceContainerLow, color: colors.onSurface, fontSize: 14, borderRadius: 8, padding: 12, minHeight: 80, textAlignVertical: 'top' },
  charCount: { fontSize: 11, fontWeight: '600', color: colors.secondary },
  uploadCard: { backgroundColor: colors.surfaceContainerLowest, borderRadius: 12, padding: 16, gap: 12 },
  uploadHeader: { gap: 4 },
  uploadTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  uploadTitle: { fontSize: 12, fontWeight: '500', color: colors.onSurface },
  uploadSubtitle: { fontSize: 12, color: colors.secondary },
  fileCard: { backgroundColor: colors.surfaceContainerLow, borderRadius: 8, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
  fileIconBox: { width: 40, height: 40, borderRadius: 4, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  fileInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  fileName: { fontSize: 14, fontWeight: '500', color: colors.onSurface },
  fileSize: { fontSize: 12, color: colors.secondary },
  uploadFormats: { fontSize: 12, color: colors.secondary, paddingHorizontal: 4 },
  attestCard: { backgroundColor: colors.surfaceContainerLowest, borderRadius: 12, padding: 16, gap: 12 },
  attestHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  attestTitle: { fontSize: 12, fontWeight: '500', color: colors.onSurface },
  attestBadge: { backgroundColor: colors.surfaceContainer, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  attestBadgeText: { fontSize: 11, fontWeight: '600', color: colors.secondary },
  checkboxRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  checkbox: { width: 20, height: 20, borderRadius: 4, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  checkboxText: { flex: 1, fontSize: 12, color: colors.onSurface, lineHeight: 18 },
  checkboxTextBold: { fontWeight: '500' },
  submitActions: { marginTop: 8, gap: 8 },
  submitBtn: { width: '100%', height: 48, backgroundColor: colors.primary, borderRadius: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  submitBtnText: { fontSize: 14, fontWeight: '500', color: colors.onPrimary },
  draftBtn: { width: '100%', height: 48, backgroundColor: colors.surfaceContainerLowest, borderRadius: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  draftBtnText: { fontSize: 14, fontWeight: '500', color: colors.onSurface },
  toastBox: { position: 'absolute', left: 16, right: 16, top: 64, backgroundColor: colors.onSurface, borderRadius: 8, padding: 12 },
  toastText: { fontSize: 12, color: colors.onPrimary, lineHeight: 16 },
});
