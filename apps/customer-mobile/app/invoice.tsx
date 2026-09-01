import { Alert } from 'react-native';
import { Link, router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Text, useTheme } from '@nest/ui';
import type { ReactElement } from 'react';

export default function InvoiceScreen(): ReactElement {
  const theme = useTheme();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={{ padding: theme.spacing.xl, gap: theme.spacing.lg }}>
        <View style={styles.topRow}>
          <Link href="/payment" asChild>
            <Text variant="secondary" color="accent">
              ← Back
            </Text>
          </Link>
          <Text variant="caption" color="secondary">
            Invoice
          </Text>
        </View>

        <Text variant="h1">Receipt</Text>

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
          <Text variant="h2">NEST-2041</Text>
          <Text color="secondary" style={{ marginTop: 8 }}>
            18 Aug 2026 · Paid successfully
          </Text>
          <View style={styles.row}>
            <Text color="secondary">Service</Text>
            <Text>₹499</Text>
          </View>
          <View style={styles.row}>
            <Text color="secondary">Extra work</Text>
            <Text>₹480</Text>
          </View>
          <View style={styles.row}>
            <Text color="secondary">Platform fee</Text>
            <Text>₹48</Text>
          </View>
          <View style={[styles.row, styles.totalRow]}>
            <Text variant="bodyStrong">Total paid</Text>
            <Text variant="bodyStrong">₹1,027</Text>
          </View>
        </View>

        <View style={{ gap: theme.spacing.sm }}>
          <Button label="Write a review" onPress={() => router.push('/review')} />
          <Button
            label="Download receipt"
            variant="secondary"
            onPress={() => Alert.alert('Receipt ready', 'Your invoice has been prepared successfully.', [{ text: 'OK' }])}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  card: { borderWidth: 1 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  totalRow: { borderTopWidth: 1, borderTopColor: '#E4E8E5', paddingTop: 10, marginTop: 12 },
});
