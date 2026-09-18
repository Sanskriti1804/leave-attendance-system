import React from "react";
import { Text, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { colors } from "../theme";
import { WebCard, WebShell } from "./WebShell";

export default function WebNotificationsScreen() {
  return (
    <WebShell title="Notifications" variant="employee" activeRoute="notifications">
      <WebCard>
        <MaterialIcons name="notifications-none" size={22} color={colors.secondary} />
        <Text style={styles.title}>No notifications yet</Text>
        <Text style={styles.copy}>
          In-app notification APIs are not implemented. This list stays empty rather than showing sample leave or punch events.
        </Text>
      </WebCard>
    </WebShell>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 18, fontWeight: "600", color: colors.onSurface, marginTop: 8 },
  copy: { fontSize: 14, color: colors.secondary, lineHeight: 20, marginTop: 6, maxWidth: 640 },
});
