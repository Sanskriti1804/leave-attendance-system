import { useState } from "react";
import { View, Text, TextInput, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { apiErrorMessage, submitPasswordReset } from "../../../services/resources";
import { colors } from "../../theme";

function tokenFromParams(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }
  return value ?? "";
}

export default function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ token?: string | string[] }>();
  const token = tokenFromParams(params.token);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const submit = async () => {
    setError(null);
    if (!token) {
      setError("This reset link is missing a token. Request a new link from the sign-in screen.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
      setError("Use at least 8 characters with upper, lower, a digit, and a symbol.");
      return;
    }
    setBusy(true);
    try {
      const result = await submitPasswordReset({ token, newPassword: password });
      setDone(result.message);
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.page} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={styles.card}>
        <Text style={styles.title}>Set a new password</Text>
        <Text style={styles.copy}>The link in your email works once and expires after 15 minutes.</Text>
        {done ? (
          <>
            <Text style={styles.ok}>{done}</Text>
            <TouchableOpacity style={styles.button} onPress={() => router.replace("/login")}>
              <Text style={styles.buttonText}>Back to sign in</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.label}>New password</Text>
            <View style={styles.field}>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                placeholder="New password"
                placeholderTextColor={colors.onSurfaceVariant}
              />
              <TouchableOpacity onPress={() => setShowPassword((value) => !value)} accessibilityLabel="Show password">
                <MaterialIcons name={showPassword ? "visibility" : "visibility-off"} size={18} color={colors.secondary} />
              </TouchableOpacity>
            </View>
            <Text style={styles.label}>Confirm password</Text>
            <View style={styles.field}>
              <TextInput
                style={styles.input}
                value={confirm}
                onChangeText={setConfirm}
                secureTextEntry={!showConfirm}
                autoCapitalize="none"
                placeholder="Confirm password"
                placeholderTextColor={colors.onSurfaceVariant}
              />
              <TouchableOpacity onPress={() => setShowConfirm((value) => !value)} accessibilityLabel="Show password">
                <MaterialIcons name={showConfirm ? "visibility" : "visibility-off"} size={18} color={colors.secondary} />
              </TouchableOpacity>
            </View>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <TouchableOpacity style={styles.button} onPress={() => void submit()} disabled={busy}>
              <Text style={styles.buttonText}>{busy ? "Saving…" : "Update password"}</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background, justifyContent: "center", padding: 24 },
  card: {
    width: "100%",
    maxWidth: 420,
    alignSelf: "center",
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 16,
    padding: 24,
    gap: 10,
  },
  title: { fontSize: 22, fontWeight: "700", color: colors.onSurface },
  copy: { color: colors.onSurfaceVariant, marginBottom: 8 },
  label: { color: colors.onSurface, fontWeight: "600" },
  field: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingRight: 12,
    backgroundColor: colors.surfaceContainerLow,
  },
  input: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: colors.onSurface,
  },
  button: {
    marginTop: 8,
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  buttonText: { color: colors.onPrimary, fontWeight: "700" },
  error: { color: colors.error },
  ok: { color: colors.onSurface },
});
