import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState, type ReactElement } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@nest/ui';
import { useQuery } from '@tanstack/react-query';
import { getServices } from '@/lib/api';
import { useAddress } from '@/lib/address-context';
import { EmptyState, LoadingSkeleton, ProfessionalCard, StatusStepper } from '@/components';
import { colors, radius, spacing } from '@/theme/colors';

const PRO_AVATARS = [
  { name: 'Ramesh K.', rating: '4.9', jobs: '142', exp: '6 yrs exp', avatarBg: '#4F46E5', initial: 'R' },
  { name: 'Suresh M.', rating: '4.8', jobs: '98', exp: '4 yrs exp', avatarBg: '#0D9488', initial: 'S' },
  { name: 'Anil P.', rating: '4.9', jobs: '210', exp: '8 yrs exp', avatarBg: '#7C3AED', initial: 'A' },
  { name: 'Vijay N.', rating: '4.7', jobs: '76', exp: '3 yrs exp', avatarBg: '#D97706', initial: 'V' },
  { name: 'Deepak S.', rating: '4.9', jobs: '185', exp: '7 yrs exp', avatarBg: '#2563EB', initial: 'D' },
];

const STEPS = [
  { id: '1', title: 'Problem', icon: 'document-text-outline' as const },
  { id: '2', title: 'Diagnosis', icon: 'sparkles-outline' as const },
  { id: '3', title: 'Specialists', icon: 'people-outline' as const },
];

export default function ProfessionalsScreen(): ReactElement {
  const insets = useSafeAreaInsets();
  const { category, issue, requestId } = useLocalSearchParams<{
    category?: string;
    issue?: string;
    requestId?: string;
  }>();
  const { selectedAddress } = useAddress();
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ['catalog'], queryFn: getServices });
  const [selectedFilter, setSelectedFilter] = useState<'recommended' | 'rating' | 'fastest'>('recommended');
  const [refreshing, setRefreshing] = useState(false);

  const locationSubtitle = selectedAddress
    ? `${selectedAddress.locality}, ${selectedAddress.city} · Available today`
    : 'Local service area · Available today';

  const serviceMatches = useMemo(() => {
    const categoryFilter = String(category ?? '').trim().toLowerCase();
    const issueFilter = String(issue ?? '').trim().toLowerCase();

    const matches = (data?.categories ?? []).flatMap((catalogCategory) =>
      catalogCategory.services.map((service, index) => ({
        id: service.id,
        name: service.name,
        category: catalogCategory.name,
        price: service.basePriceMinor,
        pro: PRO_AVATARS[index % PRO_AVATARS.length]!,
      })),
    );

    if (!categoryFilter && !issueFilter) {
      return matches.slice(0, 6);
    }

    return matches
      .filter((service) => {
        const serviceText = `${service.name} ${service.category}`.toLowerCase();
        if (categoryFilter && serviceText.includes(categoryFilter)) {
          return true;
        }
        if (issueFilter) {
          return (
            issueFilter.includes(service.name.toLowerCase()) ||
            issueFilter.includes(service.category.toLowerCase()) ||
            serviceText.includes(issueFilter.slice(0, 4))
          );
        }
        return false;
      })
      .slice(0, 10);
  }, [category, data?.categories, issue]);

  const sortedMatches = useMemo(() => {
    if (selectedFilter === 'rating') {
      return [...serviceMatches].sort((a, b) => Number(b.pro.rating) - Number(a.pro.rating));
    }
    if (selectedFilter === 'fastest') {
      return [...serviceMatches].sort((a, b) => parseInt(b.pro.jobs, 10) - parseInt(a.pro.jobs, 10));
    }
    return serviceMatches;
  }, [serviceMatches, selectedFilter]);

  const onRefresh = async (): Promise<void> => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
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
        refreshControl={
          <RefreshControl
            refreshing={refreshing || isLoading}
            onRefresh={() => void onRefresh()}
            tintColor={colors.primary}
          />
        }
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
              LOCAL MARKETPLACE
            </Text>
            <Text variant="h1" style={styles.title}>
              Available Specialists
            </Text>
          </View>
        </View>

        {/* Progress Stepper */}
        <View style={styles.stepperWrap}>
          <StatusStepper steps={STEPS} currentStepIndex={2} orientation="horizontal" />
        </View>

        {/* Search Context Pill */}
        <View style={styles.contextCard}>
          <View style={styles.contextIconCircle}>
            <Ionicons name="shield-checkmark" size={18} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text variant="bodyStrong" style={{ color: colors.text }}>
              {category ? `${category} Specialists` : 'Certified Service Professionals'}
            </Text>
            <Text variant="caption" color="secondary">
              {locationSubtitle}
            </Text>
          </View>
        </View>

        {/* Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
          keyboardShouldPersistTaps="handled"
        >
          <Pressable
            style={[styles.filterPill, selectedFilter === 'recommended' && styles.filterPillActive]}
            onPress={() => setSelectedFilter('recommended')}
            accessibilityRole="button"
            accessibilityLabel="Filter by recommended specialists"
          >
            <Ionicons
              name="sparkles"
              size={13}
              color={selectedFilter === 'recommended' ? '#FFFFFF' : colors.primary}
            />
            <Text
              variant="caption"
              style={[styles.filterText, selectedFilter === 'recommended' && styles.filterTextActive]}
            >
              Recommended
            </Text>
          </Pressable>

          <Pressable
            style={[styles.filterPill, selectedFilter === 'rating' && styles.filterPillActive]}
            onPress={() => setSelectedFilter('rating')}
            accessibilityRole="button"
            accessibilityLabel="Filter by top rated specialists"
          >
            <Ionicons
              name="star"
              size={13}
              color={selectedFilter === 'rating' ? '#FFFFFF' : colors.warning}
            />
            <Text
              variant="caption"
              style={[styles.filterText, selectedFilter === 'rating' && styles.filterTextActive]}
            >
              Top Rated (★ 4.8+)
            </Text>
          </Pressable>

          <Pressable
            style={[styles.filterPill, selectedFilter === 'fastest' && styles.filterPillActive]}
            onPress={() => setSelectedFilter('fastest')}
            accessibilityRole="button"
            accessibilityLabel="Filter by most experienced specialists"
          >
            <Ionicons
              name="flash"
              size={13}
              color={selectedFilter === 'fastest' ? '#FFFFFF' : '#0284C7'}
            />
            <Text
              variant="caption"
              style={[styles.filterText, selectedFilter === 'fastest' && styles.filterTextActive]}
            >
              Most Booked
            </Text>
          </Pressable>
        </ScrollView>

        {/* Loading State */}
        {isLoading && <LoadingSkeleton height={140} count={3} />}

        {/* Error State */}
        {error && !isLoading && (
          <EmptyState
            icon="alert-circle-outline"
            title="Unable to load specialists"
            subtitle="Please check your internet connection and try again."
            actionLabel="Retry"
            onAction={() => void refetch()}
          />
        )}

        {/* Results List */}
        {!isLoading && !error && sortedMatches.length === 0 && (
          <EmptyState
            icon="people-outline"
            title="No specialists found"
            subtitle="Try changing the category or describing your issue differently."
            actionLabel="Back to Categories"
            onAction={() => router.push('/create')}
          />
        )}

        {!isLoading && !error && sortedMatches.length > 0 && (
          <View style={styles.resultsList}>
            {sortedMatches.map((item) => (
              <ProfessionalCard
                key={`${item.id}-${item.pro.name}`}
                id={item.id}
                name={item.pro.name}
                serviceName={item.name}
                rating={item.pro.rating}
                reviewsCount={item.pro.jobs}
                experience={item.pro.exp}
                priceFormatted={item.price != null ? `₹${(item.price / 100).toFixed(0)}` : '₹499'}
                initial={item.pro.initial}
                avatarBg={item.pro.avatarBg}
                onBook={() =>
                  router.push({
                    pathname: '/professional-detail',
                    params: {
                      name: item.pro.name,
                      specialty: item.name,
                      category: item.category,
                      rating: item.pro.rating,
                      jobs: item.pro.jobs,
                      exp: item.pro.exp,
                      price: item.price != null ? `₹${(item.price / 100).toFixed(0)}` : '₹499',
                      initial: item.pro.initial,
                      avatarBg: item.pro.avatarBg,
                      service: item.name,
                      requestId: requestId ?? '',
                    },
                  })
                }
              />
            ))}
          </View>
        )}
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
    gap: spacing.md,
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
  contextCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  contextIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterRow: {
    gap: 8,
    paddingVertical: 2,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.full,
  },
  filterPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  filterTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  resultsList: {
    gap: spacing.md,
  },
});
