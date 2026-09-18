import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator } from "react-native";
import { getSession } from "../../services/auth";
import {
  apiErrorMessage,
  createLeave,
  createLeaveDraft,
  displayName,
  getEmployee,
  getMe,
  getOrgSettings,
  listLeaveTypes,
  uploadLeaveDocument,
  type EmployeePublic,
  type LeaveType,
} from "../../services/resources";
import { colors } from "../theme";
import { WebCard, WebShell } from "./WebShell";

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
  const [me, setMe] = useState<EmployeePublic | null>(null);
  const [managerName, setManagerName] = useState("—");
  const [types, setTypes] = useState<LeaveType[]>([]);
  const [leaveTypeId, setLeaveTypeId] = useState<number | null>(null);
  const [reason, setReason] = useState("");
  const [fromDate, setFromDate] = useState(toCivil(new Date()));
  const [toDate, setToDate] = useState(toCivil(new Date()));
  const [session, setSession] = useState<DaySession>("FULL_DAY");
  const [attested, setAttested] = useState(false);
  const [maxAdvanceDays, setMaxAdvanceDays] = useState(14);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pickedFile, setPickedFile] = useState<{ uri: string; name: string; type: string; blob?: Blob } | null>(null);

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
              if (!cancelled) setManagerName(`EMP-${profile.managerId}`);
            }
          }
        } catch {
          if (!cancelled) setMe((sessionAuth?.user as EmployeePublic | undefined) ?? null);
        }
        try {
          const org = await getOrgSettings();
          if (!cancelled) setMaxAdvanceDays(org.maxAdvanceDays ?? 14);
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
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

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
    if (!attested) {
      setError("Manager notification attestation is required.");
      return;
    }
    setSubmitting(true);
    setError(null);
    setMessage(null);
    try {
      const result =
        kind === "draft"
          ? await createLeaveDraft({
              leaveTypeId,
              reason: reason.trim(),
              selectedDates: selectedDates.map((date) => ({ date, session })),
            })
          : await createLeave({
              leaveTypeId,
              reason: reason.trim(),
              selectedDates: selectedDates.map((date) => ({ date, session })),
            });
      if (pickedFile) {
        try {
          await uploadLeaveDocument(result.leaveId, pickedFile);
        } catch (uploadErr) {
          setError(apiErrorMessage(uploadErr));
        }
      }
      setMessage(
        kind === "draft"
          ? "Draft saved successfully."
          : "Leave request submitted successfully.",
      );
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <WebShell title="Apply Leave Request" variant="employee" activeRoute="leave" showBack>
      {loading ? <ActivityIndicator color={colors.primary} /> : null}
      <Text style={styles.banner}>Advance booking limit: Max {maxAdvanceDays} calendar days forward. Approver — S. Raman</Text>
      <View style={styles.cols}>
        <WebCard style={styles.col}>
          <Text style={styles.h}>Applicant</Text>
          <Text style={styles.body}>{me ? displayName(me) : "—"}</Text>
          <Text style={styles.meta}>Manager: {managerName}</Text>
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
          <Text style={styles.meta}>{selectedDates.length} day(s) selected</Text>
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
          <TouchableOpacity onPress={() => setAttested(!attested)}>
            <Text style={styles.body}>
              {attested ? "☑" : "☐"} I have notified my reporting manager and received approval for this leave.
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
          {message ? <Text style={styles.ok}>{message}</Text> : null}
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
    </WebShell>
  );
}

const styles = StyleSheet.create({
  banner: { fontSize: 13, color: colors.secondary },
  cols: { flexDirection: "row", flexWrap: "wrap", gap: 16 },
  col: { flexGrow: 1, flexBasis: 360, gap: 10 },
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
