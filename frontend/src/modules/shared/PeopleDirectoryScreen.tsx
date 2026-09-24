import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TextInput, ActivityIndicator, TouchableOpacity } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { getSession } from "../../../services/auth";
import {
  apiErrorMessage,
  displayName,
  getMe,
  listDepartments,
  listEmployees,
  patchEmployee,
  type Department,
  type EmployeePublic,
} from "../../../services/resources";
import { colors } from "../../theme";
import { GlassCard, RoleBottomNav, ScreenGradient, ThemedDialog, ThemedToast } from "../../components/ui/AppChrome";
import { SCROLL_UNDER_BOTTOM_NAV, TopNavBar, useTopNavContentInset } from "../../components/ui/AdminComponents";
import { UserAvatar } from "../../components/ui/UserAvatar";
import { isTeamLead, matchesPeopleQuery, mergeEmployees, reportsOfLead, teamMembersForLead } from "../../utils/workforce";

export default function PeopleDirectoryScreen() {
  const topInset = useTopNavContentInset();
  const [items, setItems] = useState<EmployeePublic[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [me, setMe] = useState<EmployeePublic | null>(null);
  const [selected, setSelected] = useState<EmployeePublic | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await getSession();
        const profile = await getMe().catch(() => null);
        const [people, depts] = await Promise.all([
          listEmployees(),
          listDepartments().catch(() => ({ items: [] as Department[] })),
        ]);
        if (!cancelled) {
          setMe(profile);
          setItems(people.items);
          setDepartments(depts.items);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unable to load directory.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const deptName = (id: number) => departments.find((row) => row.departmentId === id)?.departmentName ?? `Department ${id}`;
  const canAssign = me?.role === "admin";

  async function designateTeamLead(lead: EmployeePublic) {
    if (!canAssign) {
      setToast("Guest Admin cannot change reporting relationships.");
      return;
    }
    setSaving(true);
    try {
      const targets = teamMembersForLead(items, lead.employeeId, lead.departmentId);
      const updated = await Promise.all(targets.map((row) => patchEmployee(row.employeeId, { managerId: lead.employeeId })));
      setItems((current) => mergeEmployees(current, updated));
      setToast(`${displayName(lead)} is now Team Lead for ${deptName(lead.departmentId)}.`);
    } catch (err) {
      setToast(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function removeTeamLead(lead: EmployeePublic) {
    if (!canAssign) {
      setToast("Guest Admin cannot change reporting relationships.");
      return;
    }
    setSaving(true);
    try {
      const reports = reportsOfLead(items, lead.employeeId);
      const updated = await Promise.all(reports.map((row) => patchEmployee(row.employeeId, { managerId: null })));
      setItems((current) => mergeEmployees(current, updated));
      setSelected(null);
      setToast(`${displayName(lead)} is no longer Team Lead.`);
    } catch (err) {
      setToast(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  const groups = useMemo(() => {
    const filtered = items.filter((row) => matchesPeopleQuery(row, query, deptName(row.departmentId)));
    const byDept = new Map<string, EmployeePublic[]>();
    for (const row of filtered) {
      const name = deptName(row.departmentId);
      const list = byDept.get(name) ?? [];
      list.push(row);
      byDept.set(name, list);
    }
    return [...byDept.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [departments, items, query]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  return (
    <ScreenGradient>
      <SafeAreaView style={styles.safe}>
        <TopNavBar title="People" />
        <ScrollView contentContainerStyle={[styles.content, { paddingTop: topInset }]}>
          <GlassCard style={styles.search}>
            <MaterialIcons name="search" size={20} color={colors.secondary} />
            <TextInput
              style={styles.input}
              placeholder="Search name, email, role, or team"
              placeholderTextColor={colors.secondary}
              value={query}
              onChangeText={setQuery}
            />
          </GlassCard>
          <Text style={styles.summary}>
            {items.length} people · {departments.length || "—"} teams
          </Text>
          {loading ? <ActivityIndicator color={colors.primary} /> : null}
          {error ? <Text style={styles.meta}>{error}</Text> : null}
          {groups.map(([department, people]) => (
            <View key={department} style={styles.group}>
              <View style={styles.groupHead}>
                <Text style={styles.groupTitle}>{department}</Text>
                <Text style={styles.groupCount}>{people.length}</Text>
              </View>
              <GlassCard style={styles.grid}>
                {people.map((row) => (
                  <TouchableOpacity key={row.employeeId} style={styles.personCard} activeOpacity={0.8} onPress={() => setSelected(row)}>
                    <UserAvatar employee={row} size={44} />
                    <Text style={styles.name} numberOfLines={1}>{displayName(row)}</Text>
                    {isTeamLead(items, row.employeeId) ? <Text style={styles.leadTag}>Team Lead</Text> : null}
                    {isTeamLead(items, row.employeeId) ? <Text style={styles.leadTag}>Approver</Text> : null}
                    <Text style={styles.meta} numberOfLines={1}>
                      {row.role.replaceAll("_", " ")} · EMP-{row.employeeId}
                    </Text>
                    <Text style={styles.email} numberOfLines={1}>
                      {row.email}
                    </Text>
                  </TouchableOpacity>
                ))}
              </GlassCard>
            </View>
          ))}
          {!loading && groups.length === 0 ? <Text style={styles.meta}>No people match this search.</Text> : null}
        </ScrollView>
        <RoleBottomNav variant="admin" activeRoute="people" />
        <ThemedDialog
          visible={selected != null}
          title={selected ? displayName(selected) : ""}
          onRequestClose={() => setSelected(null)}
          actions={
            selected
              ? [
                  { label: "Close", onPress: () => setSelected(null) },
                  ...(canAssign
                    ? [
                        isTeamLead(items, selected.employeeId)
                          ? { label: saving ? "Saving…" : "Remove Team Lead", onPress: () => void removeTeamLead(selected), primary: true }
                          : { label: saving ? "Saving…" : "Designate Team Lead", onPress: () => void designateTeamLead(selected), primary: true },
                      ]
                    : []),
                ]
              : []
          }
        >
          {selected ? (
            <View style={{ gap: 6 }}>
              {isTeamLead(items, selected.employeeId) ? <Text style={styles.leadTag}>Team Lead</Text> : null}
              <Text style={styles.meta}>{selected.email}</Text>
              <Text style={styles.meta}>{deptName(selected.departmentId)}</Text>
              <Text style={styles.meta}>{selected.role.replaceAll("_", " ")} · EMP-{selected.employeeId}</Text>
              <Text style={styles.meta}>
                Reporting manager: {selected.managerId ? displayName(items.find((row) => row.employeeId === selected.managerId) ?? null) : "—"}
              </Text>
            </View>
          ) : null}
        </ThemedDialog>
        <ThemedToast message={toast} />
      </SafeAreaView>
    </ScreenGradient>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: 16, paddingBottom: SCROLL_UNDER_BOTTOM_NAV, gap: 12 },
  leadTag: {
    alignSelf: "flex-start",
    backgroundColor: colors.primary,
    color: colors.onPrimary,
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    overflow: "hidden",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  search: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12 },
  input: { flex: 1, fontFamily: "Inter", fontSize: 13, color: colors.onSurface },
  summary: { fontFamily: "Inter", fontSize: 12, fontWeight: "600", color: colors.secondary, textTransform: "uppercase", letterSpacing: 0.4 },
  group: { gap: 8 },
  groupHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 4 },
  groupTitle: { fontFamily: "Inter", fontSize: 13, fontWeight: "700", color: colors.onSurface, textTransform: "uppercase", letterSpacing: 0.5 },
  groupCount: { fontSize: 12, color: colors.secondary },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10, padding: 12 },
  personCard: {
    width: "47%",
    flexGrow: 1,
    minWidth: 140,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 16,
    padding: 14,
    gap: 6,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  name: { fontFamily: "Inter", fontSize: 15, fontWeight: "600", color: colors.onSurface },
  meta: { fontFamily: "Inter", fontSize: 12, color: colors.secondary, marginTop: 2 },
  email: { fontFamily: "Inter", fontSize: 12, color: colors.onSurfaceVariant, marginTop: 2 },
});
