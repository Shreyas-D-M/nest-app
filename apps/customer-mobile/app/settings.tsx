import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Text, useTheme } from '@nest/ui';
import type { ReactElement } from 'react';

export default function SettingsScreen(): ReactElement {
  const theme = useTheme();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}> 
      <ScrollView contentContainerStyle={{ padding: theme.spacing.xl, gap: theme.spacing.lg, paddingBottom: 120 }}>
        <Text variant="caption" color="secondary">Settings</Text>
        <Text variant="h1">Preferences</Text>

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
          <Text variant="bodyStrong">Account</Text>
          <Text variant="secondary" color="secondary" style={{ marginTop: 6 }}>
            Notifications, saved addresses, and contact preferences.
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
          <Text variant="bodyStrong">Privacy & safety</Text>
          <Text variant="secondary" color="secondary" style={{ marginTop: 6 }}>
            We keep your addresses and booking details secure and only share the minimum needed.
          </Text>
        </View>

        <View style={{ gap: theme.spacing.sm }}>
          <Button label="Home Passport" onPress={() => router.push('/home-passport')} />
          <Button label="Support" variant="secondary" onPress={() => router.push('/support')} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  card: { borderWidth: 1 },
});
