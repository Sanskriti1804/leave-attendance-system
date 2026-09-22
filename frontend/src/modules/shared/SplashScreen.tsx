import { useEffect } from "react";
import { View, Text, StyleSheet, Image } from "react-native";
import { useRouter, type Href } from "expo-router";
import { ScreenGradient } from "../../components/ui/AppChrome";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getSession } from "../../../services/auth";
import { designContent } from "../../maxstarter/design";
import { getMe } from "../../../services/resources";
import { colors } from "../../theme";

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
  const insets = useSafeAreaInsets();

  // MAXSTARTER:BEGIN splash-config
  const splashDuration = designContent.splash.durationMs;
  // MAXSTARTER:END splash-config

  useEffect(() => {
    const timer = setTimeout(async () => {
      const session = await getSession();
      if (!session) {
        router.replace("/login");
        return;
      }
      try {
        const me = await getMe();
        if (me.role === 'admin' || me.role === 'guest_admin') {
          router.replace("/admin");
        } else {
          router.replace("/(tabs)");
        }
      } catch {
        router.replace("/login");
      }
    }, splashDuration);

    return () => clearTimeout(timer);
  }, [router, splashDuration]);

  return (
    <ScreenGradient>
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.content}>
        <View style={styles.centerContainer}>
          <View style={styles.logoContainer}>
            <Image 
              source={{ uri: "https://lh3.googleusercontent.com/aida/AEtjO1WvXJpikhF3ORODpwSEf_WIYP1zR6qGd9BgV3Iq-mpFkjyJTAq2tzwCOahKanD6vR9cVHrKQpPZExVLPa1vVTYzHTqbo_n04_lyUjB3PQzr12t5gX2klg8tbXAC12uQYQpc3rGVlJwSfgI7_RgpbsgKr5yBVDasxep8sO0RqzB2uMpl0tnBVZrfAYpwwWmsbv4J7_cT5kxTOU6QO3NantBvxeIijfJj7aN2kBLvGNqWIHIraU3I13Vcoxo" }} 
              style={styles.logo} 
            />
          </View>
          <Text style={styles.title}>
            LAMS <Text style={styles.titleSecondary}>SCG</Text>
          </Text>
          <Text style={styles.subtitle}>Leave & Attendance Management System</Text>
        </View>
        <View style={styles.footer}>
          <Text style={styles.footerTextTop}>© 2026 SCG Corporation.</Text>
          <Text style={styles.footerTextBottom}>Symbiotic Consulting Group</Text>
        </View>
      </View>
      </View>
    </ScreenGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    width: '100%',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    width: 96,
    height: 96,
    marginBottom: 24,
    borderRadius: 48,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 5,
  },
  logo: {
    width: 96,
    height: 96,
  },
  title: {
    fontFamily: 'Inter',
    fontSize: 33,
    fontWeight: '800',
    color: colors.onSurface,
    textTransform: 'uppercase',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  titleSecondary: {
    color: colors.secondary,
  },
  subtitle: {
    fontFamily: 'Inter',
    fontSize: 15,
    fontWeight: '600',
    color: colors.onSurfaceVariant,
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 24,
  },
  footerTextTop: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: colors.secondary,
    marginBottom: 4,
  },
  footerTextBottom: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '500',
    color: colors.onSurfaceVariant,
  }
});
