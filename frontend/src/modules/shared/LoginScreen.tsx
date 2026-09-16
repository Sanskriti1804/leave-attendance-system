import { useState } from "react";
import { View, Text, TextInput, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, SafeAreaView, Image } from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from '@expo/vector-icons';
import { ScreenGradient } from "../../components/ui/AppChrome";
import { login as authLogin, passLogin } from "../../../services/auth";
import { getMe } from "../../../services/resources";
import { getPostLoginRoute } from "./SplashScreen";

// Stitch Design Colors & Token Map
const colors = {
  primary: "#000000",
  onPrimary: "#ffffff",
  secondary: "#374151", // text-secondary
  error: "#ba1a1a",
  cardBg: "rgb(222, 223, 227)",
  cardBorder: "rgba(0, 0, 0, 0.15)",
  inputBg: "#f6f3f2",
  inputBorder: "#374151",
  textMain: "rgb(0, 0, 0)",
  textVariant: "rgb(28, 27, 27)",
  indicatorPulse: "#000000",
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
      const session = await authLogin({ email: email.trim(), password });
      try {
        const me = await getMe();
        if (me.role === 'admin' || me.role === 'guest_admin') {
          router.replace("/admin");
        } else {
          router.replace("/(tabs)");
        }
      } catch (err) {
        if (session.email?.includes('admin')) {
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

  const handlePass = async () => {
    setError(null);
    setLoading(true);
    try {
      await passLogin();
      router.replace("/admin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Pass failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenGradient>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView 
          style={styles.container}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          {/* Minimal Geometric Brand Emblem */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Image 
                source={{ uri: "https://lh3.googleusercontent.com/aida/AEtjO1WvXJpikhF3ORODpwSEf_WIYP1zR6qGd9BgV3Iq-mpFkjyJTAq2tzwCOahKanD6vR9cVHrKQpPZExVLPa1vVTYzHTqbo_n04_lyUjB3PQzr12t5gX2klg8tbXAC12uQYQpc3rGVlJwSfgI7_RgpbsgKr5yBVDasxep8sO0RqzB2uMpl0tnBVZrfAYpwwWmsbv4J7_cT5kxTOU6QO3NantBvxeIijfJj7aN2kBLvGNqWIHIraU3I13Vcoxo" }}
                style={styles.logoIcon}
              />
              <Text style={styles.logoText}>LAMS SCG</Text>
            </View>
            <View style={styles.pulseContainer}>
              <View style={styles.pulseDot} />
            </View>
          </View>

          {/* Screen Heading */}
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Enterprise Sign In</Text>
            <Text style={styles.subtitle}>Authenticate with your corporate credentials to access workforce ledgers and attendance punches.</Text>
          </View>

          {/* Main Login Card */}
          <View style={styles.card}>
            {/* Identifier Field */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Corporate Email / Employee ID <Text style={styles.errorText}>*</Text>
              </Text>
              <View style={styles.inputContainer}>
                <MaterialIcons name="badge" size={18} color={colors.secondary} style={styles.inputIconLeft} />
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
            </View>

            {/* Password Field */}
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
                <MaterialIcons name="lock" size={18} color={colors.secondary} style={styles.inputIconLeft} />
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  placeholder="••••••••••••"
                  placeholderTextColor="rgba(88, 95, 108, 0.6)"
                />
                <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowPassword(!showPassword)}>
                  <MaterialIcons name={showPassword ? "visibility" : "visibility-off"} size={18} color={colors.secondary} />
                </TouchableOpacity>
              </View>
            </View>
            
            {/* Device Binding Checkbox */}
            <View style={styles.rememberMeContainer}>
              <TouchableOpacity 
                style={styles.checkboxWrapper} 
                onPress={() => setRememberMe(!rememberMe)}
                activeOpacity={1}
              >
                <View style={[styles.toggleTrack, rememberMe && styles.toggleTrackActive]}>
                  <View style={[styles.toggleThumb, rememberMe && styles.toggleThumbActive]} />
                </View>
                <Text style={styles.rememberMeText}>Remember this device for 30 days</Text>
              </TouchableOpacity>
            </View>

            {error ? <Text style={styles.errorMsg}>{error}</Text> : null}

            {/* Primary Action CTA */}
            <TouchableOpacity 
              style={styles.signInButton} 
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.9}
            >
              <Text style={styles.signInButtonText}>{loading ? "Verifying..." : "Sign in "}</Text>
              {!loading && <MaterialIcons name="north-east" size={16} color={colors.onPrimary} />}
            </TouchableOpacity>
          </View>

          {/* Operational Security & IT Help Desk Footer */}
          <View style={styles.footer}>
            <Text style={styles.versionText}>V4.12.0</Text>
            
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
    </ScreenGradient>
  );
}

const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
    justifyContent: 'center',
    alignItems: 'center',
    maxWidth: 390,
    marginHorizontal: 'auto',
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    width: '100%',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  logoText: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 2.1,
    textTransform: 'uppercase',
  },
  pulseContainer: {
    backgroundColor: '#ebe7e7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  titleContainer: {
    marginTop: 16,
    marginBottom: 24,
    width: '100%',
  },
  title: {
    fontFamily: 'Inter',
    fontSize: 24,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: -0.36,
  },
  subtitle: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: colors.textVariant,
    marginTop: 4,
    fontWeight: '500',
    lineHeight: 20,
  },
  card: {
    backgroundColor: colors.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 20,
    width: '100%',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 25,
    elevation: 5,
    gap: 16,
  },
  inputGroup: {
    gap: 4,
  },
  label: {
    fontFamily: 'Inter',
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary,
  },
  errorText: {
    color: colors.error,
    fontWeight: '700',
  },
  passwordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  forgotPassword: {
    fontFamily: 'Inter',
    fontSize: 15,
    fontWeight: '600',
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
    backgroundColor: colors.inputBg,
    borderWidth: 1.5,
    borderColor: colors.inputBorder,
    borderRadius: 8,
    paddingLeft: 40,
    paddingRight: 40,
    fontFamily: 'Inter',
    fontSize: 15,
    color: colors.primary,
  },
  rememberMeContainer: {
    paddingTop: 4,
  },
  checkboxWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  toggleTrack: {
    width: 44,
    height: 24,
    backgroundColor: '#d6d3d1', // stone-300
    borderRadius: 12,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleTrackActive: {
    backgroundColor: colors.primary,
  },
  toggleThumb: {
    width: 20,
    height: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
  },
  toggleThumbActive: {
    transform: [{ translateX: 20 }],
  },
  rememberMeText: {
    fontFamily: 'Inter',
    fontSize: 15,
    fontWeight: '600',
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
    marginTop: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  signInButtonText: {
    fontFamily: 'Inter',
    color: colors.onPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  errorMsg: {
    color: colors.error,
    fontSize: 14,
    fontFamily: 'Inter',
    fontWeight: '600',
    textAlign: 'center',
  },
  footer: {
    marginTop: 24,
    alignItems: 'center',
    gap: 12,
  },
  versionText: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '700',
    color: colors.textVariant,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  passButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#cfc4c5',
  },
  passButtonText: {
    fontFamily: 'Inter',
    color: colors.secondary,
    fontSize: 12,
    fontWeight: '500',
  }
});
