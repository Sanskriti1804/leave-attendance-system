import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TextInput, ActivityIndicator } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { getSession } from "../../../services/auth";
import {
  displayName,
  getMe,
  listDepartments,
  listEmployees,
  type Department,
  type EmployeePublic,
} from "../../../services/resources";
import { colors } from "../../theme";
import { GlassCard, RoleBottomNav, ScreenGradient } from "../../components/ui/AppChrome";
import { TopNavBar, useTopNavContentInset } from "../../components/ui/AdminComponents";
import { UserAvatar } from "../../components/ui/UserAvatar";
import { matchesPeopleQuery } from "../../utils/workforce";

export default function PeopleDirectoryScreen() {
  const topInset = useTopNavContentInset();
  const [items, setItems] = useState<EmployeePublic[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await getSession();
        await getMe().catch(() => null);
        const [people, depts] = await Promise.all([
          listEmployees(),
          listDepartments().catch(() => ({ items: [] as Department[] })),
        ]);
        if (!cancelled) {
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
              <GlassCard style={{ padding: 0, overflow: 'hidden' }}>
                {people.map((row, index) => (
                  <View key={row.employeeId} style={[styles.row, index < people.length - 1 && styles.rowDivider]}>
                    <UserAvatar employee={row} size={40} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.name}>{displayName(row)}</Text>
                      <Text style={styles.meta} numberOfLines={1}>
                        {row.role.replaceAll("_", " ")} · EMP-{row.employeeId}
                      </Text>
                      <Text style={styles.email} numberOfLines={1}>
                        {row.email}
                      </Text>
                    </View>
                  </View>
                ))}
              </GlassCard>
            </View>
          ))}
          {!loading && groups.length === 0 ? <Text style={styles.meta}>No people match this search.</Text> : null}
        </ScrollView>
        <RoleBottomNav variant="admin" activeRoute="people" />
      </SafeAreaView>
    </ScreenGradient>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: 16, paddingBottom: 110, gap: 12 },
  search: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12 },
  input: { flex: 1, fontFamily: "Inter", fontSize: 13, color: colors.onSurface },
  summary: { fontFamily: "Inter", fontSize: 12, fontWeight: "600", color: colors.secondary, textTransform: "uppercase", letterSpacing: 0.4 },
  group: { gap: 8 },
  groupHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 4 },
  groupTitle: { fontFamily: "Inter", fontSize: 13, fontWeight: "700", color: colors.onSurface, textTransform: "uppercase", letterSpacing: 0.5 },
  groupCount: { fontSize: 12, color: colors.secondary },
  row: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12 },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.06)' },
  name: { fontFamily: "Inter", fontSize: 15, fontWeight: "600", color: colors.onSurface },
  meta: { fontFamily: "Inter", fontSize: 12, color: colors.secondary, marginTop: 2 },
  email: { fontFamily: "Inter", fontSize: 12, color: colors.onSurfaceVariant, marginTop: 2 },
});
