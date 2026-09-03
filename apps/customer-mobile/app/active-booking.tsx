import { Ionicons } from '@expo/vector-icons';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Text } from '@nest/ui';
import { useQuery } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import { listCustomerBookings } from '@/lib/api';
import { useAddress } from '@/lib/address-context';
import { StatusStepper } from '@/components';
import { colors, radius, spacing } from '@/theme/colors';

const TRACKING_STEPS = [
  { id: '1', title: 'Booking Confirmed', subtitle: 'Order placed & scheduled for 6:00 PM', icon: 'checkmark-circle-outline' as const },
  { id: '2', title: 'Specialist Assigned', subtitle: 'Ramesh Kumar (★ 4.9 Verified Pro)', icon: 'person-outline' as const },
  { id: '3', title: 'Specialist En Route', subtitle: 'Departed · ETA ~14 mins', icon: 'navigate-outline' as const },
  { id: '4', title: 'Work in Progress', subtitle: 'Inspection and service delivery', icon: 'hammer-outline' as const },
  { id: '5', title: 'Service Completed', subtitle: 'Post-service test & warranty activated', icon: 'shield-checkmark-outline' as const },
];

export default function ActiveBookingScreen(): ReactElement {
  const insets = useSafeAreaInsets();
  const { selectedAddress } = useAddress();

  const { data: bookingsData } = useQuery({
    queryKey: ['customer-bookings'],
    queryFn: listCustomerBookings,
  });

  const activeBooking = bookingsData?.data?.[0];
  const bookingAddress = activeBooking?.address ?? selectedAddress;

  const locationText = bookingAddress
    ? `${bookingAddress.locality}, ${bookingAddress.city}`
    : 'your registered address';

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
        {/* Top Header */}
        <View style={styles.topRow}>
          <Pressable
            onPress={() => router.push('/bookings')}
            style={styles.backBtn}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={20} color={colors.text} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text variant="caption" style={styles.topCaption}>
              LIVE SERVICE TRACKING
            </Text>
            <Text variant="h1" style={styles.title}>
              Active Appointment
            </Text>
          </View>
        </View>

        {/* Live Status Hero */}
        <View style={styles.statusHero}>
          <View style={styles.statusBadgeRow}>
            <View style={styles.liveBadge}>
              <View style={styles.livePulse} />
              <Text variant="caption" style={styles.liveBadgeText}>
                SPECIALIST EN ROUTE
              </Text>
            </View>
            <Text variant="caption" style={styles.etaText}>
              ETA: ~14 mins
            </Text>
          </View>

          <Text variant="h2" style={styles.statusHeroTitle}>
            Ramesh is on the way to your address
          </Text>
          <Text variant="secondary" style={styles.statusHeroSubtitle}>
            Please ensure someone is available at {locationText} to grant access to the technician.
          </Text>
        </View>

        {/* Specialist Profile Card */}
        <View style={styles.card}>
          <View style={styles.proRow}>
            <View style={styles.avatarCircle}>
              <Text variant="h2" color="inverse">
                R
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text variant="bodyStrong" style={{ fontSize: 16 }}>
                  Ramesh Kumar
                </Text>
                <Ionicons name="shield-checkmark" size={14} color={colors.success} />
              </View>
              <Text variant="caption" color="secondary" style={{ marginTop: 2 }}>
                AC & Appliance Specialist · ★ 4.9 (142 reviews)
              </Text>
            </View>
          </View>

          <View style={styles.actionsRow}>
            <Pressable
              style={styles.actionPill}
              onPress={() =>
                Alert.alert('Call Specialist', 'Calling Ramesh Kumar (+91 98765 43210)...')
              }
              accessibilityRole="button"
              accessibilityLabel="Call Specialist"
            >
              <Ionicons name="call" size={16} color={colors.primary} />
              <Text variant="bodyStrong" style={styles.actionPillText}>
                Call Specialist
              </Text>
            </Pressable>

            <Pressable
              style={styles.actionPill}
              onPress={() => router.push('/support')}
              accessibilityRole="button"
              accessibilityLabel="Help and Support"
            >
              <Ionicons name="chatbubble-ellipses" size={16} color={colors.textSecondary} />
              <Text variant="bodyStrong" style={[styles.actionPillText, { color: colors.text }]}>
                Support
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Step by Step Progress Tracking */}
        <View style={styles.section}>
          <Text variant="h2" style={styles.sectionTitle}>
            Service Progress
          </Text>

          <View style={styles.timelineCard}>
            <StatusStepper steps={TRACKING_STEPS} currentStepIndex={2} orientation="vertical" />
          </View>
        </View>

        {/* Safety OTP Reminder */}
        <View style={styles.otpCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="key-outline" size={18} color={colors.primary} />
            <Text variant="bodyStrong" style={{ color: colors.text }}>
              Start-Service Security PIN
            </Text>
          </View>
          <Text variant="caption" color="secondary">
            Share this PIN with your technician when they arrive at your door:
          </Text>
          <View style={styles.pinBox}>
            <Text variant="h1" style={styles.pinNumber}>
              4 8 2 9
            </Text>
          </View>
        </View>

        {/* Cancel / Reschedule Option */}
        <View style={styles.footerWrap}>
          <Button
            label="Need to reschedule or cancel?"
            variant="secondary"
            onPress={() =>
              Alert.alert(
                'Reschedule Appointment',
                'You can reschedule this appointment free of charge before the specialist arrives.',
                [
                  { text: 'Keep Appointment', style: 'cancel' },
                  {
                    text: 'Reschedule',
                    onPress: () => router.push('/support'),
                  },
                ],
              )
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
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topCaption: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: colors.primary,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
  statusHero: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    shadowColor: colors.primary,
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    gap: spacing.sm,
  },
  statusBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  livePulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  liveBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
  },
  etaText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  statusHeroTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  statusHeroSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  proRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: spacing.md,
  },
  actionPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 10,
    borderRadius: radius.md,
  },
  actionPillText: {
    fontSize: 13,
    color: colors.primary,
  },
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  timelineCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  otpCard: {
    backgroundColor: colors.primaryLight,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    alignItems: 'center',
    gap: spacing.xs,
  },
  pinBox: {
    backgroundColor: colors.card,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    marginTop: spacing.xs,
  },
  pinNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.primaryDark,
    letterSpacing: 8,
  },
  footerWrap: {
    marginTop: spacing.xs,
  },
});
