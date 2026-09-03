import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Text } from '@nest/ui';
import type { ReactElement } from 'react';
import { Header, TrustBadge } from '@/components';
import { colors, radius, shadows, spacing } from '@/theme/colors';

export default function AboutScreen(): ReactElement {
  const insets = useSafeAreaInsets();
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
          caption="About NEST"
          title="About the Platform"
          subtitle="Building India's most trusted home-services marketplace."
        />

        {/* Hero Card */}
        <View style={styles.brandHero}>
          <View style={styles.brandLogoWrap}>
            <Ionicons name="home" size={28} color="#FFFFFF" />
          </View>
          <Text variant="h1" style={styles.brandName}>
            NEST
          </Text>
          <Text variant="caption" style={styles.brandTagline}>
            VERIFIED HOME SERVICES & REPAIRS
          </Text>
          <Text variant="secondary" color="secondary" style={styles.brandDescription}>
            NEST connects homeowners with background-verified, high-rated local specialists with upfront transparent pricing and a 30-day service guarantee.
          </Text>
        </View>

        {/* Core Pillars */}
        <View style={styles.card}>
          <View style={styles.featureRow}>
            <View style={[styles.iconCircle, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="shield-checkmark" size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="bodyStrong">100% Verified Specialists</Text>
              <Text variant="caption" color="secondary" style={{ marginTop: 2 }}>
                Every professional passes identity verification, skill assessment, and background checks.
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.featureRow}>
            <View style={[styles.iconCircle, { backgroundColor: colors.successLight }]}>
              <Ionicons name="pricetag" size={20} color={colors.successText} />
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="bodyStrong">Transparent Upfront Pricing</Text>
              <Text variant="caption" color="secondary" style={{ marginTop: 2 }}>
                No hidden fees or unexpected surcharges. Pay only after service completion via UPI or Cash.
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.featureRow}>
            <View style={[styles.iconCircle, { backgroundColor: colors.warningLight }]}>
              <Ionicons name="medal" size={20} color={colors.warningText} />
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="bodyStrong">30-Day Service Guarantee</Text>
              <Text variant="caption" color="secondary" style={{ marginTop: 2 }}>
                If an issue recurs after service delivery, we arrange a free inspection and resolution.
              </Text>
            </View>
          </View>
        </View>

        {/* Trust Badges Strip */}
        <TrustBadge />

        {/* App Version Info */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text variant="caption" color="secondary">
              App Version
            </Text>
            <Text variant="caption" style={{ fontWeight: '700', color: colors.text }}>
              v1.0.0 (Production)
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text variant="caption" color="secondary">
              Operating Region
            </Text>
            <Text variant="caption" style={{ fontWeight: '700', color: colors.text }}>
              Belagavi, Karnataka
            </Text>
          </View>
        </View>

        <Button label="Back to Home" onPress={() => router.push('/')} />
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
  brandHero: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
    gap: spacing.xs,
  },
  brandLogoWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  brandName: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 1,
    color: colors.text,
  },
  brandTagline: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: colors.primary,
  },
  brandDescription: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginTop: spacing.xs,
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
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
  },
  infoCard: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
