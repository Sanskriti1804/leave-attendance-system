import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { getSession } from "../../services/auth";
import { displayName, getMe, listEmployees, listLeaves, type EmployeePublic, type LeaveApplication } from "../../services/resources";
import { colors } from "../theme";
import { WebCard, WebShell } from "./WebShell";

export default function WebAdminDashboardScreen() {
  const router = useRouter();
  const reviewHref = (process.env.EXPO_PUBLIC_ADMIN_LEAVE_REVIEW as string | undefined) || "/leave/admin-review";
  const [me, setMe] = useState<EmployeePublic | null>(null);
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

  return (
    <WebShell title="Admin Dashboard" variant="admin" activeRoute="home">
      <WebCard>
        <Text style={styles.kicker}>HR Operations</Text>
        <Text style={styles.h}>{me ? displayName(me).toUpperCase() : "—"}</Text>
        <Text style={styles.meta}>{me?.role ?? "—"}</Text>
      </WebCard>
      <TextInput style={styles.search} placeholder="Search employees, records, or departments..." value={query} onChangeText={setQuery} placeholderTextColor={colors.secondary} />
      <View style={styles.stats}>
        <WebCard style={styles.stat}>
          <Text style={styles.kicker}>Active entities</Text>
          <Text style={styles.num}>{employeeTotal ?? 0}</Text>
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
        <Text style={styles.h}>HR Quick Actions</Text>
        <TouchableOpacity style={styles.cta} onPress={() => router.push(reviewHref as never)}>
          <Text style={styles.ctaText}>Leave approval / review</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cta} onPress={() => router.push("/leave/types" as never)}>
          <Text style={styles.ctaText}>Leave types</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cta} onPress={() => router.push("/org-settings" as never)}>
          <Text style={styles.ctaText}>Holiday management</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cta} onPress={() => router.push("/attendance-corrections" as never)}>
          <Text style={styles.ctaText}>Attendance corrections</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cta} onPress={() => router.push("/people" as never)}>
          <Text style={styles.ctaText}>People directory</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cta} onPress={() => router.push("/org-settings" as never)}>
          <Text style={styles.ctaText}>Organisation settings</Text>
        </TouchableOpacity>
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
