import { useState } from "react";
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { useRouter } from "expo-router";
import { AppIcon, Button, Input } from "../components";
import { colors, spacing, typography } from "../src/maxstarter/theme";
import { assets } from "../src/maxstarter/assets";
import { Logo } from "../src/maxstarter/Logo";
import { designContent } from "../src/maxstarter/design";
import { login as authLogin, passLogin } from "../services/auth";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // MAXSTARTER:BEGIN login-copy
  const loginTitle = designContent.login.title;
  const loginSubtitle = designContent.login.subtitle;
  // MAXSTARTER:END login-copy

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
      // TODO: Connect your authentication API here.
      await authLogin({ email: email.trim(), password });
      router.replace("/(tabs)");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  const handlePass = async () => {
    setError(null);
    setLoading(true);
    try {
      // Developer bypass — skips credential checks via services/auth.passLogin().
      await passLogin();
      router.replace("/(tabs)");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Pass failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.header}>
        <Logo style={styles.logo} />
        <Text style={styles.appName}>{assets.appName}</Text>
        <Text style={styles.title}>{loginTitle}</Text>
        <Text style={styles.subtitle}>{loginSubtitle}</Text>
      </View>

      <View style={styles.form}>
        <Input
          label="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="you@example.com"
        />
        <Input
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="••••••••"
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button title="Login" onPress={handleLogin} loading={loading} />

        <View style={styles.devPass}>
          <View style={styles.devPassHeader}>
            <AppIcon name="settings" size={16} color={colors.muted} />
            <Text style={styles.devNote}>
              Developer: use Pass to skip login while you wire your auth API.
            </Text>
          </View>
          <Button
            title="Pass"
            onPress={handlePass}
            loading={loading}
            variant="secondary"
          />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  logo: { width: 72, height: 72, marginBottom: spacing.sm },
  appName: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  subtitle: {
    fontSize: typography.sizes.md,
    color: colors.muted,
    marginTop: spacing.xs,
    textAlign: "center",
  },
  form: { gap: spacing.md },
  error: { color: colors.error, fontSize: typography.sizes.sm },
  devPass: {
    marginTop: spacing.md,
    gap: spacing.sm,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  devPassHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  devNote: {
    flex: 1,
    fontSize: typography.sizes.sm,
    color: colors.muted,
    lineHeight: 18,
  },
});
