import React, { useEffect, useState } from "react";
import { Text, StyleSheet, ActivityIndicator, TouchableOpacity } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { colors } from "../theme";
import { WebCard, WebShell } from "./WebShell";
import { apiErrorMessage, listMyNotifications, markNotificationRead, type AppNotification } from "../../services/resources";
import { formatDateTimeIST } from "../utils/date";
import { displayNotification } from "../utils/notifications";

export default function WebNotificationsScreen() {
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
          setItems(result.items);
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
  }, []);

  return (
    <WebShell title={unreadCount ? `Notifications · ${unreadCount} unread` : "Notifications"} variant="employee" activeRoute="notifications">
      {loading ? <ActivityIndicator color={colors.primary} /> : null}
      {error ? <Text style={styles.copy}>{error}</Text> : null}
      {!loading && !error && items.length === 0 ? (
        <WebCard>
          <MaterialIcons name="notifications-none" size={22} color={colors.secondary} />
          <Text style={styles.title}>No notifications yet</Text>
          <Text style={styles.copy}>Leave decisions, medical reminders, and attendance alerts will appear here.</Text>
        </WebCard>
      ) : null}
      {items.map((item) => {
        const copy = displayNotification(item);
        return (
        <TouchableOpacity
          key={item.notificationId}
          onPress={() => {
            if (item.isRead) {
              return;
            }
            setItems((current) =>
              current.map((row) =>
                row.notificationId === item.notificationId ? { ...row, isRead: true } : row,
              ),
            );
            setUnreadCount((count) => Math.max(0, count - 1));
            void markNotificationRead(item.notificationId).catch(() => {
              setItems((current) =>
                current.map((row) =>
                  row.notificationId === item.notificationId ? { ...row, isRead: false } : row,
                ),
              );
              setUnreadCount((count) => count + 1);
            });
          }}
        >
          <WebCard>
            <Text style={styles.title}>{item.isRead ? copy.title : `${copy.title} · unread`}</Text>
            <Text style={styles.time}>{item.createdAt ? formatDateTimeIST(item.createdAt) : ""}</Text>
            <Text style={styles.copy}>{copy.message}</Text>
          </WebCard>
        </TouchableOpacity>
        );
      })}
    </WebShell>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 16, fontWeight: "600", color: colors.onSurface, marginTop: 4 },
  time: { fontSize: 12, color: colors.secondary, marginTop: 4 },
  copy: { fontSize: 14, color: colors.secondary, lineHeight: 20, marginTop: 6, maxWidth: 640 },
});
