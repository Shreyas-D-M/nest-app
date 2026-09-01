import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { Link, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Text, useTheme } from '@nest/ui';
import type { ReactElement } from 'react';
import { useAuth } from '@/lib/auth-context';

export default function ProfileScreen(): ReactElement {
  const theme = useTheme();
  const { session, signOut } = useAuth();
  const displayName = session?.user.name ?? session?.user.phone ?? 'Customer';
  const avatarInitial = displayName.slice(0, 1).toUpperCase();

  const handleSignOut = async (): Promise<void> => {
    await signOut();
    router.replace('/sign-in');
    Alert.alert('Signed out', 'You have been signed out.');
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}> 
      <ScrollView contentContainerStyle={{ padding: theme.spacing.xl, gap: theme.spacing.lg, paddingBottom: 120 }}>
        <View style={styles.topRow}>
          <Link href="/" asChild>
            <Text variant="secondary" color="accent">
              ← Home
            </Text>
          </Link>
        </View>

        <View
          style={[
            styles.hero,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              borderRadius: theme.radius.md,
              padding: theme.spacing.lg,
            },
          ]}
        >
          <View style={[styles.avatar, { backgroundColor: theme.colors.actionPrimary }]}> 
            <Text variant="bodyStrong" color="inverse">
              {avatarInitial}
            </Text>
          </View>
          <Text variant="h1" style={{ marginTop: theme.spacing.md }}>
            {displayName}
          </Text>
          <Text variant="secondary" color="secondary">
            {session?.user.phone}
          </Text>
        </View>

        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              borderRadius: theme.radius.md,
              padding: theme.spacing.lg,
            },
          ]}
        >
          <Text variant="h2">Account</Text>
          <Text color="secondary" style={{ marginTop: 8 }}>
            {session?.user.email ?? 'No email added'}
          </Text>
          <Text color="secondary" style={{ marginTop: 4 }}>
            {session?.user.phone}
          </Text>
        </View>

        <View style={{ gap: theme.spacing.sm }}>
          <Button label="Home Passport" onPress={() => router.push('/home-passport')} />
          <Button label="Support" variant="secondary" onPress={() => router.push('/support')} />
          <Button
            label="Log out"
            variant="secondary"
            onPress={() => void handleSignOut()}
          />
        </View>
      </ScrollView>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  hero: { borderWidth: 1, alignItems: 'center' },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: { borderWidth: 1 },
});
