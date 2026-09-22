import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, SafeAreaView, ActivityIndicator, TouchableOpacity } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { colors } from "../../theme";
import { ScreenGradient } from "../../components/ui/AppChrome";
import { EmployeeBottomNavBar } from "../../components/ui/EmployeeComponents";
import { TopNavBar, useTopNavContentInset } from "../../components/ui/AdminComponents";
import { apiErrorMessage, listMyNotifications, markNotificationRead, type AppNotification } from "../../../services/resources";
import { formatDateTimeIST } from "../../utils/date";
import { displayNotification } from "../../utils/notifications";

export default function NotificationsScreen() {
  const topInset = useTopNavContentInset();
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
    <ScreenGradient>
      <SafeAreaView style={styles.safe}>
        <TopNavBar title={unreadCount ? `Notifications · ${unreadCount} unread` : "Notifications"} />
        <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: topInset }]} showsVerticalScrollIndicator={false}>
          {loading ? <ActivityIndicator color={colors.primary} /> : null}
          {error ? <Text style={styles.copy}>{error}</Text> : null}
          {!loading && !error && items.length === 0 ? (
            <View style={styles.empty}>
              <MaterialIcons name="notifications-none" size={28} color={colors.secondary} />
              <Text style={styles.title}>No notifications yet</Text>
              <Text style={styles.copy}>Leave decisions, medical reminders, and attendance alerts appear here.</Text>
            </View>
          ) : null}
          {items.map((item) => {
              const copy = displayNotification(item);
              return (
            <TouchableOpacity
              key={item.notificationId}
              style={[styles.card, !item.isRead && styles.unread]}
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
              <Text style={styles.title}>{copy.title}</Text>
              <Text style={styles.time}>{item.createdAt ? formatDateTimeIST(item.createdAt) : ""}</Text>
              <Text style={styles.copy}>{copy.message}</Text>
            </TouchableOpacity>
              );
          })}
        </ScrollView>
        <EmployeeBottomNavBar activeRoute="notifications" />
      </SafeAreaView>
    </ScreenGradient>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingBottom: 120, gap: 12 },
  empty: { marginTop: 24, backgroundColor: colors.accentWash, borderRadius: 10, padding: 24, gap: 8 },
  card: { backgroundColor: colors.surfaceContainerLowest, borderRadius: 10, padding: 16, gap: 6, borderWidth: 1, borderColor: colors.glassBorder, borderLeftWidth: 3, borderLeftColor: colors.sand },
  unread: { borderLeftColor: colors.accent, backgroundColor: colors.accentWash },
  title: { fontSize: 16, fontWeight: "700", color: colors.onSurface },
  time: { fontSize: 12, color: colors.secondary },
  copy: { fontSize: 14, color: colors.secondary, lineHeight: 20 },
});
