import { useState } from "react";
import { View, Text, TextInput, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, SafeAreaView } from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from '@expo/vector-icons';
import { login as authLogin, passLogin } from "../services/auth";

// Stitch Design Colors
const colors = {
  surface: "#fcf9f8",
  primary: "#000000",
  onPrimary: "#ffffff",
  surfaceContainerLowest: "#ffffff",
  surfaceContainerLow: "#f6f3f2",
  secondary: "#585f6c",
  error: "#ba1a1a",
  border: "#cfc4c5",
};

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

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
      await passLogin();
      router.replace("/(tabs)");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Pass failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <View style={styles.logoIconBg}>
              <MaterialIcons name="domain-verification" size={16} color={colors.onPrimary} />
            </View>
            <Text style={styles.logoText}>LAMS SCG</Text>
          </View>
        </View>

        <View style={styles.titleContainer}>
          <Text style={styles.title}>Enterprise Sign In</Text>
          <Text style={styles.subtitle}>Authenticate with your corporate credentials to access workforce ledgers and attendance punches.</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Corporate Email / Employee ID <Text style={styles.errorText}>*</Text>
            </Text>
            <View style={styles.inputContainer}>
              <MaterialIcons name="badge" size={20} color={colors.secondary} style={styles.inputIconLeft} />
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                placeholder="alex.chen@scg-enterprise.internal"
                placeholderTextColor="rgba(88, 95, 108, 0.6)"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.passwordHeader}>
              <Text style={styles.label}>
                Password <Text style={styles.errorText}>*</Text>
              </Text>
              <TouchableOpacity>
                <Text style={styles.forgotPassword}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.inputContainer}>
              <MaterialIcons name="lock" size={20} color={colors.secondary} style={styles.inputIconLeft} />
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                placeholder="••••••••••••"
                placeholderTextColor="rgba(88, 95, 108, 0.6)"
              />
              <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowPassword(!showPassword)}>
                <MaterialIcons name={showPassword ? "visibility" : "visibility-off"} size={20} color={colors.secondary} />
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.rememberMeContainer}>
            <TouchableOpacity 
              style={styles.checkbox} 
              onPress={() => setRememberMe(!rememberMe)}
            >
              {rememberMe && <MaterialIcons name="check" size={16} color={colors.onPrimary} />}
            </TouchableOpacity>
            <Text style={styles.rememberMeText}>Remember this device for 30 days</Text>
          </View>

          {error ? <Text style={styles.errorMsg}>{error}</Text> : null}

          <TouchableOpacity 
            style={styles.signInButton} 
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.signInButtonText}>{loading ? "Verifying Credentials..." : "Sign In to Workspace"}</Text>
            {!loading && <MaterialIcons name="arrow-forward" size={18} color={colors.onPrimary} />}
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.versionText}>V4.12.0</Text>
          
          {/* MaxStarter Pass Button preserved at the bottom */}
          <TouchableOpacity 
            style={styles.passButton} 
            onPress={handlePass}
            disabled={loading}
          >
            <Text style={styles.passButtonText}>Pass (Dev)</Text>
          </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoIconBg: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  titleContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.primary,
    letterSpacing: -0.36,
  },
  subtitle: {
    fontSize: 14,
    color: colors.secondary,
    marginTop: 4,
    lineHeight: 20,
  },
  card: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    gap: 16,
  },
  inputGroup: {
    gap: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.primary,
  },
  errorText: {
    color: colors.error,
  },
  passwordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  forgotPassword: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.primary,
    textDecorationLine: 'underline',
  },
  inputContainer: {
    position: 'relative',
    justifyContent: 'center',
  },
  inputIconLeft: {
    position: 'absolute',
    left: 12,
    zIndex: 1,
  },
  eyeIcon: {
    position: 'absolute',
    right: 12,
    zIndex: 1,
    padding: 4,
  },
  input: {
    width: '100%',
    height: 48,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 8,
    paddingLeft: 40,
    paddingRight: 40,
    fontSize: 14,
    color: colors.primary,
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rememberMeText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.primary,
  },
  signInButton: {
    width: '100%',
    height: 48,
    backgroundColor: colors.primary,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  signInButtonText: {
    color: colors.onPrimary,
    fontSize: 14,
    fontWeight: '500',
  },
  errorMsg: {
    color: colors.error,
    fontSize: 12,
    textAlign: 'center',
  },
  footer: {
    marginTop: 32,
    alignItems: 'center',
    gap: 12,
  },
  versionText: {
    fontSize: 11,
    color: colors.secondary,
    letterSpacing: 0.6,
  },
  passButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  passButtonText: {
    color: colors.secondary,
    fontSize: 12,
    fontWeight: '500',
  }
});
