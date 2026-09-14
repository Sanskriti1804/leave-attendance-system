import { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useRouter, type Href } from "expo-router";
import { colors, spacing, typography } from "../../maxstarter/theme";
import { assets } from "../../maxstarter/assets";
import { Logo } from "../../maxstarter/Logo";
import { designContent } from "../../maxstarter/design";

/** Post-auth destination for EXPO_PUBLIC_START_SCREEN. `/login` keeps the default home tab. */
export function getPostLoginRoute(): Href {
  const start = process.env.EXPO_PUBLIC_START_SCREEN;
  if (start === "/") {
    return "/(tabs)";
  }
  if (start === "/profile") {
    return "/(tabs)/profile";
  }
  if (start === "/admin") {
    return "/admin";
  }
  return "/(tabs)";
}

export default function SplashScreen() {
  const router = useRouter();

  // MAXSTARTER:BEGIN splash-config
  const splashDuration = designContent.splash.durationMs;
  // MAXSTARTER:END splash-config

  useEffect(() => {

    const timer = setTimeout(async () => {
      const session = await getSession();
      router.replace(session ? getPostLoginRoute() : "/login");
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
