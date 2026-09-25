import { useEffect } from "react";
import { View, Text, StyleSheet, Image } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { getSession } from "../../services/auth";
import { getMe } from "../../services/resources";
import { designContent } from "../maxstarter/design";
import { colors, pageGradient } from "../theme";

export default function WebSplashScreen() {
  const router = useRouter();
  const splashDuration = designContent.splash.durationMs;

  useEffect(() => {
    const timer = setTimeout(async () => {
      const session = await getSession();
      if (!session) {
        router.replace("/login");
        return;
      }
      try {
        const me = await getMe();
        if (me.role === "admin" || me.role === "guest_admin") {
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
    <LinearGradient colors={[...pageGradient.colors]} locations={[...pageGradient.locations]} style={styles.page}>
      <View style={styles.center}>
        <Image
          source={{
            uri: "https://lh3.googleusercontent.com/aida/AEtjO1WvXJpikhF3ORODpwSEf_WIYP1zR6qGd9BgV3Iq-mpFkjyJTAq2tzwCOahKanD6vR9cVHrKQpPZExVLPa1vVTYzHTqbo_n04_lyUjB3PQzr12t5gX2klg8tbXAC12uQYQpc3rGVlJwSfgI7_RgpbsgKr5yBVDasxep8sO0RqzB2uMpl0tnBVZrfAYpwwWmsbv4J7_cT5kxTOU6QO3NantBvxeIijfJj7aN2kBLvGNqWIHIraU3I13Vcoxo",
          }}
          style={styles.logo}
        />
        <Text style={styles.title}>
          Symbiotic Consulting Group
        </Text>
        <Text style={styles.sub}>Leave & Attendance Management System</Text>
      </View>
      <Text style={styles.footer}>© 2026 SCG Corporation. Symbiotic Consulting Group</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, justifyContent: "center", alignItems: "center", minHeight: 560 },
  center: { alignItems: "center", gap: 8 },
  logo: { width: 96, height: 96, borderRadius: 48, marginBottom: 12 },
  title: { fontSize: 32, fontWeight: "800", color: colors.onSurface, letterSpacing: -0.5 },
  muted: { color: colors.accentDeep },
  sub: { fontSize: 15, fontWeight: "600", color: colors.onSurfaceVariant },
  footer: { position: "absolute", bottom: 32, fontSize: 12, color: colors.secondary },
});
