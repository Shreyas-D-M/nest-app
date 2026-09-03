import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@nest/ui';
import type { ReactElement } from 'react';
import { useAuth } from '@/lib/auth-context';
import { colors, radius, spacing } from '@/theme/colors';

export default function ProfileScreen(): ReactElement {
  const insets = useSafeAreaInsets();
  const { session, signOut } = useAuth();
  const displayName = session?.user.name ?? 'Customer';
  const displayPhone = session?.user.phone ?? '+91 ••••• •••••';
  const avatarInitial = displayName.slice(0, 1).toUpperCase();

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
          { paddingBottom: 72 + insets.bottom + 40 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header */}
        <View style={styles.header}>
          <Text variant="caption" style={styles.topCaption}>
            ACCOUNT
          </Text>
          <Text variant="h1" style={styles.title}>
            Profile & Settings
          </Text>
        </View>

        {/* User Card */}
        <View style={styles.userCard}>
          <View style={styles.avatarCircle}>
            <Text variant="h1" color="inverse" style={{ fontSize: 24 }}>
              {avatarInitial}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text variant="bodyStrong" style={styles.userName}>
                {displayName}
              </Text>
              <View style={styles.verifiedBadge}>
                <Ionicons name="shield-checkmark" size={12} color={colors.success} />
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
            </View>
            <Text variant="caption" color="secondary" style={{ marginTop: 2 }}>
              {displayPhone}
            </Text>
          </View>
        </View>

        {/* Section: Your Activity */}
        <View style={styles.section}>
          <Text variant="caption" style={styles.sectionLabel}>
            YOUR ACTIVITY
          </Text>
          <View style={styles.settingsGroup}>
            <Pressable
              style={styles.settingsItem}
              onPress={() => router.push('/bookings')}
              accessibilityRole="button"
              accessibilityLabel="My Bookings"
            >
              <View style={[styles.itemIconCircle, { backgroundColor: colors.primaryLight }]}>
                <Ionicons name="calendar-outline" size={18} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="bodyStrong">My Bookings</Text>
                <Text variant="caption" color="secondary">
                  Active & past appointments
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </Pressable>

            <View style={styles.divider} />

            <Pressable
              style={styles.settingsItem}
              onPress={() => router.push('/home-passport')}
              accessibilityRole="button"
              accessibilityLabel="Home Passport"
            >
              <View style={[styles.itemIconCircle, { backgroundColor: colors.warningLight }]}>
                <Ionicons name="home-outline" size={18} color={colors.warning} />
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="bodyStrong">Home Passport</Text>
                <Text variant="caption" color="secondary">
                  Property maintenance history
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </Pressable>
          </View>
        </View>

        {/* Section: Account Settings */}
        <View style={styles.section}>
          <Text variant="caption" style={styles.sectionLabel}>
            ACCOUNT
          </Text>
          <View style={styles.settingsGroup}>
            <Pressable
              style={styles.settingsItem}
              onPress={() => router.push('/addresses')}
              accessibilityRole="button"
              accessibilityLabel="Saved Addresses"
            >
              <View style={[styles.itemIconCircle, { backgroundColor: '#F3E8FF' }]}>
                <Ionicons name="location-outline" size={18} color="#7C3AED" />
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="bodyStrong">Saved Addresses</Text>
                <Text variant="caption" color="secondary">
                  Home, office, and service locations
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </Pressable>

            <View style={styles.divider} />

            <Pressable
              style={styles.settingsItem}
              onPress={() => router.push('/notifications')}
              accessibilityRole="button"
              accessibilityLabel="Notifications"
            >
              <View style={[styles.itemIconCircle, { backgroundColor: '#FFEDD5' }]}>
                <Ionicons name="notifications-outline" size={18} color="#EA580C" />
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="bodyStrong">Notifications</Text>
                <Text variant="caption" color="secondary">
                  Booking alerts & reminders
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </Pressable>
          </View>
        </View>

        {/* Section: Support */}
        <View style={styles.section}>
          <Text variant="caption" style={styles.sectionLabel}>
            SUPPORT
          </Text>
          <View style={styles.settingsGroup}>
            <Pressable
              style={styles.settingsItem}
              onPress={() => router.push('/support')}
              accessibilityRole="button"
              accessibilityLabel="Help & Support"
            >
              <View style={[styles.itemIconCircle, { backgroundColor: '#E0F2FE' }]}>
                <Ionicons name="help-circle-outline" size={18} color="#0284C7" />
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="bodyStrong">Help & Support</Text>
                <Text variant="caption" color="secondary">
                  24/7 Helpline, FAQs & Tickets
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </Pressable>

            <View style={styles.divider} />

            <Pressable
              style={styles.settingsItem}
              onPress={() => router.push('/messages')}
              accessibilityRole="button"
              accessibilityLabel="Messages"
            >
              <View style={[styles.itemIconCircle, { backgroundColor: '#DBEAFE' }]}>
                <Ionicons name="chatbubble-outline" size={18} color="#2563EB" />
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="bodyStrong">Messages</Text>
                <Text variant="caption" color="secondary">
                  Chats with assigned specialists
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </Pressable>
          </View>
        </View>

        {/* Section: Other */}
        <View style={styles.section}>
          <Text variant="caption" style={styles.sectionLabel}>
            OTHER
          </Text>
          <View style={styles.settingsGroup}>
            <Pressable
              style={styles.settingsItem}
              onPress={() => router.push('/about')}
              accessibilityRole="button"
              accessibilityLabel="About NEST"
            >
              <View style={[styles.itemIconCircle, { backgroundColor: colors.surfaceMuted }]}>
                <Ionicons name="information-circle-outline" size={18} color={colors.textSecondary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="bodyStrong">About NEST</Text>
                <Text variant="caption" color="secondary">
                  Version 1.0.0 · Belagavi Marketplace
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </Pressable>
          </View>
        </View>

        {/* Sign Out Card */}
        <Pressable
          style={styles.signOutBtn}
          onPress={handleSignOut}
          accessibilityRole="button"
          accessibilityLabel="Log out of account"
        >
          <Ionicons name="log-out-outline" size={18} color={colors.danger} />
          <Text variant="bodyStrong" style={{ color: colors.danger }}>
            Log out of NEST
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
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userName: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.successLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.successText,
  },
  section: {
    gap: spacing.xs,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  settingsGroup: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
  },
  itemIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
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
