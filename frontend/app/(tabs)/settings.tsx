import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { AppIcon } from "../../components";
import { colors, spacing, typography } from "../../src/maxstarter/theme";
import { logout } from "../../services/auth";

export default function SettingsScreen() {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <AppIcon name="settings" size={32} color={colors.primary} />
        <Text style={styles.title}>Settings</Text>
      </View>
      <Text style={styles.body}>
        Account session uses the existing auth service. Attendance punch APIs are not available.
      </Text>
      <TouchableOpacity
        onPress={async () => {
          await logout();
          router.replace("/login");
        }}
        style={{ marginTop: spacing.md, paddingVertical: spacing.sm }}
      >
        <Text style={{ color: colors.primary, fontWeight: "600" }}>Log out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  body: { fontSize: typography.sizes.md, color: colors.muted },
});
