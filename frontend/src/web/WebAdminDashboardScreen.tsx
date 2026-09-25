import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, LayoutAnimation } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { getSession } from "../../services/auth";
import { displayName, getMe, listEmployees, listLeaves, type EmployeePublic, type LeaveApplication } from "../../services/resources";
import { matchesPeopleQuery } from "../utils/workforce";
import { colors } from "../theme";
import { WebCard, WebShell } from "./WebShell";

const ACTIONS: {
  label: string;
  route: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  hint: string;
}[] = [
  { label: "Leave approval / review", route: "/leave/admin-review", icon: "assignment-turned-in", hint: "Queue and decide requests" },
  { label: "Leave types", route: "/leave/types", icon: "category", hint: "Configure leave categories" },
  { label: "Holiday management", route: "/org-settings", icon: "event", hint: "Org holidays and calendar" },
  { label: "Attendance corrections", route: "/attendance-corrections", icon: "rule", hint: "Review punch corrections" },
  { label: "People directory", route: "/people", icon: "groups", hint: "Employees and departments" },
  { label: "Organisation settings", route: "/org-settings", icon: "tune", hint: "Shift, grace, and timezone" },
];

export default function WebAdminDashboardScreen() {
  const router = useRouter();
  const reviewHref = (process.env.EXPO_PUBLIC_ADMIN_LEAVE_REVIEW as string | undefined) || "/leave/admin-review";
  const [me, setMe] = useState<EmployeePublic | null>(null);
  const [pending, setPending] = useState<LeaveApplication[]>([]);
  const [approved, setApproved] = useState<LeaveApplication[]>([]);
  const [query, setQuery] = useState("");
  const [employeeTotal, setEmployeeTotal] = useState<number | null>(null);
  const [openMetric, setOpenMetric] = useState<"active" | "leave" | "pending" | null>(null);
  const [employees, setEmployees] = useState<EmployeePublic[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const session = await getSession();
      try {
        const profile = await getMe();
        if (!cancelled) setMe(profile);
      } catch {
        if (!cancelled) setMe((session?.user as EmployeePublic | undefined) ?? null);
      }
      try {
        const people = await listEmployees();
        if (!cancelled) {
          setEmployees(people.items);
          setEmployeeTotal(people.total ?? people.items.length);
        }
      } catch {
        /* keep dashboard */
      }
      try {
        const [pendingLeaves, submittedLeaves, approvedLeaves] = await Promise.all([
          listLeaves("PENDING_HR_REVIEW"),
          listLeaves("SUBMITTED"),
          listLeaves("APPROVED"),
        ]);
        if (!cancelled) {
          setPending([...pendingLeaves.items, ...submittedLeaves.items]);
          setApproved(approvedLeaves.items);
        }
      } catch {
        /* keep dashboard */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const today = new Date().toISOString().slice(0, 10);
  const onLeaveToday = approved.filter((row) => row.startDate <= today && row.endDate >= today).length;
  const term = query.trim().toLowerCase();
  const matchedPeople = term ? employees.filter((row) => matchesPeopleQuery(row, term)).slice(0, 6) : [];
  const matchedLeaves = term
    ? pending.filter((row) => {
        const person = employees.find((employee) => employee.employeeId === row.employeeId);
        const haystack = [person ? displayName(person) : "", row.reason, row.status, String(row.leaveId)].join(" ").toLowerCase();
        return haystack.includes(term);
      }).slice(0, 6)
    : [];

  return (
    <WebShell title="Admin Dashboard" variant="admin" activeRoute="home">
      <WebCard>
        <Text style={styles.kicker}>HR Operations</Text>
        <Text style={styles.h}>{me ? displayName(me).toUpperCase() : "—"}</Text>
        <Text style={styles.meta}>{me?.role ?? "—"}</Text>
      </WebCard>
      <View style={styles.searchRow}>
        <MaterialIcons name="search" size={18} color={colors.secondary} />
        <TextInput
          style={styles.search}
          placeholder="Search employees, records, or departments..."
          value={query}
          onChangeText={setQuery}
          placeholderTextColor={colors.secondary}
        />
      </View>
      {term ? (
        <WebCard>
          <Text style={styles.kicker}>Matches</Text>
          {matchedPeople.length === 0 && matchedLeaves.length === 0 ? <Text style={styles.meta}>No employees or pending leave match.</Text> : null}
          {matchedPeople.map((row) => (
            <Text key={row.employeeId} style={styles.meta}>{displayName(row)} · {row.email}</Text>
          ))}
          {matchedLeaves.map((row) => (
            <Text key={row.leaveId} style={styles.meta}>
              Leave #{row.leaveId} · {row.status === "SUBMITTED" ? "Approver approval pending" : row.status.replaceAll("_", " ")} · {row.reason}
            </Text>
          ))}
        </WebCard>
      ) : null}
      <View style={styles.stats}>
        <TouchableOpacity
          style={{ flexGrow: 1, flexBasis: 200 }}
          onPress={() => {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setOpenMetric((current) => (current === "active" ? null : "active"));
          }}
        >
        <WebCard style={styles.stat}>
          <MaterialIcons name="groups" size={18} color={colors.accent} />
          <Text style={styles.kicker}>Active entities</Text>
          <Text style={styles.num}>{employeeTotal ?? 0}</Text>
        </WebCard>
        </TouchableOpacity>
        <TouchableOpacity
          style={{ flexGrow: 1, flexBasis: 200 }}
          onPress={() => {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setOpenMetric((current) => (current === "leave" ? null : "leave"));
          }}
        >
        <WebCard style={styles.stat}>
          <MaterialIcons name="event-busy" size={18} color={colors.accent} />
          <Text style={styles.kicker}>On leave today</Text>
          <Text style={styles.num}>{onLeaveToday}</Text>
        </WebCard>
        </TouchableOpacity>
        <TouchableOpacity
          style={{ flexGrow: 1, flexBasis: 200 }}
          onPress={() => {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setOpenMetric((current) => (current === "pending" ? null : "pending"));
          }}
        >
        <WebCard style={styles.stat}>
          <MaterialIcons name="pending" size={18} color={colors.accent} />
          <Text style={styles.kicker}>Pending reviews</Text>
          <Text style={styles.num}>{pending.length}</Text>
          <TouchableOpacity style={styles.cta} onPress={() => router.push(reviewHref as never)}>
            <Text style={styles.ctaText}>Review Queue</Text>
          </TouchableOpacity>
        </WebCard>
        </TouchableOpacity>
      </View>
      {openMetric ? (
        <WebCard>
          {(openMetric === "active"
            ? employees.filter((row) => row.status === "ACTIVE" && !row.obsolete)
            : openMetric === "leave"
              ? employees.filter((row) => approved.some((leave) => leave.employeeId === row.employeeId && leave.startDate <= new Date().toISOString().slice(0, 10) && leave.endDate >= new Date().toISOString().slice(0, 10)))
              : pending.map((row) => employees.find((employee) => employee.employeeId === row.employeeId)).filter((row): row is EmployeePublic => Boolean(row))
          ).slice(0, 8).map((row) => (
            <Text key={row.employeeId} style={styles.meta}>{displayName(row)}</Text>
          ))}
        </WebCard>
      ) : null}
      <Text style={styles.section}>HR Quick Actions</Text>
      <View style={styles.actionGrid}>
        {ACTIONS.map((action) => (
          <TouchableOpacity
            key={action.label}
            style={styles.actionCard}
            onPress={() => router.push((action.route === "/leave/admin-review" ? reviewHref : action.route) as never)}
          >
            <View style={styles.actionIcon}>
              <MaterialIcons name={action.icon} size={22} color={colors.onPrimary} />
            </View>
            <Text style={styles.actionTitle}>{action.label}</Text>
            <Text style={styles.actionHint}>{action.hint}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </WebShell>
  );
}

const styles = StyleSheet.create({
  kicker: { fontSize: 11, fontWeight: "700", color: colors.accentDeep, textTransform: "uppercase", letterSpacing: 1.2 },
  h: { fontSize: 20, fontWeight: "700", color: colors.onSurface, marginTop: 4 },
  meta: { fontSize: 12, color: colors.secondary, marginTop: 2 },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    minHeight: 44,
  },
  search: { flex: 1, minHeight: 44, color: colors.onSurface },
  stats: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  stat: { flexGrow: 1, flexBasis: 200, gap: 6 },
  num: { fontSize: 32, fontWeight: "700", color: colors.onSurface },
  cta: { marginTop: 4, alignSelf: "flex-start", backgroundColor: colors.accent, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  ctaText: { color: colors.onPrimary, fontWeight: "700", fontSize: 12 },
  section: { fontSize: 13, fontWeight: "700", color: colors.onSurface, textTransform: "uppercase", letterSpacing: 0.8 },
  actionGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  actionCard: {
    flexGrow: 1,
    flexBasis: 280,
    maxWidth: "100%",
    minHeight: 132,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderLeftWidth: 3,
    borderLeftColor: colors.accent,
    padding: 16,
    gap: 8,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  actionTitle: { fontSize: 15, fontWeight: "700", color: colors.onSurface },
  actionHint: { fontSize: 12, color: colors.secondary, lineHeight: 16 },
});
