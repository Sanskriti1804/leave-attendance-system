import { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { colors, spacing, typography } from "../src/maxstarter/theme";
import { assets } from "../src/maxstarter/assets";
import { Logo } from "../src/maxstarter/Logo";
import { designContent } from "../src/maxstarter/design";

export default function SplashScreen() {
  const router = useRouter();

  // MAXSTARTER:BEGIN splash-config
  const splashDuration = designContent.splash.durationMs;
  // MAXSTARTER:END splash-config

  useEffect(() => {
    const timer = setTimeout(() => {
      // Route depends on features selected at generation time.
      router.replace("/login");
    }, splashDuration);

    return () => clearTimeout(timer);
  }, [router, splashDuration]);

  return (
    <View style={styles.container}>
      <Logo style={styles.logo} />
      <Text style={styles.title}>{assets.appName}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  logo: {
    width: 96,
    height: 96,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.text,
    fontFamily: typography.headingFont === "System" ? undefined : typography.headingFont,
  },
});
