import { Ionicons } from '@expo/vector-icons';
import { type Href, router } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@nest/ui';
import type { ReactElement } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Header } from '@/components';
import { colors, radius, shadows, spacing } from '@/theme/colors';

type MenuItem = {
  label: string;
  route?: Href;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBg: string;
  description?: string;
};

type MenuGroup = {
  title: string;
  items: MenuItem[];
};

const MENU_GROUPS: MenuGroup[] = [
  {
    title: 'Account & Services',
    items: [
      {
        label: 'My Profile',
        route: '/profile',
        icon: 'person-outline',
        iconColor: colors.primary,
        iconBg: colors.primaryLight,
        description: 'Manage personal details and phone',
      },
      {
        label: 'Saved Addresses',
        route: '/addresses',
        icon: 'location-outline',
        iconColor: '#059669',
        iconBg: colors.successLight,
        description: 'Home, office, and service locations',
      },
      {
        label: 'Home Passport',
        route: '/home-passport',
        icon: 'home-outline',
        iconColor: colors.warning,
        iconBg: colors.warningLight,
        description: 'Asset records and maintenance log',
      },
      {
        label: 'Favorites & Specialists',
        route: '/favorites',
        icon: 'heart-outline',
        iconColor: colors.danger,
        iconBg: colors.dangerLight,
        description: 'Preferred specialists and saved services',
      },
    ],
  },
  {
    title: 'Orders & Payments',
    items: [
      {
        label: 'My Bookings',
        route: '/bookings',
        icon: 'calendar-outline',
        iconColor: colors.primary,
        iconBg: colors.primaryLight,
        description: 'Active and past appointments',
      },
      {
        label: 'Payment Methods',
        route: '/payment',
        icon: 'card-outline',
        iconColor: '#7C3AED',
        iconBg: '#F3E8FF',
        description: 'UPI, cards, and payment options',
      },
      {
        label: 'Notifications',
        route: '/notifications',
        icon: 'notifications-outline',
        iconColor: '#D97706',
        iconBg: '#FEF3C7',
        description: 'Booking alerts and reminders',
      },
    ],
  },
  {
    title: 'Support & More',
    items: [
      {
        label: 'Help & Customer Support',
        route: '/support',
        icon: 'help-circle-outline',
        iconColor: '#0284C7',
        iconBg: '#E0F2FE',
        description: 'FAQs, contact support, live assistance',
      },
      {
        label: 'Settings',
        route: '/settings',
        icon: 'settings-outline',
        iconColor: colors.textSecondary,
        iconBg: colors.surfaceMuted,
        description: 'Preferences and permissions',
      },
      {
        label: 'About NEST Platform',
        route: '/about',
        icon: 'information-circle-outline',
        iconColor: colors.textSecondary,
        iconBg: colors.surfaceMuted,
        description: 'Version, terms, and privacy policy',
      },
    ],
  },
];

export default function MenuScreen(): ReactElement {
  const insets = useSafeAreaInsets();
  const { signOut } = useAuth();

  const handleSignOut = (): void => {
    Alert.alert('Sign Out', 'Are you sure you want to log out of your NEST account?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/sign-in');
        },
      },
    ]);
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
          caption="NEST Explorer"
          title="App Menu"
          subtitle="Explore all platform features, saved locations, and account settings."
        />

        {/* Menu Groups */}
        {MENU_GROUPS.map((group) => (
          <View key={group.title} style={styles.groupWrap}>
            <Text variant="caption" style={styles.groupTitle}>
              {group.title.toUpperCase()}
            </Text>
            <View style={styles.cardGroup}>
              {group.items.map((item, idx) => {
                const isLast = idx === group.items.length - 1;
                return (
                  <View key={item.label}>
                    <Pressable
                      style={styles.menuRow}
                      onPress={() => {
                        if (item.route) {
                          router.push(item.route);
                        }
                      }}
                      accessibilityRole="button"
                      accessibilityLabel={item.label}
                    >
                      <View style={[styles.iconCircle, { backgroundColor: item.iconBg }]}>
                        <Ionicons name={item.icon} size={18} color={item.iconColor} />
                      </View>

                      <View style={{ flex: 1 }}>
                        <Text variant="bodyStrong" style={styles.itemLabel}>
                          {item.label}
                        </Text>
                        {item.description ? (
                          <Text variant="caption" color="secondary" style={{ marginTop: 1 }}>
                            {item.description}
                          </Text>
                        ) : null}
                      </View>

                      <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                    </Pressable>
                    {!isLast ? <View style={styles.divider} /> : null}
                  </View>
                );
              })}
            </View>
          </View>
        ))}

        {/* Sign Out CTA */}
        <Pressable
          style={styles.signOutBtn}
          onPress={handleSignOut}
          accessibilityRole="button"
          accessibilityLabel="Log Out"
        >
          <Ionicons name="log-out-outline" size={18} color={colors.danger} />
          <Text variant="bodyStrong" style={{ color: colors.danger }}>
            Sign Out of NEST
          </Text>
        </Pressable>
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
  groupWrap: {
    gap: spacing.xs,
  },
  groupTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  cardGroup: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadows.sm,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginLeft: 56,
  },
  signOutBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.dangerLight,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
    paddingVertical: 14,
    borderRadius: radius.md,
    marginTop: spacing.xs,
  },
});
