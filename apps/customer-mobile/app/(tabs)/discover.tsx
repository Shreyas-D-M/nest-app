import type { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
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
import { CategoryCard, EmptyState, LoadingSkeleton, SearchBar } from '@/components';
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

export default function DiscoverScreen(): ReactElement {
  const insets = useSafeAreaInsets();
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ['catalog'], queryFn: getServices });
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const categories = useMemo(() => data?.categories ?? [], [data?.categories]);

  const filteredCategories = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return categories;
    return categories
      .map((cat) => ({
        ...cat,
        services: cat.services.filter(
          (s) =>
            s.name.toLowerCase().includes(q) ||
            cat.name.toLowerCase().includes(q),
        ),
      }))
      .filter((cat) => cat.services.length > 0 || cat.name.toLowerCase().includes(q));
  }, [categories, search]);

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
          { paddingBottom: 72 + insets.bottom + 40 },
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
        <View style={styles.header}>
          <Text variant="caption" style={styles.topCaption}>
            SERVICE CATALOGUE
          </Text>
          <Text variant="h1" style={styles.title}>
            Explore Services
          </Text>
          <Text variant="secondary" color="secondary" style={styles.subtitle}>
            Browse categories with verified technicians and standard rate cards
          </Text>
        </View>

        {/* Live Search Bar */}
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Search all services (e.g. AC, tap, wiring)"
          onClear={() => setSearch('')}
        />

        {/* Loading State */}
        {isLoading && <LoadingSkeleton height={140} count={3} />}

        {/* Error State */}
        {error && !isLoading && (
          <EmptyState
            icon="alert-circle-outline"
            title="Service catalogue unavailable"
            subtitle="We couldn't load the service list right now. Please check your connection."
            actionLabel="Retry Loading"
            onAction={() => void refetch()}
          />
        )}

        {/* Empty Search Result State */}
        {!isLoading && !error && filteredCategories.length === 0 && (
          <EmptyState
            icon="search-outline"
            title="No services match your search"
            subtitle="Try searching with a different term, or create a custom request with your own description."
            actionLabel="Custom Request →"
            onAction={() =>
              router.push({
                pathname: '/create',
                params: { issue: search },
              })
            }
          />
        )}

        {/* Category List Cards */}
        {!isLoading && !error && (
          <View style={styles.list}>
            {filteredCategories.map((category) => {
              const icon = CATEGORY_ICONS[category.name] ?? 'construct-outline';

              return (
                <CategoryCard
                  key={category.id}
                  id={category.id}
                  name={category.name}
                  iconName={icon}
                  services={category.services}
                  onRequestCategory={() =>
                    router.push({
                      pathname: '/create',
                      params: { category: category.name },
                    })
                  }
                  onSelectService={(serviceName) =>
                    router.push({
                      pathname: '/create',
                      params: { category: category.name, service: serviceName },
                    })
                  }
                />
              );
            })}
          </View>
        )}

        {/* Custom Request Banner */}
        <View style={styles.banner}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text variant="bodyStrong" style={{ color: colors.text }}>
              Can't find your exact problem?
            </Text>
            <Text variant="caption" color="secondary">
              Describe your issue directly and our AI assistant will diagnose it for you.
            </Text>
          </View>
          <Pressable
            style={styles.bannerBtn}
            onPress={() => router.push('/create')}
            accessibilityRole="button"
            accessibilityLabel="Describe issue"
          >
            <Text variant="bodyStrong" color="inverse" style={{ fontSize: 13 }}>
              Describe →
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
  header: {
    marginTop: spacing.xs,
    gap: 2,
  },
  topCaption: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: colors.primary,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  list: {
    gap: spacing.md,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  bannerBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.md,
  },
});
