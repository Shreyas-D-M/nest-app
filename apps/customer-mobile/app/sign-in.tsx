import { useState, type ReactElement } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Text, useTheme } from '@nest/ui';
import { requestOtp, verifyOtp } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export default function SignInScreen(): ReactElement {
  const theme = useTheme();
  const { completeSignIn } = useAuth();
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [codeRequested, setCodeRequested] = useState(false);
  const [loading, setLoading] = useState(false);

  const requestCode = async (): Promise<void> => {
    try {
      setLoading(true);
      await requestOtp(phone.trim());
      setCodeRequested(true);
    } catch {
      Alert.alert('Unable to send code', 'Check your phone number and connection, then try again.');
    } finally {
      setLoading(false);
    }
  };

  const confirmCode = async (): Promise<void> => {
    try {
      setLoading(true);
      await verifyOtp(phone.trim(), code.trim());
      await completeSignIn();
      router.replace('/(tabs)');
    } catch {
      Alert.alert('Unable to sign in', 'Check the code and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
        <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: theme.radius.md, padding: theme.spacing.lg }]}>
          <Text variant="h1">Welcome to NEST</Text>
          <Text color="secondary" style={{ marginTop: theme.spacing.sm }}>Sign in with your phone number to continue.</Text>
          <TextInput
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholder="+91 98765 43210"
            placeholderTextColor="#62627A"
            style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.textPrimary, backgroundColor: theme.colors.surfaceMuted, marginTop: theme.spacing.lg }]}
          />
          {codeRequested ? (
            <TextInput
              value={code}
              onChangeText={setCode}
              keyboardType="number-pad"
              placeholder="Verification code"
              placeholderTextColor="#62627A"
              style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.textPrimary, backgroundColor: theme.colors.surfaceMuted, marginTop: theme.spacing.sm }]}
            />
          ) : null}
          <View style={{ marginTop: theme.spacing.lg }}>
            <Button label={codeRequested ? 'Verify code' : 'Send code'} onPress={() => void (codeRequested ? confirmCode() : requestCode())} disabled={loading} />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1, justifyContent: 'center', padding: 24 },
  card: { borderWidth: 1 },
  input: { borderWidth: 1, borderRadius: 12, minHeight: 48, paddingHorizontal: 14 },
});
