import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, SafeAreaView, ActivityIndicator } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { colors } from "../../theme";
import { ScreenGradient } from "../../components/ui/AppChrome";
import { EmployeeBottomNavBar } from "../../components/ui/EmployeeComponents";
import { TopNavBar, useTopNavContentInset } from "../../components/ui/AdminComponents";
import { apiErrorMessage, listMyNotifications, type AppNotification } from "../../../services/resources";
import { formatDateTimeIST } from "../../utils/date";

export default function NotificationsScreen() {
  const topInset = useTopNavContentInset();
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
    <ScreenGradient>
      <SafeAreaView style={styles.safe}>
        <TopNavBar title="Notifications" />
        <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: topInset }]} showsVerticalScrollIndicator={false}>
          {loading ? <ActivityIndicator color={colors.primary} /> : null}
          {error ? <Text style={styles.copy}>{error}</Text> : null}
          {!loading && !error && items.length === 0 ? (
            <View style={styles.empty}>
              <MaterialIcons name="notifications-none" size={28} color={colors.secondary} />
              <Text style={styles.title}>No notifications yet</Text>
              <Text style={styles.copy}>Leave submit, approval, and rejection updates will appear here.</Text>
            </View>
          ) : null}
          {items.map((item) => (
            <View key={item.notificationId} style={styles.card}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.time}>{item.createdAt ? formatDateTimeIST(item.createdAt) : ""}</Text>
              <Text style={styles.copy}>{item.message}</Text>
            </View>
          ))}
        </ScrollView>
        <EmployeeBottomNavBar activeRoute="notifications" />
      </SafeAreaView>
    </ScreenGradient>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingBottom: 120, gap: 12 },
  empty: { marginTop: 24, backgroundColor: colors.surfaceContainerLowest, borderRadius: 16, padding: 22, gap: 8, borderWidth: 1, borderColor: colors.glassBorder },
  card: { backgroundColor: colors.surfaceContainerLowest, borderRadius: 16, padding: 16, gap: 6, borderWidth: 1, borderColor: colors.glassBorder },
  title: { fontSize: 16, fontWeight: "700", color: colors.onSurface },
  time: { fontSize: 12, color: colors.secondary },
  copy: { fontSize: 14, color: colors.secondary, lineHeight: 20 },
});
