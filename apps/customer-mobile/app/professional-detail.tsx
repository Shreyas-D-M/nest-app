import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@nest/ui';
import type { ReactElement } from 'react';
import { useAddress } from '@/lib/address-context';
import { colors, radius, spacing } from '@/theme/colors';

const REVIEWS = [
  {
    id: '1',
    user: 'Pooja K.',
    locality: 'Sadashiv Nagar',
    rating: 5,
    text: 'Arrived exactly on time and diagnosed my AC water leakage within 10 minutes. Clean and polite work.',
    time: '3 days ago',
  },
  {
    id: '2',
    user: 'Vikram D.',
    locality: 'Tilakwadi',
    rating: 5,
    text: 'Professional tools and transparent pricing before starting. Very satisfied with the service!',
    time: '1 week ago',
  },
];

export default function ProfessionalDetailScreen(): ReactElement {
  const insets = useSafeAreaInsets();
  const { selectedAddress } = useAddress();
  const params = useLocalSearchParams<{
    name?: string;
    specialty?: string;
    category?: string;
    rating?: string;
    jobs?: string;
    exp?: string;
    price?: string;
    initial?: string;
    avatarBg?: string;
    service?: string;
    requestId?: string;
  }>();

  const proName = params.name ?? 'Ramesh Kumar';
  const proSpecialty = params.specialty ?? params.service ?? 'AC & Home Appliance Specialist';
  const proRating = params.rating ?? '4.9';
  const proJobs = params.jobs ?? '142+';
  const proExp = params.exp ?? '6+ yrs experience';
  const proInitial = params.initial ?? proName.charAt(0).toUpperCase();
  const proAvatarBg = params.avatarBg ?? colors.primary;
  const proPrice = params.price ?? '₹499';

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: 80 + insets.bottom + 48 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Top Header */}
          <View style={styles.topRow}>
            <Pressable
              onPress={() => router.back()}
              style={styles.backBtn}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Ionicons name="arrow-back" size={20} color={colors.text} />
            </Pressable>
            <View style={{ flex: 1 }}>
              <Text variant="caption" style={styles.topCaption}>
                SPECIALIST PROFILE
              </Text>
              <Text variant="h1" style={styles.title}>
                Professional Details
              </Text>
            </View>
          </View>

          {/* Profile Card */}
          <View style={styles.heroCard}>
            <View style={styles.heroHeader}>
              <View style={[styles.avatarCircle, { backgroundColor: proAvatarBg }]}>
                <Text variant="h1" color="inverse" style={{ fontSize: 24 }}>
                  {proInitial}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text variant="h2" style={styles.proName}>
                    {proName}
                  </Text>
                  <View style={styles.verifiedTag}>
                    <Ionicons name="shield-checkmark" size={12} color={colors.success} />
                    <Text style={styles.verifiedText}>Verified</Text>
                  </View>
                </View>
                <Text variant="caption" color="secondary" style={{ marginTop: 2 }}>
                  {proSpecialty} · {proExp}
                </Text>
              </View>
            </View>

            {/* Stats Bar */}
            <View style={styles.statsBar}>
              <View style={styles.statItem}>
                <Text variant="caption" color="secondary">
                  RATING
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 }}>
                  <Ionicons name="star" size={14} color={colors.warning} />
                  <Text variant="bodyStrong" style={{ color: colors.text }}>
                    {proRating}
                  </Text>
                </View>
              </View>

              <View style={styles.statDivider} />

              <View style={styles.statItem}>
                <Text variant="caption" color="secondary">
                  JOBS DONE
                </Text>
                <Text variant="bodyStrong" style={{ color: colors.text, marginTop: 2 }}>
                  {proJobs}
                </Text>
              </View>

              <View style={styles.statDivider} />

              <View style={styles.statItem}>
                <Text variant="caption" color="secondary">
                  ON-TIME
                </Text>
                <Text variant="bodyStrong" style={{ color: colors.successText, marginTop: 2 }}>
                  99%
                </Text>
              </View>
            </View>
          </View>

          {/* Service Inclusions */}
          <View style={styles.sectionCard}>
            <Text variant="h2" style={styles.sectionTitle}>
              What's Included in This Service
            </Text>

            <View style={styles.inclusionsList}>
              <View style={styles.inclusionRow}>
                <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                <Text variant="secondary" style={styles.inclusionText}>
                  Complete multi-point diagnostic inspection
                </Text>
              </View>
              <View style={styles.inclusionRow}>
                <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                <Text variant="secondary" style={styles.inclusionText}>
                  Upfront repair quote & part cost estimation
                </Text>
              </View>
              <View style={styles.inclusionRow}>
                <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                <Text variant="secondary" style={styles.inclusionText}>
                  Standard tools & basic consumable materials
                </Text>
              </View>
              <View style={styles.inclusionRow}>
                <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                <Text variant="secondary" style={styles.inclusionText}>
                  Post-service cleanup & test run
                </Text>
              </View>
              <View style={styles.inclusionRow}>
                <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                <Text variant="secondary" style={styles.inclusionText}>
                  30-day service warranty protection
                </Text>
              </View>
            </View>
          </View>

          {/* Transparent Pricing Highlight */}
          <View style={styles.pricingCard}>
            <View style={{ flex: 1 }}>
              <Text variant="caption" style={styles.pricingCaption}>
                ESTIMATED STARTING FEE
              </Text>
              <Text variant="h1" style={styles.priceValue}>
                {proPrice}
              </Text>
              <Text variant="caption" color="secondary" style={{ marginTop: 2 }}>
                Covers on-site diagnosis & standard labour
              </Text>
            </View>
            <View style={styles.safetyShieldCircle}>
              <Ionicons name="shield-checkmark" size={24} color={colors.primary} />
            </View>
          </View>

          {/* Verified Customer Reviews */}
          <View style={styles.sectionCard}>
            <View style={styles.reviewsHeader}>
              <Text variant="h2" style={styles.sectionTitle}>
                Customer Reviews
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                <Ionicons name="star" size={14} color={colors.warning} />
                <Text variant="bodyStrong" style={{ color: colors.text }}>
                  {proRating}
                </Text>
                <Text variant="caption" color="secondary">
                  (48 reviews)
                </Text>
              </View>
            </View>

            <View style={{ gap: spacing.md }}>
              {REVIEWS.map((rev) => (
                <View key={rev.id} style={styles.reviewItem}>
                  <View style={styles.reviewTop}>
                    <View>
                      <Text variant="bodyStrong" style={{ color: colors.text }}>
                        {rev.user}
                      </Text>
                      <Text variant="caption" color="secondary">
                        {rev.locality} · {rev.time}
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 1 }}>
                      {Array.from({ length: rev.rating }).map((_, i) => (
                        <Ionicons key={i} name="star" size={12} color={colors.warning} />
                      ))}
                    </View>
                  </View>
                  <Text variant="secondary" style={styles.reviewBody}>
                    "{rev.text}"
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>

        {/* Sticky Bottom Booking Action */}
        <View style={[styles.stickyFooter, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
          <View style={styles.footerPriceWrap}>
            <Text variant="caption" color="secondary">
              Total base price
            </Text>
            <Text variant="h2" style={{ color: colors.text }}>
              {proPrice}
            </Text>
          </View>

          <Pressable
            style={styles.bookBtn}
            onPress={() =>
              router.push({
                pathname: '/booking',
                params: {
                  service: proSpecialty,
                  price: proPrice,
                  professionalName: proName,
                  requestId: params.requestId ?? '',
                  addressId: selectedAddress?.id ?? '',
                },
              })
            }
            accessibilityRole="button"
            accessibilityLabel={`Book ${proName}`}
          >
            <Text variant="bodyStrong" color="inverse" style={styles.bookBtnText}>
              Book this professional →
            </Text>
          </Pressable>
        </View>
      </View>
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
    paddingBottom: 130,
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
  heroCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
    gap: spacing.md,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  proName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  verifiedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.successLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.successText,
  },
  statsBar: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceSubtle,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: colors.border,
  },
  sectionCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  inclusionsList: {
    gap: spacing.sm,
  },
  inclusionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  inclusionText: {
    fontSize: 13,
    color: colors.text,
    flex: 1,
  },
  pricingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  pricingCaption: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
    color: colors.primaryDark,
  },
  priceValue: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.primaryDark,
    marginTop: 2,
  },
  safetyShieldCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewItem: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    paddingBottom: spacing.sm,
    gap: 4,
  },
  reviewTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  reviewBody: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  stickyFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  footerPriceWrap: {
    flex: 1,
  },
  bookBtn: {
    flex: 1.4,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
