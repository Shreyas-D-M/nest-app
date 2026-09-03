import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, type ReactElement } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Text } from '@nest/ui';
import { useAddress } from '@/lib/address-context';
import { colors, radius, spacing } from '@/theme/colors';

export default function BookingConfirmationScreen(): ReactElement {
  const insets = useSafeAreaInsets();
  const { service, professionalName, slot, price, addressId } = useLocalSearchParams<{
    service?: string;
    professionalName?: string;
    slot?: string;
    price?: string;
    addressId?: string;
  }>();

  const { addresses, selectedAddress } = useAddress();

  const serviceName = service ?? 'Home Service & Repair';
  const proName = professionalName ?? 'Ramesh Kumar';
  const scheduledTime = slot ? `${slot} (Arrival Window)` : 'Today at 6:00 PM – 6:45 PM';
  const displayPrice = price ?? '₹499';

  const displayAddress = useMemo(() => {
    if (addressId && addresses && addresses.length > 0) {
      const found = addresses.find((a) => a.id === addressId);
      if (found) {
        return `${found.addressLine}, ${found.locality}, ${found.city} - ${found.pincode}`;
      }
    }
    if (selectedAddress) {
      return `${selectedAddress.addressLine}, ${selectedAddress.locality}, ${selectedAddress.city} - ${selectedAddress.pincode}`;
    }
    return 'Doorstep service address';
  }, [addressId, addresses, selectedAddress]);

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
        {/* Success Hero Card */}
        <View style={styles.successCard}>
          <View style={styles.successIconCircle}>
            <Ionicons name="checkmark" size={32} color="#FFFFFF" />
          </View>

          <Text variant="caption" style={styles.successBadge}>
            APPOINTMENT CONFIRMED
          </Text>

          <Text variant="h1" style={styles.successTitle}>
            Booking Confirmed!
          </Text>

          <Text variant="secondary" color="secondary" style={styles.successSubtitle}>
            Your {serviceName} appointment is confirmed with {proName}.
          </Text>
        </View>

        {/* Appointment Details */}
        <View style={styles.card}>
          <View style={styles.detailRow}>
            <View style={styles.detailIconWrap}>
              <Ionicons name="calendar-outline" size={18} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="caption" color="secondary">
                SCHEDULED TIME
              </Text>
              <Text variant="bodyStrong" style={{ marginTop: 1 }}>
                {scheduledTime}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <View style={styles.detailIconWrap}>
              <Ionicons name="person-outline" size={18} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="caption" color="secondary">
                ASSIGNED SPECIALIST
              </Text>
              <Text variant="bodyStrong" style={{ marginTop: 1 }}>
                {proName} · ★ 4.9 Verified Pro
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <View style={styles.detailIconWrap}>
              <Ionicons name="location-outline" size={18} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="caption" color="secondary">
                SERVICE ADDRESS
              </Text>
              <Text variant="bodyStrong" style={{ marginTop: 1 }}>
                {displayAddress}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <View style={styles.detailIconWrap}>
              <Ionicons name="cash-outline" size={18} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="caption" color="secondary">
                PAYABLE AMOUNT (POST-SERVICE)
              </Text>
              <Text variant="bodyStrong" style={{ marginTop: 1 }}>
                {displayPrice} (Cash or UPI)
              </Text>
            </View>
          </View>
        </View>

        {/* Guarantee Info Strip */}
        <View style={styles.guaranteeCard}>
          <Ionicons name="shield-checkmark" size={20} color={colors.success} />
          <View style={{ flex: 1 }}>
            <Text variant="bodyStrong" style={{ color: colors.text }}>
              NEST 30-Day Service Guarantee
            </Text>
            <Text variant="caption" color="secondary" style={{ marginTop: 2 }}>
              If you experience any issues after service completion, we will provide a free re-inspection.
            </Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionsWrap}>
          <Button
            label="Track service →"
            onPress={() => router.push('/active-booking')}
          />
          <Button
            label="View All Bookings"
            variant="secondary"
            onPress={() => router.push('/bookings')}
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
  successCard: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    textAlign: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  successIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  successBadge: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: colors.successText,
    backgroundColor: colors.successLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
  successSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: 4,
  },
  detailIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
  },
  guaranteeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  actionsWrap: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  homeLink: {
    alignItems: 'center',
    paddingVertical: 10,
  },
});
