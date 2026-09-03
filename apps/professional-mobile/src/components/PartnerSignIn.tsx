import { Ionicons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@nest/ui';
import { useState, type ReactElement } from 'react';
import { requestOtp, verifyOtp } from '../lib/api';
import { useAuth } from '../lib/auth-context';
import { colors, radius, shadows, spacing } from '../theme/colors';

export function PartnerSignIn(): ReactElement {
  const { setSession } = useAuth();
  const [phone, setPhone] = useState('+919876543211');
  const [otpCode, setOtpCode] = useState('');
  const [step, setStep] = useState<'PHONE' | 'OTP'>('PHONE');
  const [devHint, setDevHint] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRequestOtp = async () => {
    const trimmed = phone.trim();
    if (!trimmed || trimmed.length < 10) {
      Alert.alert('Invalid Phone', 'Please enter a valid phone number with country code (e.g. +919876543211).');
      return;
    }
    setLoading(true);
    try {
      const res = await requestOtp(trimmed);
      if (res.devOtp) {
        setDevHint(res.devOtp);
        setOtpCode(res.devOtp);
      }
      setStep('OTP');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to request OTP';
      Alert.alert('Request Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (codeToVerify?: string) => {
    const code = (codeToVerify ?? otpCode).trim();
    if (!code || code.length < 6) {
      Alert.alert('Invalid Code', 'Please enter the 6-digit verification code.');
      return;
    }
    setLoading(true);
    try {
      const session = await verifyOtp(phone.trim(), code);
      await setSession(session);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Verification failed';
      Alert.alert('Sign In Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDevQuickLogin = async () => {
    setLoading(true);
    try {
      const targetPhone = '+919876543211';
      setPhone(targetPhone);
      const res = await requestOtp(targetPhone);
      const code = res.devOtp ?? '123456';
      const session = await verifyOtp(targetPhone, code);
      await setSession(session);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Dev login failed';
      Alert.alert('Dev Login', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo / Brand Header */}
          <View style={styles.brandHeader}>
            <View style={styles.logoSquare}>
              <Ionicons name="construct" size={26} color="#FFFFFF" />
            </View>
            <Text variant="h1" style={styles.appName}>
              NEST Partner
            </Text>
            <Text variant="caption" style={styles.appCaption}>
              SERVICE SPECIALIST WORKSPACE
            </Text>
          </View>

          {/* Form Card */}
          <View style={styles.card}>
            {step === 'PHONE' ? (
              <>
                <View style={styles.cardHeader}>
                  <Text variant="h2" style={styles.cardTitle}>
                    Welcome back
                  </Text>
                  <Text variant="body" color="secondary" style={styles.cardSubtitle}>
                    Sign in to your professional account
                  </Text>
                </View>

                <View style={styles.inputGroup}>
                  <Text variant="caption" style={styles.inputLabel}>
                    Phone number
                  </Text>
                  <View style={styles.phoneInputRow}>
                    <Ionicons name="call-outline" size={18} color={colors.textSecondary} />
                    <TextInput
                      style={styles.textInput}
                      value={phone}
                      onChangeText={setPhone}
                      placeholder="+919876543211"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="phone-pad"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>
                </View>

                <Pressable
                  style={({ pressed }) => [
                    styles.primaryBtn,
                    loading && styles.btnDisabled,
                    pressed && styles.btnPressed,
                  ]}
                  onPress={handleRequestOtp}
                  disabled={loading}
                  accessibilityRole="button"
                  accessibilityLabel="Continue to verification code"
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text variant="bodyStrong" style={styles.primaryBtnText}>
                      Continue →
                    </Text>
                  )}
                </Pressable>
              </>
            ) : (
              <>
                <View style={styles.cardHeader}>
                  <Text variant="h2" style={styles.cardTitle}>
                    Enter verification code
                  </Text>
                  <Text variant="body" color="secondary" style={styles.cardSubtitle}>
                    A 6-digit code was sent to {phone}.
                  </Text>
                </View>

                {devHint ? (
                  <View style={styles.devCodeBox}>
                    <Ionicons name="flash" size={14} color={colors.warningText} />
                    <Text variant="caption" style={styles.devCodeText}>
                      Dev code: <Text style={{ fontWeight: '700' }}>{devHint}</Text>
                    </Text>
                  </View>
                ) : null}

                <View style={styles.inputGroup}>
                  <Text variant="caption" style={styles.inputLabel}>
                    6-digit code
                  </Text>
                  <View style={styles.phoneInputRow}>
                    <Ionicons name="key-outline" size={18} color={colors.textSecondary} />
                    <TextInput
                      style={styles.textInput}
                      value={otpCode}
                      onChangeText={setOtpCode}
                      placeholder="123456"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="number-pad"
                      maxLength={6}
                    />
                  </View>
                </View>

                <Pressable
                  style={({ pressed }) => [
                    styles.primaryBtn,
                    loading && styles.btnDisabled,
                    pressed && styles.btnPressed,
                  ]}
                  onPress={() => void handleVerifyOtp()}
                  disabled={loading}
                  accessibilityRole="button"
                  accessibilityLabel="Verify and access workspace"
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text variant="bodyStrong" style={styles.primaryBtnText}>
                      Verify & Continue
                    </Text>
                  )}
                </Pressable>

                <View style={styles.otpActionsRow}>
                  <Pressable
                    style={styles.textActionBtn}
                    onPress={handleRequestOtp}
                    disabled={loading}
                  >
                    <Text variant="caption" style={styles.textActionLabel}>
                      Resend code
                    </Text>
                  </Pressable>

                  <Text style={styles.dotSeparator}>•</Text>

                  <Pressable
                    style={styles.textActionBtn}
                    onPress={() => {
                      setStep('PHONE');
                      setOtpCode('');
                      setDevHint(null);
                    }}
                  >
                    <Text variant="caption" style={styles.textActionLabel}>
                      Change number
                    </Text>
                  </Pressable>
                </View>
              </>
            )}

            {/* Local testing shortcut */}
            <View style={styles.devDividerRow}>
              <View style={styles.devDividerLine} />
              <Text variant="caption" style={styles.devDividerText}>
                DEVELOPMENT
              </Text>
              <View style={styles.devDividerLine} />
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.devQuickLoginBtn,
                pressed && styles.btnPressed,
              ]}
              onPress={handleDevQuickLogin}
              disabled={loading}
              accessibilityRole="button"
              accessibilityLabel="Quick dev login as specialist partner"
            >
              <Ionicons name="flash-outline" size={14} color={colors.primary} />
              <Text variant="caption" style={styles.devQuickLoginText}>
                Quick login: Ramesh Kumar (+919876543211)
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.xl,
    justifyContent: 'center',
    flexGrow: 1,
    maxWidth: 440,
    alignSelf: 'center',
    width: '100%',
  },
  brandHeader: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  logoSquare: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  appName: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.4,
  },
  appCaption: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
    letterSpacing: 0.8,
    marginTop: 2,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
    gap: spacing.md,
  },
  cardHeader: {
    gap: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  cardSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  inputGroup: {
    gap: 6,
    marginTop: 4,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    height: 48,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    height: '100%',
  },
  primaryBtn: {
    minHeight: 46,
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnPressed: {
    opacity: 0.85,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  otpActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  textActionBtn: {
    paddingVertical: 4,
  },
  textActionLabel: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 12,
  },
  dotSeparator: {
    color: colors.textMuted,
    fontSize: 12,
  },
  devCodeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.warningLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.warningBorder,
  },
  devCodeText: {
    color: colors.warningText,
    fontSize: 12,
  },
  devDividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  devDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.borderLight,
  },
  devDividerText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.6,
  },
  devQuickLoginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 40,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
  },
  devQuickLoginText: {
    color: colors.textSecondary,
    fontWeight: '600',
    fontSize: 12,
  },
});
