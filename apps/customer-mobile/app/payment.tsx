import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState, type ReactElement } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Text } from '@nest/ui';
import { Header } from '@/components';
import { colors, radius, shadows, spacing } from '@/theme/colors';

const PAYMENT_METHODS = [
  {
    id: 'upi',
    title: 'UPI (Google Pay, PhonePe, Paytm)',
    subtitle: 'Fast & contactless digital payment',
    icon: 'phone-portrait-outline' as const,
    badge: 'Popular',
  },
  {
    id: 'cards',
    title: 'Credit / Debit Card',
    subtitle: 'Visa, Mastercard, RuPay',
    icon: 'card-outline' as const,
  },
  {
    id: 'cash',
    title: 'Pay after service completion',
    subtitle: 'Pay technician directly via Cash or UPI on arrival',
    icon: 'cash-outline' as const,
  },
];

export default function PaymentScreen(): ReactElement {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ service?: string; price?: string; total?: string }>();
  const [selectedMethod, setSelectedMethod] = useState('upi');

  const basePrice = params.price ?? '₹499';
  const totalAmount = params.total ?? basePrice;

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
          caption="Secure Checkout"
          title="Payment Details"
          subtitle="Choose your preferred payment method. Payment is completed only after service delivery."
        />

        {/* Bill Breakdown Card */}
        <View style={styles.card}>
          <Text variant="caption" style={styles.cardSectionLabel}>
            BILL SUMMARY
          </Text>

          <View style={styles.billRow}>
            <Text variant="secondary" color="secondary">
              Service Fee ({params.service ?? 'Inspection & Repair'})
            </Text>
            <Text variant="bodyStrong">{basePrice}</Text>
          </View>

          <View style={styles.billRow}>
            <Text variant="secondary" color="secondary">
              Taxes & 30-Day Guarantee
            </Text>
            <Text variant="bodyStrong" style={{ color: colors.successText }}>
              Included
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.totalRow}>
            <View>
              <Text variant="bodyStrong" style={{ fontSize: 16 }}>
                Total Payable
              </Text>
              <Text variant="caption" color="secondary">
                No hidden fees or extra charges
              </Text>
            </View>
            <Text variant="h1" style={styles.totalAmount}>
              {totalAmount}
            </Text>
          </View>
        </View>

        {/* Payment Methods Selection */}
        <View style={styles.section}>
          <Text variant="caption" style={styles.sectionLabel}>
            SELECT PAYMENT METHOD
          </Text>

          <View style={styles.methodsList}>
            {PAYMENT_METHODS.map((method) => {
              const isSelected = selectedMethod === method.id;
              return (
                <Pressable
                  key={method.id}
                  style={[styles.methodCard, isSelected && styles.methodCardSelected]}
                  onPress={() => setSelectedMethod(method.id)}
                  accessibilityRole="button"
                  accessibilityLabel={`Payment method: ${method.title}`}
                >
                  <View style={[styles.methodIconCircle, isSelected && styles.methodIconCircleSelected]}>
                    <Ionicons
                      name={method.icon}
                      size={20}
                      color={isSelected ? colors.primary : colors.textSecondary}
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text variant="bodyStrong" style={styles.methodTitle}>
                        {method.title}
                      </Text>
                      {method.badge ? (
                        <View style={styles.badge}>
                          <Text style={styles.badgeText}>{method.badge}</Text>
                        </View>
                      ) : null}
                    </View>
                    <Text variant="caption" color="secondary" style={{ marginTop: 2 }}>
                      {method.subtitle}
                    </Text>
                  </View>

                  <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                    {isSelected ? <View style={styles.radioDot} /> : null}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Security & Protection Guarantee */}
        <View style={styles.protectionCard}>
          <Ionicons name="shield-checkmark" size={20} color={colors.success} />
          <View style={{ flex: 1 }}>
            <Text variant="bodyStrong" style={{ color: colors.text }}>
              NEST Payment Protection
            </Text>
            <Text variant="caption" color="secondary" style={{ marginTop: 2 }}>
              Your payment is held safely until you confirm that the service has been completed to your satisfaction.
            </Text>
          </View>
        </View>

        {/* Action Button */}
        <View style={styles.actionWrap}>
          <Button
            label="Continue to Invoice Receipt →"
            onPress={() =>
              router.push({
                pathname: '/invoice',
                params: {
                  service: params.service,
                  total: totalAmount,
                  method: selectedMethod,
                },
              })
            }
          />
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
    paddingBottom: 110,
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
  cardSectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    color: colors.textSecondary,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalAmount: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.primary,
  },
  section: {
    gap: spacing.xs,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  methodsList: {
    gap: spacing.sm,
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  methodCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  methodIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.surfaceMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  methodIconCircleSelected: {
    backgroundColor: '#FFFFFF',
  },
  methodTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  badge: {
    backgroundColor: colors.warningLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.warningText,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioCircleSelected: {
    borderColor: colors.primary,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  protectionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionWrap: {
    marginTop: spacing.xs,
  },
});
