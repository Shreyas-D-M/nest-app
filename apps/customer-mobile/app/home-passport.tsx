import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Text } from '@nest/ui';
import { useQuery } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import { listHomeAssets, listHomes } from '@/lib/api';
import { useAddress } from '@/lib/address-context';
import { EmptyState, Header, LoadingSkeleton } from '@/components';
import { colors, radius, shadows, spacing } from '@/theme/colors';

export default function HomePassportScreen(): ReactElement {
  const insets = useSafeAreaInsets();
  const { selectedAddress } = useAddress();
  const {
    data: homes,
    isLoading: homesLoading,
    error: homesError,
    refetch: refetchHomes,
  } = useQuery({ queryKey: ['homes'], queryFn: listHomes });

  const homeId = homes?.[0]?.id;
  const {
    data: assets,
    isLoading: assetsLoading,
    error: assetsError,
    refetch: refetchAssets,
  } = useQuery({
    queryKey: ['home-assets', homeId],
    enabled: !!homeId,
    queryFn: () => listHomeAssets(homeId!),
  });

  const isLoading = homesLoading || assetsLoading;
  const isError = homesError || assetsError;
  const homeLocation = selectedAddress
    ? `${selectedAddress.locality} · ${selectedAddress.city}`
    : 'Doorstep Residence';

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
          caption="Home Passport"
          title="Maintenance History"
          subtitle="Keep appliance service records, warranties, and repair history organized in one digital log."
        />

        {/* Home Summary Card */}
        {homes && homes.length > 0 ? (
          <View style={styles.homeCard}>
            <View style={styles.homeIconCircle}>
              <Ionicons name="home" size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="bodyStrong" style={{ fontSize: 15 }}>
                {homes[0]?.name ?? 'Primary Residence'}
              </Text>
              <Text variant="caption" color="secondary" style={{ marginTop: 2 }}>
                {homeLocation}
              </Text>
            </View>
            <View style={styles.assetCountBadge}>
              <Text style={styles.assetCountText}>
                {assets?.length ?? 0} Assets
              </Text>
            </View>
          </View>
        ) : null}

        {/* Loading State */}
        {isLoading && <LoadingSkeleton height={90} count={3} />}

        {/* Error State */}
        {isError && !isLoading && (
          <EmptyState
            icon="alert-circle-outline"
            title="Unable to load records"
            subtitle="Please check your connection and try again."
            actionLabel="Retry"
            onAction={() => {
              void refetchHomes();
              void refetchAssets();
            }}
          />
        )}

        {/* Empty State */}
        {!isLoading && !isError && (!assets || assets.length === 0) && (
          <EmptyState
            icon="document-text-outline"
            title="No appliances registered yet"
            subtitle="When you complete a service with NEST, appliance warranties and service records are automatically added here."
            actionLabel="Book a Service →"
            onAction={() => router.push('/')}
          />
        )}

        {/* Assets List */}
        {!isLoading && !isError && (assets ?? []).length > 0 ? (
          <View style={styles.list}>
            {(assets ?? []).map((item) => {
              const hasWarranty = Boolean(item.warrantyEnd);
              const isWarrantyActive =
                hasWarranty && new Date(item.warrantyEnd!).getTime() > Date.now();

              return (
                <View key={item.id} style={styles.assetCard}>
                  <View style={styles.assetHeader}>
                    <View style={styles.assetIconCircle}>
                      <Ionicons name="construct" size={18} color={colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text variant="bodyStrong" style={styles.assetName}>
                        {item.brand ?? item.assetType}
                      </Text>
                      <Text variant="caption" color="secondary" style={{ marginTop: 1 }}>
                        {item.model ?? 'General household appliance'}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.warrantyBadge,
                        isWarrantyActive ? styles.warrantyActive : styles.warrantyExpired,
                      ]}
                    >
                      <Text
                        style={[
                          styles.warrantyText,
                          isWarrantyActive ? styles.warrantyTextActive : styles.warrantyTextExpired,
                        ]}
                      >
                        {isWarrantyActive ? 'WARRANTY ACTIVE' : 'OUT OF WARRANTY'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.divider} />

                  <View style={styles.assetFooter}>
                    <Text variant="caption" color="secondary">
                      {item.warrantyEnd
                        ? `Valid until ${new Date(item.warrantyEnd).toLocaleDateString(undefined, {
                            month: 'short',
                            year: 'numeric',
                          })}`
                        : 'Standard 30-Day NEST Service Protection'}
                    </Text>
                    <Pressable
                      onPress={() =>
                        router.push({
                          pathname: '/create',
                          params: { issue: `Service requested for ${item.brand ?? item.assetType}` },
                        })
                      }
                      hitSlop={8}
                    >
                      <Text variant="caption" style={styles.serviceLink}>
                        Book Service →
                      </Text>
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </View>
        ) : null}

        <Button
          label="+ Add New Asset Record"
          variant="secondary"
          onPress={() =>
            Alert.alert(
              'Add Appliance',
              'To register an appliance, simply complete a service booking or enter serial number details during technician inspection.',
            )
          }
        />
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
  homeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  homeIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  assetCountBadge: {
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  assetCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  list: {
    gap: spacing.md,
  },
  assetCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
    gap: spacing.sm,
  },
  assetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  assetIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  assetName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  warrantyBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  warrantyActive: {
    backgroundColor: colors.successLight,
  },
  warrantyExpired: {
    backgroundColor: colors.surfaceMuted,
  },
  warrantyText: {
    fontSize: 9,
    fontWeight: '700',
  },
  warrantyTextActive: {
    color: colors.successText,
  },
  warrantyTextExpired: {
    color: colors.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
  },
  assetFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  serviceLink: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
});
