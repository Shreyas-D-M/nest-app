import { Link } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, useTheme } from '@nest/ui';
import type { ReactElement } from 'react';

const messages = [
  { id: '1', sender: 'NEST Support', preview: 'Your AC service request has been assigned.', time: '2m ago' },
  { id: '2', sender: 'Aman', preview: 'I am on my way and will arrive in 15 minutes.', time: '1h ago' },
  { id: '3', sender: 'Home Passport', preview: 'Your appliance maintenance check is due next week.', time: 'Yesterday' },
];

export default function MessagesScreen(): ReactElement {
  const theme = useTheme();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}> 
      <ScrollView contentContainerStyle={{ padding: theme.spacing.xl, gap: theme.spacing.lg, paddingBottom: 140 }}>
        <View style={styles.topRow}>
          <Text variant="caption" color="secondary">Messages</Text>
        </View>

        <Text variant="h1">Inbox</Text>

        <View style={styles.list}>
          {messages.map((item) => (
            <View
              key={item.id}
              style={[
                styles.card,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                  borderRadius: theme.radius.md,
                  padding: theme.spacing.md,
                },
              ]}
            >
              <View style={styles.cardRow}>
                <Text variant="bodyStrong">{item.sender}</Text>
                <Text variant="secondary" color="secondary">{item.time}</Text>
              </View>
              <Text variant="secondary" color="secondary" style={{ marginTop: 6 }}>
                {item.preview}
              </Text>
            </View>
          ))}
        </View>

        <Link href="/support" style={{ alignSelf: 'flex-start' }}>
          <Text variant="secondary" color="accent">Need help?</Text>
        </Link>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  list: { gap: 12 },
  card: { borderWidth: 1 },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
});
