import { View, Text, StyleSheet } from "react-native";
import { AppIcon } from "../../components";
import { colors, spacing, typography } from "../../src/maxstarter/theme";

export default function SettingsScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <AppIcon name="settings" size={32} color={colors.primary} />
        <Text style={styles.title}>Settings</Text>
      </View>
      <Text style={styles.body}>
        {/* TODO: Replace this placeholder UI with your application design. */}
        Minimal settings screen. Add preferences here.
      </Text>
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
