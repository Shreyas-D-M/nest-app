import { Ionicons } from '@expo/vector-icons';
import {
  Alert,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@nest/ui';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type ReactElement } from 'react';
import type { ProfessionalServiceOffering } from '@nest/types';
import { getProfessionalProfile, listProfessionalServices } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { EmptyState, Header, StatusPill } from '@/components';
import { colors, radius, shadows, spacing } from '@/theme/colors';

export default function BusinessScreen(): ReactElement {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { signOut } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const {
    data: profile,
    isLoading: isProfileLoading,
    refetch: refetchProfile,
  } = useQuery({
    queryKey: ['professional-profile'],
    queryFn: getProfessionalProfile,
  });

  const {
    data: services,
    refetch: refetchServices,
  } = useQuery({
    queryKey: ['professional-services'],
    queryFn: listProfessionalServices,
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchProfile(), refetchServices()]);
    setRefreshing(false);
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out of your partner account?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          queryClient.clear();
          await signOut();
          Alert.alert('Signed Out', 'You have been signed out.');
        },
      },
    ]);
  };

  const businessName = profile?.businessName ?? 'Specialist Partner';
  const displayInitial = businessName.slice(0, 1).toUpperCase();
  const activeServices: ProfessionalServiceOffering[] = Array.isArray(services)
    ? services
    : profile?.services ?? [];

  const serviceAreas =
    profile?.serviceAreas && profile.serviceAreas.length > 0
      ? profile.serviceAreas.map((sa) => sa.locality)
      : ['Koramangala', 'Indiranagar', 'HSR Layout', 'Whitefield', 'Bellandur', 'JP Nagar'];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 32 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing || isProfileLoading}
            onRefresh={() => void onRefresh()}
            tintColor={colors.primary}
          />
        }
      >
        <Header
          caption="Profile"
          title="Partner Storefront"
          subtitle="Customer-facing profile, active catalog services, and operational credentials."
        />

        {/* Public Specialist Profile Header Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileTopRow}>
            <View style={styles.avatarWrap}>
              <Text style={styles.avatarInitial}>{displayInitial}</Text>
            </View>
            <View style={styles.profileInfo}>
              <View style={styles.nameRow}>
                <Text variant="h1" style={styles.businessTitle} numberOfLines={1}>
                  {businessName}
                </Text>
                <StatusPill
                  status={profile?.verificationStatus ?? 'VERIFIED'}
                  size="sm"
                />
              </View>
              <Text variant="caption" color="secondary">
                {profile?.yearsExperience ?? 5} years verified experience
              </Text>
            </View>
          </View>

          {profile?.bio ? (
            <Text variant="body" style={styles.bioText}>
              "{profile.bio}"
            </Text>
          ) : null}

          <View style={styles.divider} />

          {/* Quick Metrics Bar */}
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text variant="caption" style={styles.statLabel}>
                Completed
              </Text>
              <Text variant="bodyStrong" style={styles.statValue}>
                {profile?.completedJobs ?? 128}
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text variant="caption" style={styles.statLabel}>
                Rating
              </Text>
              <Text variant="bodyStrong" style={styles.statValue}>
                4.9 ★
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text variant="caption" style={styles.statLabel}>
                On-Time
              </Text>
              <Text variant="bodyStrong" style={styles.statValue}>
                98%
              </Text>
            </View>
          </View>
        </View>

        {/* Services Offered Section */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Text variant="h2" style={styles.sectionTitle}>
              Active Listed Services
            </Text>
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{activeServices.length}</Text>
            </View>
          </View>

          {activeServices.length > 0 ? (
            <View style={styles.servicesList}>
              {activeServices.map((service) => {
                const priceMinor = service.basePriceMinor ?? 49900;
                const formattedPrice = `₹${(priceMinor / 100).toFixed(0)}`;
                const pricingLabel =
                  service.pricingType === 'ESTIMATE' ? 'estimate' : 'fixed';

                return (
                  <View key={service.serviceId} style={styles.serviceCard}>
                    <View style={styles.serviceCardHeader}>
                      <View style={styles.serviceMeta}>
                        <Text variant="bodyStrong" style={styles.serviceName} numberOfLines={1}>
                          {service.serviceName}
                        </Text>
                        <Text variant="caption" color="secondary" numberOfLines={1}>
                          {service.pricingType} pricing · Doorstep delivery
                        </Text>
                      </View>
                      <View style={styles.priceTag}>
                        <Text variant="caption" style={styles.priceFromLabel}>
                          From
                        </Text>
                        <Text variant="bodyStrong" style={styles.priceValue}>
                          {formattedPrice}
                        </Text>
                        <Text variant="caption" style={styles.pricingTypeLabel}>
                          {pricingLabel}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.serviceCardFooter}>
                      <View style={styles.activePill}>
                        <View style={styles.activeDot} />
                        <Text style={styles.activePillText}>Available in Catalog</Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            <EmptyState
              icon="construct-outline"
              title="No Listed Services"
              description="Contact your city operations manager to assign specialized catalog services to your partner profile."
            />
          )}
        </View>

        {/* Service Area Coverage */}
        <View style={styles.section}>
          <Text variant="h2" style={styles.sectionTitle}>
            Service Area Coverage
          </Text>
          <View style={styles.coverageCard}>
            <View style={styles.coverageHeader}>
              <Ionicons name="map-outline" size={18} color={colors.primary} />
              <Text variant="bodyStrong" style={styles.coverageCity}>
                Assigned Service Localities
              </Text>
            </View>
            <View style={styles.chipsWrap}>
              {serviceAreas.map((locality) => (
                <View key={locality} style={styles.chip}>
                  <Text variant="caption" style={styles.chipText}>
                    {locality}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Operational Help & Actions */}
        <View style={styles.section}>
          <Text variant="h2" style={styles.sectionTitle}>
            Support & Account
          </Text>

          <View style={styles.actionsCard}>
            <Pressable
              style={({ pressed }) => [
                styles.actionRow,
                pressed && styles.rowPressed,
              ]}
              onPress={() => void Linking.openURL('tel:1800123456')}
              accessibilityRole="button"
              accessibilityLabel="Call partner support helpline"
            >
              <View style={styles.actionIconWrap}>
                <Ionicons name="headset-outline" size={18} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="bodyStrong" style={styles.actionTitle}>
                  Partner Support Helpline
                </Text>
                <Text variant="caption" color="secondary">
                  24/7 dedicated dispatch resolution desk
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </Pressable>

            <View style={styles.itemSeparator} />

            <Pressable
              style={({ pressed }) => [
                styles.actionRow,
                pressed && styles.rowPressed,
              ]}
              onPress={() =>
                Alert.alert(
                  'NEST Partner Agreement',
                  'Your service partner standards, quality SLA, and insurance coverage are active.',
                )
              }
              accessibilityRole="button"
              accessibilityLabel="View partner agreement"
            >
              <View style={styles.actionIconWrap}>
                <Ionicons name="document-text-outline" size={18} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="bodyStrong" style={styles.actionTitle}>
                  Partner Agreement & SLAs
                </Text>
                <Text variant="caption" color="secondary">
                  Quality standards and technician coverage
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </Pressable>
          </View>

          {/* Sign Out Button */}
          <Pressable
            style={({ pressed }) => [
              styles.signOutBtn,
              pressed && styles.btnPressed,
            ]}
            onPress={handleSignOut}
            accessibilityRole="button"
            accessibilityLabel="Sign out of partner account"
          >
            <Ionicons name="log-out-outline" size={18} color={colors.danger} />
            <Text variant="bodyStrong" style={styles.signOutText}>
              Sign Out of Partner Account
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
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    gap: spacing.lg,
  },
  profileCard: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
    gap: spacing.md,
  },
  profileTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatarWrap: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  profileInfo: {
    flex: 1,
    gap: 3,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  businessTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.3,
  },
  bioText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textMuted,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: colors.borderLight,
  },
  section: {
    gap: spacing.sm,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  countBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radius.full,
  },
  countBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  servicesList: {
    gap: spacing.sm,
  },
  serviceCard: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
    gap: spacing.xs,
  },
  serviceCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  serviceMeta: {
    flex: 1,
    gap: 1,
  },
  serviceName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  priceTag: {
    alignItems: 'flex-end',
  },
  priceFromLabel: {
    fontSize: 10,
    color: colors.textMuted,
  },
  priceValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  pricingTypeLabel: {
    fontSize: 10,
    color: colors.textMuted,
  },
  serviceCardFooter: {
    paddingTop: 4,
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: colors.successLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.success,
  },
  activePillText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.successText,
  },
  coverageCard: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
    gap: spacing.sm,
  },
  coverageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  coverageCity: {
    fontSize: 13,
    color: colors.text,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  chipText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  actionsCard: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.sm,
  },
  actionIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionTitle: {
    fontSize: 13,
    color: colors.text,
  },
  itemSeparator: {
    height: 1,
    backgroundColor: colors.borderLight,
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 46,
    backgroundColor: colors.dangerLight,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
    marginTop: spacing.xs,
  },
  signOutText: {
    color: colors.dangerText,
    fontSize: 13,
    fontWeight: '600',
  },
  rowPressed: {
    backgroundColor: colors.surfaceSubtle,
  },
  btnPressed: {
    opacity: 0.85,
  },
});
