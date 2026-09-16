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
          <View style={styles.sectionHead}>
            <Text style={styles.section}>My Updates</Text>
            <View style={styles.sectionLine} />
          </View>
          <View style={styles.card}>
            <View style={styles.rowTop}>
              <View style={styles.iconWrap}>
                <MaterialIcons name="check-circle" size={20} color={colors.onSurface} />
              </View>
              <View style={styles.rowBody}>
                <Text style={styles.itemTitle}>Leave Request Approved</Text>
                <Text style={styles.itemTime}>2h ago</Text>
              </View>
            </View>
            <Text style={styles.itemCopy}>Casual Leave for Oct 21, 2026 was approved.</Text>
          </View>
          <View style={styles.card}>
            <View style={styles.rowTop}>
              <View style={styles.iconWrap}>
                <MaterialIcons name="schedule" size={20} color={colors.onSurface} />
              </View>
              <View style={styles.rowBody}>
                <Text style={styles.itemTitle}>Logged in at 09:12 AM</Text>
                <Text style={styles.itemTime}>Today</Text>
              </View>
            </View>
            <Text style={styles.itemCopy}>Wednesday, 16 Sep 2026</Text>
          </View>

          <View style={styles.sectionHead}>
            <Text style={styles.section}>Yesterday</Text>
            <View style={styles.sectionLine} />
          </View>
          <View style={styles.card}>
            <View style={styles.rowTop}>
              <View style={styles.iconWrap}>
                <MaterialIcons name="campaign" size={20} color={colors.onSurface} />
              </View>
              <View style={styles.rowBody}>
                <Text style={styles.itemTitle}>HR Announcement</Text>
              </View>
            </View>
            <Text style={styles.itemCopy}>
              Corporate office will remain closed on Friday, Nov 27 for Thanksgiving weekend.
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
  sectionHead: { marginTop: 8, gap: 8 },
  section: {
    fontFamily: "Inter",
    fontSize: 16,
    fontWeight: "800",
    color: colors.onSurface,
  },
  sectionLine: { height: 1, backgroundColor: colors.glassBorder },
  card: {
    backgroundColor: colors.glass,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    padding: 16,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 4,
  },
  rowTop: { flexDirection: "row", alignItems: "center", gap: 10 },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceContainerHigh,
    alignItems: "center",
    justifyContent: "center",
  },
  rowBody: { flex: 1, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  itemTitle: { fontFamily: "Inter", fontSize: 14, fontWeight: "700", color: colors.onSurface, flex: 1 },
  itemTime: { fontFamily: "Inter", fontSize: 11, color: colors.secondary, marginLeft: 8 },
  itemCopy: { fontFamily: "Inter", fontSize: 13, color: colors.onSurfaceVariant, lineHeight: 18 },
});
