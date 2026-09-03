import { useCallback, useEffect, useState, type ReactElement } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button, Text } from '@nest/ui';
import { ApiRequestError, requestOtp, verifyOtp } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { getResendButtonLabel, resolveCooldownSeconds } from '@/lib/auth-cooldown';
import { colors, radius, spacing } from '@/theme/colors';

export default function SignInScreen(): ReactElement {
  const { completeSignIn } = useAuth();
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [codeRequested, setCodeRequested] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  // Reset verification state whenever the screen comes into focus (e.g. after logout)
  useFocusEffect(
    useCallback(() => {
      setCode('');
      setCodeRequested(false);
      setLoading(false);
      return () => {
        setCooldownSeconds(0);
      };
    }, []),
  );

  // Tick down cooldown timer
  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const timer = setInterval(() => {
      setCooldownSeconds((prev) => (prev > 1 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldownSeconds]);

  const requestCode = async (): Promise<void> => {
    const trimmedPhone = phone.trim();
    if (!trimmedPhone) {
      Alert.alert('Phone number required', 'Please enter your phone number.');
      return;
    }

    if (cooldownSeconds > 0) {
      Alert.alert('Please wait', `You can request another code in ${cooldownSeconds} seconds.`);
      return;
    }

    try {
      setLoading(true);
      const res = await requestOtp(trimmedPhone);
      setCodeRequested(true);

      const resolvedCooldown = resolveCooldownSeconds(res.retryAfterSeconds);
      setCooldownSeconds(resolvedCooldown);
    } catch (err: unknown) {
      if (err instanceof ApiRequestError) {
        if (err.status === 429) {
          setCooldownSeconds(60);
          Alert.alert(
            'Too Many Requests',
            'You have requested an OTP recently. Please wait 60s before trying again.',
          );
        } else {
          Alert.alert('Unable to send code', err.message);
        }
      } else {
        Alert.alert('Error', 'An unexpected error occurred. Please check your connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  const confirmCode = async (): Promise<void> => {
    const trimmedPhone = phone.trim();
    const trimmedCode = code.trim();

    if (!trimmedPhone || !trimmedCode) {
      Alert.alert('Incomplete code', 'Please enter both your phone number and the 6-digit OTP.');
      return;
    }

    try {
      setLoading(true);
      await verifyOtp(trimmedPhone, trimmedCode);
      await completeSignIn();
      router.replace('/');
    } catch (err: unknown) {
      if (err instanceof ApiRequestError) {
        Alert.alert('Verification failed', err.message);
      } else {
        Alert.alert('Error', 'Unable to verify OTP. Please try again.');
      }
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
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Brand Header */}
          <View style={styles.brandHeader}>
            <View style={styles.brandLogoWrap}>
              <Ionicons name="home" size={28} color="#FFFFFF" />
            </View>
            <Text variant="h1" style={styles.brandTitle}>
              NEST
            </Text>
            <Text variant="caption" style={styles.brandTagline}>
              PREMIUM HOME SERVICES MARKETPLACE
            </Text>
          </View>

          {/* Authentication Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text variant="h2" style={styles.cardTitle}>
                {codeRequested ? 'Verify your number' : 'Sign in or register'}
              </Text>
              <Text variant="secondary" color="secondary" style={styles.cardSubtitle}>
                {codeRequested
                  ? `Enter the 6-digit code sent to ${phone.trim()}`
                  : 'Enter your phone number to book services and track appointments.'}
              </Text>
            </View>

            {/* Phone Number Input */}
            <View style={styles.inputWrap}>
              <Text variant="caption" style={styles.inputLabel}>
                MOBILE NUMBER
              </Text>
              <View style={styles.phoneInputRow}>
                <View style={styles.countryPill}>
                  <Text style={styles.countryFlag}>🇮🇳</Text>
                  <Text variant="bodyStrong" style={styles.countryCode}>
                    +91
                  </Text>
                </View>
                <TextInput
                  style={styles.phoneInput}
                  placeholder="98765 43210"
                  placeholderTextColor={colors.textMuted}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  editable={!codeRequested && !loading}
                  maxLength={15}
                  accessibilityLabel="Phone Number"
                />
              </View>
            </View>

            {/* OTP Code Input */}
            {codeRequested ? (
              <View style={styles.inputWrap}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text variant="caption" style={styles.inputLabel}>
                    6-DIGIT VERIFICATION CODE
                  </Text>
                  {cooldownSeconds > 0 ? (
                    <Text variant="caption" style={{ color: colors.primary, fontWeight: '600' }}>
                      Resend in {cooldownSeconds}s
                    </Text>
                  ) : null}
                </View>
                <TextInput
                  style={styles.codeInput}
                  placeholder="• • • • • •"
                  placeholderTextColor={colors.textMuted}
                  value={code}
                  onChangeText={setCode}
                  keyboardType="number-pad"
                  maxLength={6}
                  editable={!loading}
                  accessibilityLabel="Verification Code"
                />
              </View>
            ) : null}

            {/* Action Buttons */}
            <View style={styles.actionGroup}>
              {codeRequested ? (
                <>
                  <Button
                    label={loading ? 'Verifying…' : 'Verify & Continue'}
                    onPress={confirmCode}
                    disabled={loading || code.trim().length < 4}
                  />
                  <Button
                    label={getResendButtonLabel(cooldownSeconds)}
                    variant="secondary"
                    onPress={requestCode}
                    disabled={loading || cooldownSeconds > 0}
                  />
                  <Pressable
                    onPress={() => {
                      setCodeRequested(false);
                      setCode('');
                    }}
                    style={styles.changePhoneBtn}
                    accessibilityRole="button"
                    accessibilityLabel="Change phone number"
                  >
                    <Text variant="caption" style={styles.changePhoneText}>
                      Change phone number
                    </Text>
                  </Pressable>
                </>
              ) : (
                <Button
                  label={loading ? 'Sending code…' : 'Send Verification Code'}
                  onPress={requestCode}
                  disabled={loading || phone.trim().length < 7}
                />
              )}
            </View>
          </View>

          {/* Trust Footer Note */}
          <View style={styles.footerNotice}>
            <Ionicons name="shield-checkmark-outline" size={16} color={colors.textSecondary} />
            <Text variant="caption" color="secondary">
              100% verified local professionals in Belagavi
            </Text>
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
    padding: spacing.lg,
    gap: spacing.xl,
    justifyContent: 'center',
    minHeight: '90%',
  },
  brandHeader: {
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.md,
  },
  brandLogoWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
    marginBottom: 4,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 2,
    color: colors.text,
  },
  brandTagline: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: colors.textSecondary,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
    gap: spacing.lg,
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
  inputWrap: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: colors.textSecondary,
  },
  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  countryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 10,
    height: 48,
  },
  countryFlag: {
    fontSize: 16,
  },
  countryCode: {
    fontSize: 14,
    color: colors.text,
  },
  phoneInput: {
    flex: 1,
    height: 48,
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    fontSize: 15,
    color: colors.text,
  },
  codeInput: {
    height: 48,
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 2,
    color: colors.text,
    textAlign: 'center',
  },
  actionGroup: {
    gap: 10,
    marginTop: 4,
  },
  changePhoneBtn: {
    alignSelf: 'center',
    paddingVertical: 6,
  },
  changePhoneText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  footerNotice: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
  },
});
