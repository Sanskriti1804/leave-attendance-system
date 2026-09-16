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
          <Text style={styles.section}>My Updates</Text>
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
            <Text style={styles.itemCopy}>
              Your Casual Leave for Oct 21, 2026 has been authorized by S. Raman (Product Eng) and validated by HR.
            </Text>
            <View style={styles.chip}>
              <Text style={styles.chipText}>Status: Approved • Quota deducted: 1.0 Day</Text>
            </View>
          </View>
          <View style={styles.card}>
            <View style={styles.rowTop}>
              <View style={styles.iconWrap}>
                <MaterialIcons name="schedule" size={20} color={colors.onSurface} />
              </View>
              <View style={styles.rowBody}>
                <Text style={styles.itemTitle}>Shift Check-In Verified</Text>
                <Text style={styles.itemTime}>08:58 AM</Text>
              </View>
            </View>
            <Text style={styles.itemCopy}>
              Biometric punch logged at 08:58:12 AM EST. Geofence location: New York HQ Floor 4. Shift window active.
            </Text>
          </View>

          <Text style={styles.section}>Yesterday</Text>
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
              Corporate office will remain closed on Friday, Nov 27 for Thanksgiving weekend. Punch clocks will be set to
              holiday bypass.
            </Text>
          </View>
          <Text style={styles.note}>
            Notification APIs are not implemented. This layout matches the employee Stitch alerts screen; live feed is not
            available.
          </Text>
        </ScrollView>
        <EmployeeBottomNavBar activeRoute="notifications" />
      </SafeAreaView>
    </ScreenGradient>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  kicker: {
    fontFamily: "Inter",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: colors.secondary,
  },
  title: {
    fontFamily: "Inter",
    fontSize: 22,
    fontWeight: "800",
    color: colors.onSurface,
    letterSpacing: -0.4,
  },
  subtitle: { fontFamily: "Inter", fontSize: 12, color: colors.secondary, marginTop: 2 },
  scroll: { paddingHorizontal: 16, paddingBottom: 120, gap: 12 },
  section: {
    fontFamily: "Inter",
    fontSize: 12,
    fontWeight: "700",
    color: colors.secondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 8,
  },
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
  chip: {
    alignSelf: "flex-start",
    backgroundColor: colors.surfaceContainer,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  chipText: { fontFamily: "Inter", fontSize: 11, fontWeight: "600", color: colors.onSurface },
  note: { fontFamily: "Inter", fontSize: 11, color: colors.secondary, lineHeight: 16, marginTop: 4 },
});
