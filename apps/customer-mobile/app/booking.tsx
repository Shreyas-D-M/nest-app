import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState, type ReactElement } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Text } from '@nest/ui';
import { useAddress } from '@/lib/address-context';
import { Header } from '@/components';
import { colors, radius, shadows, spacing } from '@/theme/colors';

const TIME_SLOTS = [
  { id: 'today_eve', label: 'Today, 6:00 PM', subtitle: 'Fastest available' },
  { id: 'tmrw_morn', label: 'Tomorrow, 10:00 AM', subtitle: 'Morning slot' },
  { id: 'tmrw_aft', label: 'Tomorrow, 2:00 PM', subtitle: 'Afternoon slot' },
  { id: 'tmrw_eve', label: 'Tomorrow, 6:00 PM', subtitle: 'Evening slot' },
];

export default function BookingScreen(): ReactElement {
  const insets = useSafeAreaInsets();
  const { service, requestId, professionalName, price, addressId } = useLocalSearchParams<{
    service?: string;
    requestId?: string;
    professionalName?: string;
    price?: string;
    addressId?: string;
  }>();

  const { addresses, selectedAddress, isLoading: isAddressesLoading } = useAddress();

  const selectedServiceName = service ?? 'Home Repair Service';
  const proName = professionalName ?? 'Ramesh Kumar';
  const basePrice = price ?? '₹499';
  const [selectedSlot, setSelectedSlot] = useState<string>('today_eve');

  const chosenAddress = useMemo(() => {
    if (addressId && addresses && addresses.length > 0) {
      const match = addresses.find((a) => a.id === addressId);
      if (match) return match;
    }
    return selectedAddress ?? addresses?.[0] ?? null;
  }, [addressId, addresses, selectedAddress]);

  const chosenSlot = TIME_SLOTS.find((s) => s.id === selectedSlot) ?? TIME_SLOTS[0]!;

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
          caption="Confirm Appointment"
          title="Schedule Service"
          subtitle="Choose your preferred arrival window and confirm your doorstep address."
        />

        {/* Selected Service Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.iconWrap}>
              <Ionicons name="construct-outline" size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="bodyStrong" style={styles.serviceName}>
                {selectedServiceName}
              </Text>
              <Text variant="caption" color="secondary">
                Assigned specialist: {proName} (★ 4.9 Verified Pro)
              </Text>
            </View>
          </View>
        </View>

        {/* Time Slot Selection */}
        <View style={styles.section}>
          <Text variant="h2" style={styles.sectionTitle}>
            Select Arrival Window
          </Text>
          <Text variant="caption" color="secondary">
            Specialist will arrive within 30 minutes of selected slot
          </Text>

          <View style={styles.slotsGrid}>
            {TIME_SLOTS.map((slot) => {
              const isSelected = selectedSlot === slot.id;
              return (
                <Pressable
                  key={slot.id}
                  style={[styles.slotCard, isSelected && styles.slotCardActive]}
                  onPress={() => setSelectedSlot(slot.id)}
                  accessibilityRole="button"
                  accessibilityLabel={`Select arrival slot: ${slot.label}`}
                >
                  <View style={styles.slotHeader}>
                    <Text
                      variant="bodyStrong"
                      style={[styles.slotLabel, isSelected && styles.slotLabelActive]}
                    >
                      {slot.label}
                    </Text>
                    <View style={[styles.radioCircle, isSelected && styles.radioCircleActive]}>
                      {isSelected ? <View style={styles.radioDot} /> : null}
                    </View>
                  </View>
                  <Text variant="caption" color="secondary">
                    {slot.subtitle}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Service Address Selection */}
        <View style={styles.section}>
          <View style={styles.addressHeader}>
            <Text variant="h2" style={styles.sectionTitle}>
              Service Location
            </Text>
            <Pressable
              onPress={() =>
                router.push({
                  pathname: '/addresses',
                  params: {
                    returnTo: '/booking',
                    selectedId: chosenAddress?.id ?? '',
                  },
                })
              }
              hitSlop={8}
            >
              <Text variant="caption" style={{ color: colors.primary, fontWeight: '700' }}>
                {chosenAddress ? 'Change →' : '+ Add Address'}
              </Text>
            </Pressable>
          </View>

          {isAddressesLoading ? (
            <View style={styles.addressCard}>
              <Text variant="caption" color="secondary">
                Loading saved address…
              </Text>
            </View>
          ) : chosenAddress ? (
            <View style={styles.addressCard}>
              <Ionicons name="location" size={20} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text variant="bodyStrong">{chosenAddress.label}</Text>
                  <View style={styles.defaultBadge}>
                    <Text style={styles.defaultText}>SELECTED</Text>
                  </View>
                </View>
                <Text variant="body" style={{ fontSize: 13, marginTop: 2 }}>
                  {chosenAddress.addressLine}
                </Text>
                <Text variant="caption" color="secondary">
                  {chosenAddress.locality}, {chosenAddress.city} - {chosenAddress.pincode}
                </Text>
              </View>
            </View>
          ) : (
            <Pressable
              style={styles.addAddressCard}
              onPress={() =>
                router.push({
                  pathname: '/addresses',
                  params: { returnTo: '/booking' },
                })
              }
            >
              <Ionicons name="add-circle-outline" size={22} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Text variant="bodyStrong" style={{ color: colors.primary }}>
                  Add Doorstep Address
                </Text>
                <Text variant="caption" color="secondary">
                  Enter house number and street for technician dispatch
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.primary} />
            </Pressable>
          )}
        </View>

        {/* Itemized Transparent Bill Breakdown */}
        <View style={styles.card}>
          <Text variant="caption" style={styles.billTitle}>
            PRICE BREAKDOWN
          </Text>

          <View style={styles.billList}>
            <View style={styles.billRow}>
              <Text variant="secondary" style={styles.billLabel}>
                Base inspection & diagnostic fee
              </Text>
              <Text variant="bodyStrong">{basePrice}</Text>
            </View>

            <View style={styles.billRow}>
              <Text variant="secondary" style={styles.billLabel}>
                Taxes & 30-Day Service Guarantee
              </Text>
              <Text variant="bodyStrong" style={{ color: colors.successText }}>
                Included
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.totalRow}>
              <View>
                <Text variant="bodyStrong" style={styles.totalLabel}>
                  Total Payable at Doorstep
                </Text>
                <Text variant="caption" color="secondary">
                  Pay via UPI or Cash after service completion
                </Text>
              </View>
              <Text variant="h1" style={styles.totalValue}>
                {basePrice}
              </Text>
            </View>
          </View>
        </View>

        {/* Booking CTA */}
        <View style={styles.actionWrap}>
          <Button
            label="Confirm & Book Appointment →"
            onPress={() =>
              router.push({
                pathname: '/booking-confirmation',
                params: {
                  service: selectedServiceName,
                  professionalName: proName,
                  slot: chosenSlot.label,
                  price: basePrice,
                  requestId: requestId ?? '',
                  addressId: chosenAddress?.id ?? '',
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  section: {
    gap: spacing.xs,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  slotsGrid: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  slotCard: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 2,
  },
  slotCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  slotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  slotLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  slotLabelActive: {
    color: colors.primaryDark,
    fontWeight: '700',
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioCircleActive: {
    borderColor: colors.primary,
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addressCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: spacing.xs,
  },
  addAddressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.primaryLight,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    marginTop: spacing.xs,
  },
  defaultBadge: {
    backgroundColor: colors.successLight,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  defaultText: {
    fontSize: 8,
    fontWeight: '700',
    color: colors.successText,
  },
  billTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    color: colors.textSecondary,
  },
  billList: {
    gap: spacing.sm,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  billLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: 4,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  totalValue: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.primary,
  },
  actionWrap: {
    marginTop: spacing.xs,
  },
});
