import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState, type ReactElement } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@nest/ui';
import { Header } from '@/components';
import { colors, radius, shadows, spacing } from '@/theme/colors';

export default function SettingsScreen(): ReactElement {
  const insets = useSafeAreaInsets();
  const [bookingAlerts, setBookingAlerts] = useState(true);
  const [whatsappUpdates, setWhatsappUpdates] = useState(true);
  const [locationServices, setLocationServices] = useState(true);

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
          caption="Preferences"
          title="App Settings"
          subtitle="Configure notification alerts, location preferences, and account privacy."
        />

        {/* Notifications Group */}
        <View style={styles.section}>
          <Text variant="caption" style={styles.sectionLabel}>
            NOTIFICATIONS & UPDATES
          </Text>

          <View style={styles.card}>
            <View style={styles.settingRow}>
              <View style={[styles.iconCircle, { backgroundColor: colors.primaryLight }]}>
                <Ionicons name="notifications-outline" size={18} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="bodyStrong">Booking Alerts & ETA</Text>
                <Text variant="caption" color="secondary">
                  Real-time push alerts when technician is en route
                </Text>
              </View>
              <Switch
                value={bookingAlerts}
                onValueChange={setBookingAlerts}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.settingRow}>
              <View style={[styles.iconCircle, { backgroundColor: colors.successLight }]}>
                <Ionicons name="logo-whatsapp" size={18} color={colors.successText} />
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="bodyStrong">WhatsApp Updates</Text>
                <Text variant="caption" color="secondary">
                  Receipts and booking confirmations via WhatsApp
                </Text>
              </View>
              <Switch
                value={whatsappUpdates}
                onValueChange={setWhatsappUpdates}
                trackColor={{ false: colors.border, true: colors.success }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>
        </View>

        {/* Privacy & Location */}
        <View style={styles.section}>
          <Text variant="caption" style={styles.sectionLabel}>
            PRIVACY & DATA
          </Text>

          <View style={styles.card}>
            <View style={styles.settingRow}>
              <View style={[styles.iconCircle, { backgroundColor: '#F3E8FF' }]}>
                <Ionicons name="location-outline" size={18} color="#7C3AED" />
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="bodyStrong">Automatic GPS Location</Text>
                <Text variant="caption" color="secondary">
                  Use device GPS to suggest nearest service address
                </Text>
              </View>
              <Switch
                value={locationServices}
                onValueChange={setLocationServices}
                trackColor={{ false: colors.border, true: '#7C3AED' }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={styles.divider} />

            <Pressable
              style={styles.navRow}
              onPress={() => router.push('/addresses')}
              accessibilityRole="button"
              accessibilityLabel="Manage Saved Addresses"
            >
              <View style={[styles.iconCircle, { backgroundColor: colors.surfaceMuted }]}>
                <Ionicons name="map-outline" size={18} color={colors.textSecondary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="bodyStrong">Manage Saved Addresses</Text>
                <Text variant="caption" color="secondary">
                  Add, edit, or remove service locations
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </Pressable>
          </View>
        </View>

        {/* Quick Links */}
        <View style={styles.section}>
          <Text variant="caption" style={styles.sectionLabel}>
            SUPPORT & INFO
          </Text>

          <View style={styles.card}>
            <Pressable
              style={styles.navRow}
              onPress={() => router.push('/support')}
              accessibilityRole="button"
              accessibilityLabel="Customer Support & Help Center"
            >
              <View style={[styles.iconCircle, { backgroundColor: '#E0F2FE' }]}>
                <Ionicons name="help-circle-outline" size={18} color="#0284C7" />
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="bodyStrong">Help Center & Support</Text>
                <Text variant="caption" color="secondary">
                  24/7 Helpline, FAQs & Tickets
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </Pressable>

            <View style={styles.divider} />

            <Pressable
              style={styles.navRow}
              onPress={() => router.push('/about')}
              accessibilityRole="button"
              accessibilityLabel="About NEST Platform"
            >
              <View style={[styles.iconCircle, { backgroundColor: colors.surfaceMuted }]}>
                <Ionicons name="information-circle-outline" size={18} color={colors.textSecondary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="bodyStrong">About NEST Platform</Text>
                <Text variant="caption" color="secondary">
                  Version 1.0.0 · Terms & Privacy
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </Pressable>
          </View>
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
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
  },
  navRow: {
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
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginLeft: 56,
  },
});
