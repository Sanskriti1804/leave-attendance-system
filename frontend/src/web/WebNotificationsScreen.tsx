import React, { useEffect, useState } from "react";
import { Text, StyleSheet, ActivityIndicator } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { colors } from "../theme";
import { WebCard, WebShell } from "./WebShell";
import { apiErrorMessage, listMyNotifications, type AppNotification } from "../../services/resources";
import { formatDateTimeIST } from "../utils/date";

export default function WebNotificationsScreen() {
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await listMyNotifications();
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
  }, []);

  return (
    <WebShell title="Notifications" variant="employee" activeRoute="notifications">
      {loading ? <ActivityIndicator color={colors.primary} /> : null}
      {error ? <Text style={styles.copy}>{error}</Text> : null}
      {!loading && items.length === 0 ? (
        <WebCard>
          <MaterialIcons name="notifications-none" size={22} color={colors.secondary} />
          <Text style={styles.title}>No notifications yet</Text>
          <Text style={styles.copy}>Leave approvals and rejections will appear here.</Text>
        </WebCard>
      ) : null}
      {items.map((item) => (
        <WebCard key={item.notificationId}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.time}>{item.createdAt ? formatDateTimeIST(item.createdAt) : ""}</Text>
          <Text style={styles.copy}>{item.message}</Text>
        </WebCard>
      ))}
    </WebShell>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 16, fontWeight: "600", color: colors.onSurface, marginTop: 4 },
  time: { fontSize: 12, color: colors.secondary, marginTop: 4 },
  copy: { fontSize: 14, color: colors.secondary, lineHeight: 20, marginTop: 6, maxWidth: 640 },
});
