import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, TextInput, ActivityIndicator, TouchableOpacity } from "react-native";
import { getSession } from "../../services/auth";
import {
  displayName,
  getMe,
  listDepartments,
  listEmployees,
  type Department,
  type EmployeePublic,
} from "../../services/resources";
import { colors } from "../theme";
import { WebCard, WebShell } from "./WebShell";
import { UserAvatar } from "../components/ui/UserAvatar";
import { matchesPeopleQuery } from "../utils/workforce";

export default function WebPeopleDirectoryScreen() {
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
        if (!cancelled) setError(err instanceof Error ? err.message : "Unable to load directory.");
      } finally {
        if (!cancelled) setLoading(false);
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
    <WebShell title="People" variant="admin" activeRoute="people">
      <TextInput
        style={styles.search}
        placeholder="Search name, email, role, or team"
        value={query}
        onChangeText={setQuery}
        placeholderTextColor={colors.secondary}
      />
      <Text style={styles.meta}>
        {items.length} people · {departments.length || "—"} teams
      </Text>
      {loading ? <ActivityIndicator color={colors.primary} /> : null}
      {error ? <Text style={styles.meta}>{error}</Text> : null}
      {groups.map(([department, people]) => (
        <WebCard key={department}>
          <Text style={styles.group}>{department} · {people.length}</Text>
          <View style={styles.grid}>
            {people.map((row) => (
              <TouchableOpacity key={row.employeeId} style={styles.personCard} activeOpacity={0.8}>
                <UserAvatar employee={row} size={40} />
                <Text style={styles.name}>{displayName(row)}</Text>
                <Text style={styles.meta}>{row.email}</Text>
                <Text style={styles.td}>EMP-{row.employeeId} · {row.role.replaceAll("_", " ")}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </WebCard>
      ))}
      {!loading && groups.length === 0 ? <Text style={styles.meta}>No people match this search.</Text> : null}
    </WebShell>
  );
}

const styles = StyleSheet.create({
  search: { backgroundColor: "#fff", borderRadius: 10, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12, minHeight: 44, color: colors.onSurface },
  meta: { fontSize: 12, color: colors.secondary },
  group: { fontSize: 12, fontWeight: "700", color: colors.secondary, textTransform: "uppercase", marginBottom: 8 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  personCard: {
    flexGrow: 1,
    flexBasis: 180,
    maxWidth: 280,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 12,
    padding: 12,
    gap: 6,
  },
  name: { fontSize: 14, fontWeight: "700", color: colors.onSurface },
  td: { fontSize: 13, color: colors.onSurface },
});
