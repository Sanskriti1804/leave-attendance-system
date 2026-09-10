import { View, Text, StyleSheet } from "react-native";
import { AppIcon } from "../../components";
import { colors, spacing, typography } from "../../src/maxstarter/theme";
import { assets } from "../../src/maxstarter/assets";
import { designContent } from "../../src/maxstarter/design";

export default function HomeScreen() {
  // MAXSTARTER:BEGIN home-copy
  const homeTitle = designContent.home.title;
  const homeSubtitle = designContent.home.subtitle;
  // MAXSTARTER:END home-copy

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.appName}>{assets.appName}</Text>
        <Text style={styles.title}>{homeTitle}</Text>
        <Text style={styles.subtitle}>{homeSubtitle}</Text>
      </View>

      <View style={styles.iconRow}>
        <View style={styles.iconItem}>
          <AppIcon name="home" size={28} color={colors.primary} />
          <Text style={styles.iconLabel}>Home</Text>
        </View>
        <View style={styles.iconItem}>
          <AppIcon name="search" size={28} color={colors.primary} />
          <Text style={styles.iconLabel}>Search</Text>
        </View>
        <View style={styles.iconItem}>
          <AppIcon name="profile" size={28} color={colors.primary} />
          <Text style={styles.iconLabel}>Profile</Text>
        </View>
        <View style={styles.iconItem}>
          <AppIcon name="settings" size={28} color={colors.primary} />
          <Text style={styles.iconLabel}>Settings</Text>
        </View>
      </View>

      <View style={styles.content}>
        {/* TODO: Replace this placeholder UI with your application design. */}
        <Text style={styles.body}>
          This is your starter Home Screen. Add product content, feeds, or dashboards here.
        </Text>
        {/* TODO: Add your application's business logic here. */}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
    paddingTop: spacing.xxl,
  },
  header: { marginBottom: spacing.xl },
  appName: {
    fontSize: typography.sizes.sm,
    color: colors.muted,
    marginBottom: spacing.xs,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  title: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  subtitle: {
    fontSize: typography.sizes.md,
    color: colors.muted,
    marginTop: spacing.sm,
  },
  iconRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.xl,
  },
  iconItem: {
    alignItems: "center",
    gap: spacing.xs,
  },
  iconLabel: {
    fontSize: typography.sizes.xs,
    color: colors.muted,
  },
  content: {
    flex: 1,
  },
  body: {
    fontSize: typography.sizes.md,
    color: colors.text,
    lineHeight: 24,
  },
});
