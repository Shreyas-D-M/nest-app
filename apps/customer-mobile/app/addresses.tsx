import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Text, useTheme } from '@nest/ui';
import { router } from 'expo-router';
import type { ReactElement } from 'react';

export default function AddressesScreen(): ReactElement {
  const theme = useTheme();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}> 
      <ScrollView contentContainerStyle={{ padding: theme.spacing.xl, gap: theme.spacing.lg, paddingBottom: 120 }}>
        <Text variant="caption" color="secondary">Addresses</Text>
        <Text variant="h1">Saved places</Text>

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
          <Text variant="bodyStrong">Home</Text>
          <Text variant="secondary" color="secondary" style={{ marginTop: 6 }}>
            24, Lotus Apartments, Banjara Hills, Hyderabad
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
          <Text variant="bodyStrong">Office</Text>
          <Text variant="secondary" color="secondary" style={{ marginTop: 6 }}>
            35, Infocity Avenue, Gachibowli, Hyderabad
          </Text>
        </View>

        <Button label="Back to home" onPress={() => router.push('/')} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  card: { borderWidth: 1 },
});
