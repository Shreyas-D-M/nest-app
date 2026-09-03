import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@nest/ui';
import type { ReactElement } from 'react';
import { colors, radius, spacing } from '../theme/colors';

export interface SubServiceItem {
  id: string;
  name: string;
  basePriceMinor?: number | null;
}

export interface CategoryCardProps {
  id: string;
  name: string;
  iconName?: keyof typeof Ionicons.glyphMap;
  services: SubServiceItem[];
  onRequestCategory: () => void;
  onSelectService: (serviceName: string) => void;
}

export function CategoryCard({
  name,
  iconName = 'construct-outline',
  services,
  onRequestCategory,
  onSelectService,
}: CategoryCardProps): ReactElement {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconCircle}>
          <Ionicons name={iconName} size={20} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text variant="bodyStrong" style={styles.categoryName}>
            {name}
          </Text>
          <Text variant="caption" color="secondary">
            {services.length} services available
          </Text>
        </View>
        <Pressable
          style={styles.requestBtn}
          onPress={onRequestCategory}
          accessibilityRole="button"
          accessibilityLabel={`Request ${name}`}
        >
          <Text variant="caption" style={styles.requestBtnText}>
            Request →
          </Text>
        </Pressable>
      </View>

      <View style={styles.subServicesGrid}>
        {services.map((service) => (
          <Pressable
            key={service.id}
            onPress={() => onSelectService(service.name)}
            style={styles.serviceChip}
            accessibilityRole="button"
            accessibilityLabel={`Service: ${service.name}`}
          >
            <Text variant="secondary" style={styles.serviceChipText}>
              {service.name}
            </Text>
            {service.basePriceMinor != null ? (
              <Text variant="caption" style={styles.priceText}>
                ₹{(service.basePriceMinor / 100).toFixed(0)}
              </Text>
            ) : null}
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
    gap: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  requestBtn: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.sm,
  },
  requestBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  subServicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  serviceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.sm,
  },
  serviceChipText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.text,
  },
  priceText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primaryDark,
  },
});
