import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator, TextInput, TouchableOpacity } from "react-native";
import { colors } from "../../theme";
import { apiErrorMessage, listAuditLogs, type AuditLogItem } from "../../../services/resources";
import { formatDateTimeIST } from "../../utils/date";

export function CompactAudit({ limit = 8 }: { limit?: number }) {
  const [items, setItems] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [action, setAction] = useState("all");
  const [actor, setActor] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await listAuditLogs(1, limit);
        if (!cancelled) setItems(result.items);
      } catch (err) {
        if (!cancelled) setError(apiErrorMessage(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [limit]);

  const actions = useMemo(() => ["all", ...new Set(items.map((item) => item.action))], [items]);
  const visible = items.filter((item) => {
    if (action !== "all" && item.action !== action) return false;
    const who = (item.actorName || `User ${item.userId}`).toLowerCase();
    return who.includes(actor.trim().toLowerCase());
  });

  if (error) {
    return null;
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.heading}>Recent Activities</Text>
      <TextInput
        style={styles.filter}
        value={actor}
        onChangeText={setActor}
        placeholder="Filter by user"
        placeholderTextColor={colors.secondary}
      />
      <View style={styles.chips}>
        {actions.slice(0, 6).map((value) => (
          <TouchableOpacity key={value} onPress={() => setAction(value)}>
            <Text style={value === action ? styles.chipOn : styles.chip}>{value}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {loading ? <ActivityIndicator color={colors.primary} /> : null}
      {!loading && items.length === 0 ? <Text style={styles.meta}>No audit events yet.</Text> : null}
      {visible.map((item) => (
        <View key={item.auditId} style={styles.row}>
          <Text style={styles.title} numberOfLines={1}>
            {item.action} · {item.entityType}
          </Text>
          <Text style={styles.meta} numberOfLines={1}>
            {item.actorName || `User ${item.userId}`} · {item.createdAt ? formatDateTimeIST(item.createdAt) : ""}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  heading: { fontFamily: "Inter", fontSize: 15, fontWeight: "700", color: colors.onSurface },
  filter: { minHeight: 36, borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 10, color: colors.onSurface },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: { fontSize: 11, color: colors.secondary, backgroundColor: colors.surfaceContainer, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, overflow: "hidden" },
  chipOn: { fontSize: 11, color: colors.onPrimary, backgroundColor: colors.primary, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, overflow: "hidden" },
  row: { gap: 2, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: "rgba(0,0,0,0.06)" },
  title: { fontFamily: "Inter", fontSize: 13, fontWeight: "600", color: colors.onSurface },
  meta: { fontFamily: "Inter", fontSize: 11, color: colors.secondary },
});
