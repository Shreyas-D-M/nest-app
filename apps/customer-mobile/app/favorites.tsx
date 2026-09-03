import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@nest/ui';
import { useQuery } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import { listFavorites } from '@/lib/api';
import { EmptyState, Header, LoadingSkeleton } from '@/components';
import { colors, radius, shadows, spacing } from '@/theme/colors';

export default function FavoritesScreen(): ReactElement {
  const insets = useSafeAreaInsets();
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['favorites'],
    queryFn: listFavorites,
  });

  const favorites = data ?? [];

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
          caption="Saved Professionals"
          title="Your Trusted Specialists"
          subtitle="Quickly rebook top-rated professionals who have previously serviced your home."
        />

        {/* Loading State */}
        {isLoading && <LoadingSkeleton height={110} count={3} />}

        {/* Error State */}
        {error && !isLoading && (
          <EmptyState
            icon="alert-circle-outline"
            title="Unable to load saved specialists"
            subtitle="Please check your network connection and try again."
            actionLabel="Retry"
            onAction={() => void refetch()}
          />
        )}

        {/* Empty State */}
        {!isLoading && !error && favorites.length === 0 && (
          <EmptyState
            icon="heart-outline"
            title="No saved specialists yet"
            subtitle="After booking a service, you can favorite any professional to easily re-book them in the future."
            actionLabel="Discover Specialists →"
            onAction={() => router.push('/professionals')}
          />
        )}

        {/* Favorites List */}
        {!isLoading && !error && favorites.length > 0 ? (
          <View style={styles.list}>
            {favorites.map((person) => {
              const name = person.professional.businessName;
              const initial = name.slice(0, 1).toUpperCase();
              const rating = '4.9';

              return (
                <View key={person.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={styles.avatarCircle}>
                      <Text variant="h2" color="inverse" style={{ fontSize: 18 }}>
                        {initial}
                      </Text>
                    </View>

                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text variant="bodyStrong" style={styles.name}>
                          {name}
                        </Text>
                        <Ionicons name="shield-checkmark" size={14} color={colors.success} />
                      </View>
                      <Text variant="caption" color="secondary" style={{ marginTop: 2 }}>
                        {person.professional.bio ?? 'Verified Home Specialist'}
                      </Text>
                    </View>

                    <View style={styles.ratingBadge}>
                      <Ionicons name="star" size={12} color={colors.warning} />
                      <Text style={styles.ratingText}>{rating}</Text>
                    </View>
                  </View>

                  <View style={styles.divider} />

                  <View style={styles.footer}>
                    <View style={styles.jobsCount}>
                      <Ionicons name="shield-checkmark-outline" size={14} color={colors.primary} />
                      <Text variant="caption" color="secondary">
                        Verified NEST Professional
                      </Text>
                    </View>

                    <Pressable
                      style={styles.bookBtn}
                      onPress={() =>
                        router.push({
                          pathname: '/booking',
                          params: {
                            service: person.professional.businessName,
                            professionalName: name,
                          },
                        })
                      }
                      accessibilityRole="button"
                      accessibilityLabel={`Book ${name} again`}
                    >
                      <Text variant="caption" style={styles.bookBtnText}>
                        Book again →
                      </Text>
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </View>
        ) : null}
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
  list: {
    gap: spacing.md,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
    gap: spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatarCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.warningLight,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.warningText,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  jobsCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  bookBtn: {
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.sm,
  },
  bookBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primaryDark,
  },
});
