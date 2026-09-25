import { useState } from "react";
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Image } from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { login as authLogin } from "../../services/auth";
import { getMe, requestPasswordReset, apiErrorMessage } from "../../services/resources";
import { getPostLoginRoute } from "../modules/shared/SplashScreen";
import { colors, pageGradient } from "../theme";
import { WebCard } from "./WebShell";
import { ThemedDialog, ThemedToast } from "../components/ui/AppChrome";

const LOGO =
  "https://lh3.googleusercontent.com/aida/AEtjO1WvXJpikhF3ORODpwSEf_WIYP1zR6qGd9BgV3Iq-mpFkjyJTAq2tzwCOahKanD6vR9cVHrKQpPZExVLPa1vVTYzHTqbo_n04_lyUjB3PQzr12t5gX2klg8tbXAC12uQYQpc3rGVlJwSfgI7_RgpbsgKr5yBVDasxep8sO0RqzB2uMpl0tnBVZrfAYpwwWmsbv4J7_cT5kxTOU6QO3NantBvxeIijfJj7aN2kBLvGNqWIHIraU3I13Vcoxo";

export default function WebLoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotBusy, setForgotBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const handleLogin = async () => {
    setError(null);
    if (!email.trim() || !password.trim()) {
      setError("Email and password are required.");
      return;
    }
    if (!email.includes("@")) {
      setError("Enter a valid email address.");
      return;
    }
    setLoading(true);
    try {
      const session = await authLogin({ email: email.trim(), password }, { persist: rememberMe });
      try {
        const me = await getMe();
        if (me.role === "admin" || me.role === "guest_admin") {
          router.replace("/admin");
        } else {
          router.replace("/(tabs)");
        }
      } catch {
        if (session.email?.includes("admin")) {
          router.replace("/admin");
        } else {
          router.replace(getPostLoginRoute());
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  const openForgotPassword = () => {
    const value = email.trim();
    if (!value || !value.includes("@")) {
      setError("Enter a valid email address to send a reset link.");
      return;
    }
    setError(null);
    setForgotOpen(true);
  };

  const sendResetLink = async () => {
    setForgotBusy(true);
    try {
      const result = await requestPasswordReset(email.trim());
      setForgotOpen(false);
      setToast(result.message);
    } catch (err) {
      setForgotOpen(false);
      setToast(apiErrorMessage(err));
    } finally {
      setForgotBusy(false);
    }
  };

  return (
    <LinearGradient colors={[...pageGradient.colors]} locations={[...pageGradient.locations]} style={styles.page}>
      <View style={styles.split}>
        <View style={styles.brandPane}>
          <Text style={styles.kicker}>Leave & Attendance</Text>
          <Image source={{ uri: LOGO }} style={styles.logo} />
          <Text style={styles.brand}>LAMS SCG</Text>
          <Text style={styles.tagline}>Leave & Attendance Management System</Text>
          <Text style={styles.copy}>
            Authenticate with your corporate credentials to access workforce ledgers and attendance punches.
          </Text>
        </View>
        <View style={styles.formPane}>
          <WebCard>
            <Text style={styles.heading}>Welcome back</Text>
            <Text style={styles.label}>Corporate Email / Employee ID *</Text>
            <View style={styles.inputRow}>
              <MaterialIcons name="badge" size={18} color={colors.secondary} />
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                placeholder="alex.chen@scg.enterprise.internal"
                placeholderTextColor="rgba(88, 95, 108, 0.6)"
              />
            </View>
            <View style={styles.pwHead}>
              <Text style={styles.label}>Password *</Text>
              <TouchableOpacity onPress={openForgotPassword}>
                <Text style={styles.link}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.inputRow}>
              <MaterialIcons name="lock" size={18} color={colors.secondary} />
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                placeholder="••••••••••••"
                placeholderTextColor="rgba(88, 95, 108, 0.6)"
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <MaterialIcons name={showPassword ? "visibility" : "visibility-off"} size={18} color={colors.secondary} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.remember} onPress={() => setRememberMe(!rememberMe)}>
              <View style={[styles.track, rememberMe && styles.trackOn]}>
                <View style={[styles.thumb, rememberMe && styles.thumbOn]} />
              </View>
              <Text style={styles.rememberText}>Remember this device for 30 days</Text>
            </TouchableOpacity>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <TouchableOpacity style={styles.cta} onPress={() => void handleLogin()} disabled={loading}>
              <Text style={styles.ctaText}>{loading ? "Verifying..." : "Sign in"}</Text>
            </TouchableOpacity>
            <View style={styles.footer}>
              <Text style={styles.version}>Version 1.0.0</Text>
            </View>
          </WebCard>
        </View>
      </View>
      <ThemedDialog
        visible={forgotOpen}
        title="Forgot Password"
        message={forgotBusy ? "Sending reset link…" : `Send a password reset link to ${email.trim()}?`}
        onRequestClose={() => setForgotOpen(false)}
        actions={[
          { label: "Cancel", onPress: () => setForgotOpen(false) },
          { label: forgotBusy ? "Sending…" : "Send link", onPress: () => void sendResetLink(), primary: true },
        ]}
      />
      <ThemedToast message={toast} onDismiss={() => setToast(null)} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, minHeight: 640 },
  split: { flex: 1, flexDirection: "row", flexWrap: "wrap", maxWidth: 1100, width: "100%", alignSelf: "center", padding: 32, gap: 28, alignItems: "center" },
  brandPane: {
    flex: 1,
    minWidth: 280,
    gap: 8,
    backgroundColor: colors.surfaceContainerLowest,
    padding: 36,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderLeftWidth: 3,
    borderLeftColor: colors.accent,
  },
  formPane: { flex: 1, minWidth: 320, maxWidth: 480 },
  logo: { width: 64, height: 64, borderRadius: 8, marginBottom: 8 },
  kicker: { fontSize: 11, fontWeight: "700", letterSpacing: 1.6, color: colors.accentDeep, textTransform: "uppercase" },
  brand: { fontSize: 28, fontWeight: "800", color: colors.onSurface, letterSpacing: 2 },
  tagline: { fontSize: 16, fontWeight: "600", color: colors.onSurfaceVariant },
  copy: { fontSize: 14, color: colors.secondary, lineHeight: 20, maxWidth: 420 },
  heading: { fontSize: 22, fontWeight: "700", color: colors.onSurface, marginBottom: 16 },
  label: { fontSize: 12, fontWeight: "600", color: colors.onSurface, marginBottom: 6, marginTop: 10 },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    minHeight: 44,
  },
  input: { flex: 1, fontSize: 14, color: colors.onSurface, outlineStyle: "none" as never },
  pwHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  link: { fontSize: 12, fontWeight: "600", color: colors.accentDeep },
  remember: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 14 },
  track: { width: 36, height: 20, borderRadius: 10, backgroundColor: colors.surfaceContainerHigh, justifyContent: "center" },
  trackOn: { backgroundColor: colors.accent },
  thumb: { width: 16, height: 16, borderRadius: 8, backgroundColor: colors.surfaceContainerLowest, marginLeft: 2 },
  thumbOn: { marginLeft: 18 },
  rememberText: { fontSize: 13, color: colors.onSurface },
  error: { color: colors.error, marginTop: 10, fontSize: 13 },
  cta: { marginTop: 18, backgroundColor: colors.accent, minHeight: 48, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  ctaText: { color: colors.onPrimary, fontWeight: "700" },
  footer: { flexDirection: "row", justifyContent: "space-between", marginTop: 16 },
  version: { fontSize: 12, color: colors.secondary },
});
