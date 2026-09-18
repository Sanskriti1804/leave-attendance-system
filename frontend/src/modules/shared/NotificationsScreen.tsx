import React from "react";
import { View, Text, StyleSheet, ScrollView, SafeAreaView } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { colors } from "../../theme";
import { ScreenGradient } from "../../components/ui/AppChrome";
import { EmployeeBottomNavBar } from "../../components/ui/EmployeeComponents";
import { TopNavBar, useTopNavContentInset } from "../../components/ui/AdminComponents";

export default function NotificationsScreen() {
  const topInset = useTopNavContentInset();
  return (
    <ScreenGradient>
      <SafeAreaView style={styles.safe}>
        <TopNavBar title="Notifications" />
        <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: topInset }]} showsVerticalScrollIndicator={false}>
          <View style={styles.empty}>
            <MaterialIcons name="notifications-none" size={28} color={colors.secondary} />
            <Text style={styles.title}>No notifications yet</Text>
            <Text style={styles.copy}>
              In-app notification APIs are not implemented. This list stays empty rather than showing sample leave or punch events.
            </Text>
          </View>
        </ScrollView>
        <EmployeeBottomNavBar activeRoute="notifications" />
      </SafeAreaView>
    </ScreenGradient>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingBottom: 120, gap: 12 },
  empty: {
    marginTop: 24,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 12,
    padding: 20,
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.onSurface,
  },
  copy: {
    fontSize: 14,
    color: colors.secondary,
    lineHeight: 20,
  },
});
