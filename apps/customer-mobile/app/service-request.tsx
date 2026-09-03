import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Text } from '@nest/ui';
import { useQuery } from '@tanstack/react-query';
import { useMemo, type ReactElement } from 'react';
import { getServiceRequest } from '@/lib/api';
import { Header, StatusStepper } from '@/components';
import { colors, radius, shadows, spacing } from '@/theme/colors';

const REQUEST_STEPS = [
  { id: '1', title: 'Submitted', subtitle: 'Request received' },
  { id: '2', title: 'Matching', subtitle: 'Selecting specialist' },
  { id: '3', title: 'Scheduled', subtitle: 'Confirmed & assigned' },
];

export default function ServiceRequestScreen(): ReactElement {
  const insets = useSafeAreaInsets();
  const { id, requestId: reqIdParam, issue } = useLocalSearchParams<{
    id?: string;
    requestId?: string;
    issue?: string;
  }>();

  const effectiveId = id ?? reqIdParam;

  const { data: request, isLoading, error, refetch } = useQuery({
    queryKey: ['service-request', effectiveId],
    queryFn: () => (effectiveId ? getServiceRequest(effectiveId) : Promise.resolve(null)),
    enabled: Boolean(effectiveId),
  });

  const displayRawText = request?.rawText ?? issue ?? 'Home service & repair inspection';
  const displayStatus = request?.status ?? 'DRAFT';
  const mediaItems = request?.media ?? [];
  const address = request?.address;

  const currentStepIndex = useMemo(() => {
    switch (displayStatus) {
      case 'DRAFT':
        return 0;
      case 'CLARIFYING':
      case 'READY':
        return 1;
      case 'MATCHED':
        return 2;
      case 'CANCELLED':
        return 0;
      default:
        return 0;
    }
  }, [displayStatus]);

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
          caption="Request Details"
          title="Request Overview"
          subtitle="Real-time status of your submitted service inquiry."
          onBack={() => router.push('/(tabs)')}
        />

        {isLoading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text variant="secondary" color="secondary" style={{ marginTop: 8 }}>
              Loading request details…
            </Text>
          </View>
        ) : null}

        {error ? (
          <View style={styles.errorCard}>
            <Ionicons name="alert-circle" size={20} color={colors.danger} />
            <View style={{ flex: 1 }}>
              <Text variant="bodyStrong" style={{ color: colors.danger }}>
                Unable to load request
              </Text>
              <Text variant="caption" color="secondary">
                Please check your internet connection.
              </Text>
            </View>
            <Pressable onPress={() => void refetch()} style={styles.retryBtn}>
              <Text variant="caption" style={{ color: colors.primary, fontWeight: '700' }}>
                Retry
              </Text>
            </Pressable>
          </View>
        ) : null}

        {/* Status Tracker Stepper */}
        <View style={styles.card}>
          <Text variant="caption" style={styles.cardSectionLabel}>
            REQUEST STATUS
          </Text>
          <View style={{ marginTop: spacing.xs }}>
            <StatusStepper
              steps={REQUEST_STEPS}
              currentStepIndex={currentStepIndex}
              orientation="horizontal"
            />
          </View>
        </View>

        {/* Problem Description Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.iconWrap}>
              <Ionicons name="document-text" size={18} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="bodyStrong">Problem Description</Text>
              <Text variant="caption" color="secondary">
                Submitted by customer
              </Text>
            </View>
            <View style={styles.statusPill}>
              <Text style={styles.statusPillText}>{displayStatus}</Text>
            </View>
          </View>

          <Text variant="body" style={styles.issueText}>
            "{displayRawText}"
          </Text>

          {/* Photo Attachments Gallery */}
          {mediaItems.length > 0 ? (
            <View style={styles.mediaSection}>
              <View style={styles.mediaCountBadge}>
                <Ionicons name="images-outline" size={15} color={colors.primary} />
                <Text variant="caption" style={{ color: colors.primary, fontWeight: '600' }}>
                  {mediaItems.length} photo{mediaItems.length > 1 ? 's' : ''} attached
                </Text>
              </View>
              <View style={styles.mediaGrid}>
                {mediaItems.map((mediaUrl, idx) => (
                  <View key={`photo-${idx}`} style={styles.photoThumbWrap}>
                    <Image
                      source={{ uri: mediaUrl }}
                      style={styles.photoThumb}
                      resizeMode="cover"
                    />
                  </View>
                ))}
              </View>
            </View>
          ) : null}
        </View>

        {/* Service Location Card */}
        <View style={styles.card}>
          <View style={styles.locationRow}>
            <View style={styles.iconWrap}>
              <Ionicons name="location" size={18} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="caption" style={styles.cardSectionLabel}>
                SERVICE LOCATION
              </Text>
              {address ? (
                <>
                  <Text variant="bodyStrong" style={{ marginTop: 2 }}>
                    {address.label} · {address.locality}
                  </Text>
                  <Text variant="caption" color="secondary" style={{ marginTop: 1 }}>
                    {address.locality}, {address.city}
                  </Text>
                </>
              ) : (
                <Text variant="secondary" color="secondary" style={{ marginTop: 2 }}>
                  No doorstep address attached to this request.
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Safety Guarantee */}
        <View style={styles.safetyCard}>
          <Ionicons name="shield-checkmark" size={20} color={colors.success} />
          <View style={{ flex: 1 }}>
            <Text variant="bodyStrong" style={{ color: colors.text }}>
              NEST Service Protection
            </Text>
            <Text variant="caption" color="secondary" style={{ marginTop: 2 }}>
              Verified specialists, transparent quote approval, and 30-day warranty on all repairs.
            </Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionWrap}>
          <Button
            label="View Matching Specialists →"
            onPress={() =>
              router.push({
                pathname: '/problem-assistant',
                params: {
                  requestId: effectiveId ?? '',
                  issue: displayRawText,
                },
              })
            }
          />
          <Pressable
            style={styles.backHomeBtn}
            onPress={() => router.replace('/(tabs)')}
            accessibilityRole="button"
            accessibilityLabel="Back to Home"
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
  loadingBox: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.dangerLight,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
  },
  retryBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusPill: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
  },
  issueText: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.text,
    fontStyle: 'italic',
  },
  mediaSection: {
    gap: spacing.sm,
  },
  mediaCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.sm,
    alignSelf: 'flex-start',
  },
  mediaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  photoThumbWrap: {
    width: 72,
    height: 72,
    borderRadius: radius.sm,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
  },
  photoThumb: {
    width: '100%',
    height: '100%',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  safetyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionWrap: {
    gap: 10,
    marginTop: spacing.xs,
  },
  backHomeBtn: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
