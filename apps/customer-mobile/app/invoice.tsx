import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Text } from '@nest/ui';
import type { ReactElement } from 'react';
import { useAddress } from '@/lib/address-context';
import { Header } from '@/components';
import { colors, radius, shadows, spacing } from '@/theme/colors';

export default function InvoiceScreen(): ReactElement {
  const insets = useSafeAreaInsets();
  const { selectedAddress } = useAddress();
  const params = useLocalSearchParams<{ service?: string; total?: string; method?: string }>();

  const invoiceNumber = 'INV-2026-8942';
  const serviceName = params.service ?? 'AC Inspection & Deep Service';
  const totalAmount = params.total ?? '₹499';
  const paymentMethodName =
    params.method === 'cash' ? 'Pay after Service' : 'UPI (Google Pay / PhonePe)';

  const formattedDate = new Date().toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const locationText = selectedAddress
    ? `${selectedAddress.locality}, ${selectedAddress.city}`
    : 'Doorstep Service';

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 48 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Header
          caption="Tax Invoice & Receipt"
          title="Service Receipt"
          subtitle="Itemized receipt and proof of warranty for your completed home service."
        />

        {/* Receipt Card */}
        <View style={styles.card}>
          <View style={styles.receiptHeader}>
            <View>
              <Text variant="h2" style={styles.invoiceNumber}>
                {invoiceNumber}
              </Text>
              <Text variant="caption" color="secondary" style={{ marginTop: 2 }}>
                Issued on {formattedDate}
              </Text>
            </View>

            <View style={styles.paidBadge}>
              <Ionicons name="checkmark-circle" size={13} color={colors.successText} />
              <Text style={styles.paidBadgeText}>PAID</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Itemized Breakdown */}
          <View style={styles.breakdownList}>
            <View style={styles.itemRow}>
              <View style={{ flex: 1 }}>
                <Text variant="bodyStrong">{serviceName}</Text>
                <Text variant="caption" color="secondary">
                  Primary inspection & technician labor
                </Text>
              </View>
              <Text variant="bodyStrong">{totalAmount}</Text>
            </View>

            <View style={styles.itemRow}>
              <View style={{ flex: 1 }}>
                <Text variant="secondary" color="secondary">
                  30-Day Re-Inspection Warranty
                </Text>
                <Text variant="caption" color="secondary">
                  Service protection guarantee
                </Text>
              </View>
              <Text variant="bodyStrong" style={{ color: colors.successText }}>
                Included
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.totalRow}>
              <Text variant="h2" style={{ fontSize: 16 }}>
                Total Paid
              </Text>
              <Text variant="h1" style={styles.totalAmount}>
                {totalAmount}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Payment Method Details */}
          <View style={styles.methodRow}>
            <Ionicons name="shield-checkmark" size={16} color={colors.primary} />
            <Text variant="caption" color="secondary" style={{ flex: 1 }}>
              Settled via {paymentMethodName} · {locationText}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionWrap}>
          <Button
            label="Rate & Review Specialist →"
            onPress={() =>
              router.push({
                pathname: '/review',
                params: { service: serviceName },
              })
            }
          />

          <Button
            label="Download PDF Receipt"
            variant="secondary"
            onPress={() =>
              Alert.alert('Download Invoice', 'Tax invoice PDF downloaded to your device.')
            }
          />

          <Pressable
            style={styles.homeLink}
            onPress={() => router.push('/(tabs)')}
          >
            <Text variant="bodyStrong" style={{ color: colors.primary }}>
              Back to Home
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
    gap: spacing.md,
  },
  receiptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  invoiceNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  paidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.successLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  paidBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.successText,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
  },
  breakdownList: {
    gap: spacing.md,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalAmount: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.primary,
  },
  methodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceSubtle,
    padding: spacing.md,
    borderRadius: radius.md,
  },
  actionWrap: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  homeLink: {
    alignItems: 'center',
    paddingVertical: 10,
  },
});
