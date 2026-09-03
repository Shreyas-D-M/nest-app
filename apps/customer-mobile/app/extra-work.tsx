import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Text } from '@nest/ui';
import type { ReactElement } from 'react';
import { Header } from '@/components';
import { colors, radius, shadows, spacing } from '@/theme/colors';

export default function ExtraWorkScreen(): ReactElement {
  const insets = useSafeAreaInsets();
  const handleApprove = (): void => {
    Alert.alert(
      'Approve Extra Work',
      'Are you sure you want to approve ₹480 for the mixer cartridge replacement?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm & Approve',
          onPress: () =>
            router.push({
              pathname: '/payment',
              params: {
                service: 'Tap Repair & Cartridge Replacement',
                price: '₹499',
                total: '₹979',
              },
            }),
        },
      ],
    );
  };

  const handleReject = (): void => {
    Alert.alert(
      'Decline Extra Work',
      'The specialist will continue only with the original standard inspection/service scope.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline Extra Work',
          style: 'destructive',
          onPress: () => router.back(),
        },
      ],
    );
  };

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
          caption="Technician Quote"
          title="On-Site Extra Work"
          subtitle="Your specialist has detected an additional spare part replacement requirement during physical inspection."
        />

        {/* Notice Banner */}
        <View style={styles.noticeCard}>
          <Ionicons name="information-circle" size={20} color={colors.primary} />
          <Text variant="caption" style={styles.noticeText}>
            No extra work or part replacement will begin without your explicit in-app approval.
          </Text>
        </View>

        {/* Reason Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconCircle, { backgroundColor: colors.warningLight }]}>
              <Ionicons name="construct-outline" size={20} color={colors.warningText} />
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="bodyStrong">Diagnosis & Recommendation</Text>
              <Text variant="caption" color="secondary">
                From Ramesh Kumar (Assigned Pro)
              </Text>
            </View>
          </View>

          <View style={styles.quoteBox}>
            <Text variant="body" style={styles.quoteText}>
              "The internal brass ceramic mixer cartridge has eroded, causing water leakage behind the valve. Replacing it will permanently resolve the issue."
            </Text>
          </View>
        </View>

        {/* Cost Breakdown Card */}
        <View style={styles.card}>
          <Text variant="caption" style={styles.sectionLabel}>
            ADDITIONAL COST BREAKDOWN
          </Text>

          <View style={styles.costRow}>
            <View style={{ flex: 1 }}>
              <Text variant="bodyStrong">Brass Ceramic Cartridge</Text>
              <Text variant="caption" color="secondary">
                Original OEM spare part (90-day warranty)
              </Text>
            </View>
            <Text variant="bodyStrong">₹380</Text>
          </View>

          <View style={styles.costRow}>
            <View style={{ flex: 1 }}>
              <Text variant="bodyStrong">Installation & Testing Labor</Text>
              <Text variant="caption" color="secondary">
                Valve fitting and pressure test
              </Text>
            </View>
            <Text variant="bodyStrong">₹100</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.totalRow}>
            <Text variant="h2" style={{ fontSize: 16 }}>
              Extra Amount
            </Text>
            <Text variant="h1" style={styles.totalAmount}>
              ₹480
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionWrap}>
          <Button label="Approve & Continue →" onPress={handleApprove} />

          <Pressable
            style={styles.rejectBtn}
            onPress={handleReject}
            accessibilityRole="button"
            accessibilityLabel="Decline Extra Work"
          >
            <Text variant="bodyStrong" style={{ color: colors.danger }}>
              Decline Extra Work
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
    paddingBottom: 110,
  },
  noticeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primaryLight,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  noticeText: {
    flex: 1,
    fontSize: 12,
    color: colors.primaryDark,
    lineHeight: 16,
    fontWeight: '500',
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
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quoteBox: {
    backgroundColor: colors.surfaceSubtle,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quoteText: {
    fontSize: 13,
    lineHeight: 19,
    fontStyle: 'italic',
    color: colors.text,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    color: colors.textSecondary,
  },
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
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
    fontSize: 20,
    fontWeight: '800',
    color: colors.primary,
  },
  actionWrap: {
    gap: 10,
    marginTop: spacing.xs,
  },
  rejectBtn: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
