import React from "react";
import { Text, StyleSheet } from "react-native";
import { colors } from "../theme";
import { WebCard, WebShell } from "./WebShell";

export default function WebNotificationsScreen() {
  return (
    <WebShell title="Notifications" variant="employee" activeRoute="notifications">
      <Text style={styles.section}>My Updates</Text>
      <WebCard>
        <Text style={styles.title}>Leave Request Approved</Text>
        <Text style={styles.time}>2h ago</Text>
        <Text style={styles.copy}>
          Your Casual Leave for Oct 21, 2026 has been authorized by S. Raman (Product Eng) and validated by HR.
        </Text>
      </WebCard>
      <WebCard>
        <Text style={styles.title}>Shift Check-In Verified</Text>
        <Text style={styles.time}>08:58 AM</Text>
        <Text style={styles.copy}>
          Biometric punch logged at 08:58:12 AM EST. Geofence location: New York HQ Floor 4. Shift window active.
        </Text>
      </WebCard>
      <Text style={styles.section}>Yesterday</Text>
      <WebCard>
        <Text style={styles.title}>HR Announcement</Text>
        <Text style={styles.copy}>
          Corporate office will remain closed on Friday, Nov 27 for Thanksgiving weekend. Punch clocks will be set to holiday
          bypass.
        </Text>
      </WebCard>
      <Text style={styles.note}>Notification APIs are not implemented. Live feed is not available.</Text>
    </WebShell>
  );
}

const styles = StyleSheet.create({
  section: { fontSize: 12, fontWeight: "700", color: colors.secondary, textTransform: "uppercase", letterSpacing: 0.5 },
  title: { fontSize: 16, fontWeight: "600", color: colors.onSurface },
  time: { fontSize: 12, color: colors.secondary, marginTop: 2 },
  copy: { fontSize: 14, color: colors.onSurfaceVariant, marginTop: 8, lineHeight: 20, maxWidth: 720 },
  note: { fontSize: 12, color: colors.secondary, lineHeight: 18 },
});
