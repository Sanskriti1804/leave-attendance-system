import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TextInput, ActivityIndicator } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { getSession } from "../../../services/auth";
import { displayName, getMe, listEmployees, type EmployeePublic } from "../../../services/resources";
import { colors } from "../../theme";
import { GlassCard, RoleBottomNav, ScreenGradient } from "../../components/ui/AppChrome";

export default function PeopleDirectoryScreen() {
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
        if (!cancelled) {
          setItems(people.items);
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

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) {
      return items;
    }
    return items.filter((row) => `${row.firstName} ${row.lastName ?? ""} ${row.email}`.toLowerCase().includes(term));
  }, [items, query]);

  return (
    <ScreenGradient>
      <SafeAreaView style={styles.safe}>
        <Text style={styles.header}>PEOPLE</Text>
        <ScrollView contentContainerStyle={styles.content}>
          <GlassCard style={styles.search}>
            <MaterialIcons name="search" size={20} color={colors.secondary} />
            <TextInput
              style={styles.input}
              placeholder="Search employees"
              placeholderTextColor={colors.secondary}
              value={query}
              onChangeText={setQuery}
            />
          </GlassCard>
          {loading ? <ActivityIndicator color={colors.primary} /> : null}
          {error ? <Text style={styles.meta}>{error}</Text> : null}
          {filtered.map((row) => (
            <GlassCard key={row.employeeId} style={styles.row}>
              <Text style={styles.name}>{displayName(row)}</Text>
              <Text style={styles.meta}>
                EMP-{row.employeeId} · {row.role} · {row.email}
              </Text>
            </GlassCard>
          ))}
        </ScrollView>
        <RoleBottomNav variant="admin" activeRoute="people" />
      </SafeAreaView>
    </ScreenGradient>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    fontFamily: "Inter",
    fontSize: 20,
    fontWeight: "900",
    textTransform: "uppercase",
    color: colors.onSurface,
    letterSpacing: -0.3,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  content: { padding: 16, paddingBottom: 110, gap: 12 },
  search: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12 },
  input: { flex: 1, fontFamily: "Inter", fontSize: 12, color: colors.onSurface },
  row: { gap: 4 },
  name: { fontFamily: "Inter", fontSize: 16, fontWeight: "500", color: colors.onSurface },
  meta: { fontFamily: "Inter", fontSize: 12, color: colors.secondary },
});
