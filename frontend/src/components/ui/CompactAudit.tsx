import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { colors } from "../../theme";
import { apiErrorMessage, listAuditLogs, type AuditLogItem } from "../../../services/resources";
import { formatDateTimeIST } from "../../utils/date";

export function CompactAudit({ limit = 8 }: { limit?: number }) {
  const [items, setItems] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  if (error) {
    return null;
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.heading}>Audit trail</Text>
      {loading ? <ActivityIndicator color={colors.primary} /> : null}
      {!loading && items.length === 0 ? <Text style={styles.meta}>No audit events yet.</Text> : null}
      {items.map((item) => (
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
  row: { gap: 2, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: "rgba(0,0,0,0.06)" },
  title: { fontFamily: "Inter", fontSize: 13, fontWeight: "600", color: colors.onSurface },
  meta: { fontFamily: "Inter", fontSize: 11, color: colors.secondary },
});
