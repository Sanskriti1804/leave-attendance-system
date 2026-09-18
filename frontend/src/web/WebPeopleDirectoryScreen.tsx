import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, TextInput, ActivityIndicator } from "react-native";
import { getSession } from "../../services/auth";
import { displayName, getMe, listEmployees, type EmployeePublic } from "../../services/resources";
import { colors } from "../theme";
import { WebCard, WebShell } from "./WebShell";

export default function WebPeopleDirectoryScreen() {
  const [items, setItems] = useState<EmployeePublic[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await getSession();
        await getMe().catch(() => null);
        const people = await listEmployees();
        if (!cancelled) setItems(people.items);
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

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return items;
    return items.filter((row) => `${row.firstName} ${row.lastName ?? ""} ${row.email}`.toLowerCase().includes(term));
  }, [items, query]);

  return (
    <WebShell title="People" variant="admin" activeRoute="people">
      <TextInput style={styles.search} placeholder="Search employees" value={query} onChangeText={setQuery} placeholderTextColor={colors.secondary} />
      {loading ? <ActivityIndicator color={colors.primary} /> : null}
      {error ? <Text style={styles.meta}>{error}</Text> : null}
      <WebCard>
        <View style={styles.head}>
          <Text style={[styles.th, { flex: 1.4 }]}>Name</Text>
          <Text style={[styles.th, { flex: 0.8 }]}>ID</Text>
          <Text style={[styles.th, { flex: 1 }]}>Role</Text>
          <Text style={[styles.th, { flex: 2 }]}>Email</Text>
        </View>
        {filtered.map((row) => (
          <View key={row.employeeId} style={styles.tr}>
            <Text style={[styles.td, { flex: 1.4 }]}>{displayName(row)}</Text>
            <Text style={[styles.td, { flex: 0.8 }]}>EMP-{row.employeeId}</Text>
            <Text style={[styles.td, { flex: 1 }]}>{row.role}</Text>
            <Text style={[styles.td, { flex: 2 }]}>{row.email}</Text>
          </View>
        ))}
      </WebCard>
    </WebShell>
  );
}

const styles = StyleSheet.create({
  search: { backgroundColor: "#fff", borderRadius: 10, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12, minHeight: 44, color: colors.onSurface },
  meta: { fontSize: 12, color: colors.secondary },
  head: { flexDirection: "row", paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: colors.surfaceContainerHighest },
  th: { fontSize: 11, fontWeight: "700", color: colors.secondary, textTransform: "uppercase" },
  tr: { flexDirection: "row", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.surfaceContainerHighest },
  td: { fontSize: 13, color: colors.onSurface },
});
