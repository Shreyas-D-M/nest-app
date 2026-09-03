import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, type ReactElement } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Text } from '@nest/ui';
import { useQuery } from '@tanstack/react-query';
import { getServices } from '@/lib/api';
import { classifyProblem } from '@/lib/problem-classifier';
import { StatusStepper } from '@/components';
import { colors, radius, spacing } from '@/theme/colors';

const CATEGORY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  'AC Repair': 'snow-outline',
  'Plumbing': 'water-outline',
  'Electrical': 'flash-outline',
  'Cleaning': 'sparkles-outline',
  'Appliance Repair': 'construct-outline',
  'Painting': 'color-palette-outline',
  'General Handyman': 'hammer-outline',
};

const STEPS = [
  { id: '1', title: 'Problem', icon: 'document-text-outline' as const },
  { id: '2', title: 'Diagnosis', icon: 'sparkles-outline' as const },
  { id: '3', title: 'Specialists', icon: 'people-outline' as const },
];

export default function ProblemAssistantScreen(): ReactElement {
  const insets = useSafeAreaInsets();
  const { issue, category: initialCategory, requestId } = useLocalSearchParams<{
    issue?: string;
    category?: string;
    requestId?: string;
  }>();
  const { data, isLoading, error } = useQuery({ queryKey: ['catalog'], queryFn: getServices });

  const problem = useMemo(() => classifyProblem(issue ?? '', data ?? null), [issue, data]);
  const activeCategory = initialCategory || problem.categoryName;

  const suggestedServices = useMemo(() => {
    const matches = (data?.categories ?? []).flatMap((category) =>
      category.services
        .filter((service) => {
          if (activeCategory && problem.serviceNames.length > 0) {
            return (
              category.name.toLowerCase().includes(activeCategory.toLowerCase()) ||
              problem.serviceNames.some(
                (serviceName) =>
                  service.name.toLowerCase().includes(serviceName.toLowerCase()) ||
                  serviceName.toLowerCase().includes(service.name.toLowerCase()),
              )
            );
          }
          return true;
        })
        .map((service) => ({
          id: service.id,
          name: service.name,
          categoryName: category.name,
          basePriceMinor: service.basePriceMinor,
        })),
    );

    return matches.length > 0
      ? matches.slice(0, 5)
      : (data?.categories ?? []).flatMap((category) =>
          category.services.slice(0, 2).map((service) => ({
            id: service.id,
            name: service.name,
            categoryName: category.name,
            basePriceMinor: service.basePriceMinor,
          })),
        );
  }, [activeCategory, data, problem.serviceNames]);

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
        {/* Top Navigation */}
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
              STEP 2 OF 3 · DIAGNOSIS
            </Text>
            <Text variant="h1" style={styles.title}>
              Here's what we think you need
            </Text>
          </View>
        </View>

        {/* Status Stepper */}
        <View style={styles.stepperWrap}>
          <StatusStepper steps={STEPS} currentStepIndex={1} orientation="horizontal" />
        </View>

        {/* Problem Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <View style={styles.aiBadge}>
              <Ionicons name="sparkles" size={13} color={colors.primary} />
              <Text variant="caption" style={styles.aiBadgeText}>
                Problem Diagnosis
              </Text>
            </View>
            <Text variant="caption" style={{ color: colors.successText, fontWeight: '700' }}>
              High Confidence Match
            </Text>
          </View>

          <View style={styles.quoteBox}>
            <Ionicons name="chatbox-ellipses-outline" size={16} color={colors.primary} />
            <Text variant="bodyStrong" style={styles.quoteText}>
              "{issue ?? 'General service and repair request'}"
            </Text>
          </View>

          <View style={styles.diagnosisDetails}>
            <View style={styles.diagRow}>
              <Text variant="caption" color="secondary">
                Matched Category:
              </Text>
              <Text variant="bodyStrong" style={{ color: colors.text }}>
                {activeCategory}
              </Text>
            </View>
            <View style={styles.diagRow}>
              <Text variant="caption" color="secondary">
                Technician Scope:
              </Text>
              <Text variant="caption" style={{ color: colors.text, fontWeight: '600' }}>
                On-site inspection & repair quote
              </Text>
            </View>
          </View>
        </View>

        {/* Loading / Error / Suggestions */}
        <View style={styles.section}>
          <Text variant="h2" style={styles.sectionTitle}>
            Recommended Service Packages
          </Text>
          <Text variant="caption" color="secondary">
            Select a service to view available verified specialists
          </Text>

          {isLoading ? (
            <View style={styles.centerBox}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text variant="secondary" color="secondary" style={{ marginTop: 8 }}>
                Loading service packages…
              </Text>
            </View>
          ) : null}

          {error ? (
            <View style={styles.errorBox}>
              <Text variant="secondary" color="secondary">
                Unable to load service recommendations right now.
              </Text>
            </View>
          ) : null}

          <View style={styles.servicesList}>
            {suggestedServices.map((service) => (
              <Pressable
                key={service.id}
                style={({ pressed }) => [styles.serviceCard, pressed && styles.serviceCardPressed]}
                onPress={() =>
                  router.push({
                    pathname: '/professionals',
                    params: {
                      category: service.categoryName,
                      service: service.name,
                      issue: issue ?? '',
                      requestId: requestId ?? '',
                    },
                  })
                }
                accessibilityRole="button"
                accessibilityLabel={`Select service: ${service.name}`}
              >
                <View style={styles.serviceIconCircle}>
                  <Ionicons
                    name={CATEGORY_ICONS[service.categoryName] ?? 'construct-outline'}
                    size={20}
                    color={colors.primary}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text variant="bodyStrong" style={styles.serviceName}>
                    {service.name}
                  </Text>
                  <Text variant="caption" color="secondary">
                    {service.categoryName} · On-site inspection
                  </Text>
                </View>

                {service.basePriceMinor != null ? (
                  <View style={styles.priceTag}>
                    <Text variant="caption" style={styles.priceText}>
                      ₹{(service.basePriceMinor / 100).toFixed(0)}
                    </Text>
                  </View>
                ) : (
                  <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                )}
              </Pressable>
            ))}
          </View>
        </View>

        {/* Action Button */}
        <View style={styles.actionWrap}>
          <Button
            label="Find matching professionals →"
            onPress={() =>
              router.push({
                pathname: '/professionals',
                params: {
                  category: activeCategory,
                  issue: issue ?? '',
                  requestId: requestId ?? '',
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
  stepperWrap: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryCard: {
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
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  aiBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  quoteBox: {
    flexDirection: 'row',
    gap: spacing.sm,
    backgroundColor: colors.surfaceSubtle,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'flex-start',
  },
  quoteText: {
    flex: 1,
    fontSize: 13,
    fontStyle: 'italic',
    lineHeight: 18,
    color: colors.text,
  },
  diagnosisDetails: {
    gap: 6,
  },
  diagRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  section: {
    gap: spacing.xs,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  centerBox: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  errorBox: {
    backgroundColor: colors.dangerLight,
    padding: spacing.md,
    borderRadius: radius.md,
  },
  servicesList: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  serviceCardPressed: {
    backgroundColor: colors.surfaceSubtle,
  },
  serviceIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  serviceName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  priceTag: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  priceText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  actionWrap: {
    marginTop: spacing.xs,
  },
});
