import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { colors } from "../../theme";
import {
  apiErrorMessage,
  listMyNotifications,
  markNotificationRead,
  type AppNotification,
} from "../../../services/resources";
import { formatDateTimeIST } from "../../utils/date";
import { displayNotification } from "../../utils/notifications";

export function CompactNotifications({ limit = 6 }: { limit?: number }) {
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await listMyNotifications();
        if (!cancelled) {
          setItems(result.items.slice(0, limit));
          setUnreadCount(result.unreadCount ?? result.items.filter((row) => !row.isRead).length);
        }
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

  return (
    <View style={styles.wrap}>
      <Text style={styles.heading}>{unreadCount ? `Notifications · ${unreadCount} unread` : "Notifications"}</Text>
      {loading ? <ActivityIndicator color={colors.primary} /> : null}
      {error ? <Text style={styles.meta}>{error}</Text> : null}
      {!loading && !error && items.length === 0 ? (
        <Text style={styles.meta}>No notifications yet.</Text>
      ) : null}
      {items.map((item) => {
        const copy = displayNotification(item);
        return (
        <TouchableOpacity
          key={item.notificationId}
          style={styles.row}
          onPress={() => {
            if (item.isRead) return;
            setItems((current) =>
              current.map((row) => (row.notificationId === item.notificationId ? { ...row, isRead: true } : row)),
            );
            setUnreadCount((count) => Math.max(0, count - 1));
            void markNotificationRead(item.notificationId).catch(() => {
              setItems((current) =>
                current.map((row) => (row.notificationId === item.notificationId ? { ...row, isRead: false } : row)),
              );
              setUnreadCount((count) => count + 1);
            });
          }}
        >
          <View style={[styles.dot, { backgroundColor: item.isRead ? colors.sand : colors.accent }]} />
          <View style={styles.body}>
            <Text style={styles.title} numberOfLines={1}>
              {copy.title}
            </Text>
            <Text style={styles.copy} numberOfLines={2}>
              {copy.message}
            </Text>
            <Text style={styles.meta}>{item.createdAt ? formatDateTimeIST(item.createdAt) : ""}</Text>
          </View>
        </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  heading: { fontFamily: "Inter", fontSize: 15, fontWeight: "700", color: colors.onSurface },
  row: { flexDirection: "row", alignItems: "flex-start", gap: 10, paddingVertical: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
  body: { flex: 1, gap: 2 },
  title: { fontFamily: "Inter", fontSize: 13, fontWeight: "600", color: colors.onSurface },
  copy: { fontFamily: "Inter", fontSize: 12, color: colors.onSurfaceVariant, lineHeight: 16 },
  meta: { fontFamily: "Inter", fontSize: 11, color: colors.secondary },
});
