import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { getSession } from "../../services/auth";
import { displayName, getMe, listEmployees, listLeaves, type EmployeePublic, type LeaveApplication } from "../../services/resources";
import { colors } from "../theme";
import { WebCard, WebShell } from "./WebShell";
import { UIFallbackIndicator } from "../components/ui/UIFallback";

export default function WebAdminDashboardScreen() {
  const router = useRouter();
  const reviewHref = (process.env.EXPO_PUBLIC_ADMIN_LEAVE_REVIEW as string | undefined) || "/leave/admin-review";
  const [me, setMe] = useState<EmployeePublic | null>(null);
  const [employees, setEmployees] = useState<EmployeePublic[]>([]);
  const [pending, setPending] = useState<LeaveApplication[]>([]);
  const [approved, setApproved] = useState<LeaveApplication[]>([]);
  const [query, setQuery] = useState("");
  const [employeeTotal, setEmployeeTotal] = useState<number | null>(null);

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

  const filteredEmployees = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return employees;
    return employees.filter((row) => `${row.firstName} ${row.lastName ?? ""} ${row.email}`.toLowerCase().includes(term));
  }, [employees, query]);

  const today = new Date().toISOString().slice(0, 10);
  const onLeaveToday = approved.filter((row) => row.startDate <= today && row.endDate >= today).length;

  return (
    <WebShell title="Admin Dashboard" variant="admin" activeRoute="home">
      <WebCard>
        <Text style={styles.kicker}>HR Operations</Text>
        <Text style={styles.h}>{me ? displayName(me).toUpperCase() : "PREETI KAUR"}</Text>
        <Text style={styles.meta}>{me?.role ?? "Human Resource"}</Text>
      </WebCard>
      <TextInput style={styles.search} placeholder="Search employees, records, or departments..." value={query} onChangeText={setQuery} placeholderTextColor={colors.secondary} />
      <View style={styles.stats}>
        <WebCard style={styles.stat}>
          <Text style={styles.kicker}>Active entities</Text>
          <Text style={styles.num}>{employeeTotal ?? "67"}</Text>
          {employeeTotal === null ? <UIFallbackIndicator /> : null}
        </WebCard>
        <WebCard style={styles.stat}>
          <Text style={styles.kicker}>On leave today</Text>
          <Text style={styles.num}>{onLeaveToday}</Text>
        </WebCard>
        <WebCard style={styles.stat}>
          <Text style={styles.kicker}>Pending reviews</Text>
          <Text style={styles.num}>{pending.length}</Text>
          <TouchableOpacity style={styles.cta} onPress={() => router.push(reviewHref as never)}>
            <Text style={styles.ctaText}>Review Queue</Text>
          </TouchableOpacity>
        </WebCard>
      </View>
      <WebCard>
        <Text style={styles.h}>Directory snapshot</Text>
        {filteredEmployees.slice(0, 8).map((row) => (
          <View key={row.employeeId} style={styles.row}>
            <Text style={styles.body}>{displayName(row)}</Text>
            <Text style={styles.meta}>
              {row.email} · {row.role}
            </Text>
          </View>
        ))}
      </WebCard>
    </WebShell>
  );
}

const styles = StyleSheet.create({
  kicker: { fontSize: 11, fontWeight: "700", color: colors.secondary, textTransform: "uppercase", letterSpacing: 0.5 },
  h: { fontSize: 20, fontWeight: "700", color: colors.onSurface, marginTop: 4 },
  meta: { fontSize: 12, color: colors.secondary, marginTop: 2 },
  body: { fontSize: 14, fontWeight: "600", color: colors.onSurface },
  search: { backgroundColor: "#fff", borderRadius: 10, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12, minHeight: 44, color: colors.onSurface },
  stats: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  stat: { flexGrow: 1, flexBasis: 200 },
  num: { fontSize: 32, fontWeight: "700", color: colors.onSurface, marginTop: 8 },
  cta: { marginTop: 12, alignSelf: "flex-start", backgroundColor: colors.primary, borderRadius: 6, paddingHorizontal: 12, paddingVertical: 8 },
  ctaText: { color: colors.onPrimary, fontWeight: "700", fontSize: 12 },
  row: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.surfaceContainerHighest },
});
