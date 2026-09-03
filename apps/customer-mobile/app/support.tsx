import { Ionicons } from '@expo/vector-icons';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Text } from '@nest/ui';
import { useQuery } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import { listSupportTickets } from '@/lib/api';
import { Header } from '@/components';
import { colors, radius, shadows, spacing } from '@/theme/colors';

const FAQS = [
  {
    q: 'How does the 30-Day Service Guarantee work?',
    a: 'If any issue persists after a completed service, we send a technician for a free re-inspection within 30 days.',
  },
  {
    q: 'How are prices calculated?',
    a: 'Every service has upfront transparent pricing. Extra spare parts are quoted on-site and require your explicit approval before installation.',
  },
  {
    q: 'Can I reschedule or cancel my booking?',
    a: 'Yes, you can reschedule or cancel any appointment anytime before the specialist departs for your home.',
  },
];

export default function SupportScreen(): ReactElement {
  const insets = useSafeAreaInsets();
  const { data, isLoading, error } = useQuery({
    queryKey: ['support-tickets'],
    queryFn: listSupportTickets,
  });

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
          caption="Customer Care"
          title="Help & Support"
          subtitle="24/7 Helpline, frequently asked questions, and ticket status."
        />

        {/* Contact Channels Grid */}
        <View style={styles.channelsGrid}>
          <Pressable
            style={styles.channelCard}
            onPress={() =>
              Alert.alert('Calling Support', 'Connecting you with NEST Helpline (1800-123-NEST)...')
            }
          >
            <View style={[styles.channelIconCircle, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="call" size={22} color={colors.primary} />
            </View>
            <Text variant="bodyStrong" style={styles.channelTitle}>
              Call Helpline
            </Text>
            <Text variant="caption" color="secondary">
              Toll-free 24/7
            </Text>
          </Pressable>

          <Pressable
            style={styles.channelCard}
            onPress={() =>
              Alert.alert('Live Assistance', 'A NEST support agent is connecting with you now.')
            }
          >
            <View style={[styles.channelIconCircle, { backgroundColor: colors.successLight }]}>
              <Ionicons name="chatbubbles" size={22} color={colors.successText} />
            </View>
            <Text variant="bodyStrong" style={styles.channelTitle}>
              Live Chat
            </Text>
            <Text variant="caption" color="secondary">
              Instant reply
            </Text>
          </Pressable>
        </View>

        {/* FAQs */}
        <View style={styles.section}>
          <Text variant="h2" style={styles.sectionTitle}>
            Frequently Asked Questions
          </Text>
          <View style={{ gap: spacing.sm }}>
            {FAQS.map((faq, i) => (
              <View key={i} style={styles.faqCard}>
                <Text variant="bodyStrong" style={{ color: colors.text }}>
                  {faq.q}
                </Text>
                <Text variant="secondary" color="secondary" style={{ marginTop: 4, lineHeight: 18 }}>
                  {faq.a}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Recent Support Tickets */}
        <View style={styles.section}>
          <Text variant="h2" style={styles.sectionTitle}>
            Your Support Tickets
          </Text>

          <View style={styles.ticketsCard}>
            {isLoading && (
              <Text variant="secondary" color="secondary">
                Loading support tickets…
              </Text>
            )}
            {error && (
              <Text variant="secondary" color="secondary">
                Unable to load tickets right now.
              </Text>
            )}
            {!isLoading && !error && (data?.data ?? []).length === 0 && (
              <Text variant="secondary" color="secondary">
                No active support tickets. We're here whenever you need assistance!
              </Text>
            )}
            {(data?.data ?? []).map((ticket) => (
              <View key={ticket.id} style={styles.ticketItem}>
                <Text variant="bodyStrong">{ticket.subject}</Text>
                <Text variant="caption" color="secondary" style={{ marginTop: 2 }}>
                  Status: {ticket.status} · Priority: {ticket.priority}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Raise Ticket CTA */}
        <View style={styles.actionWrap}>
          <Button
            label="Raise a new support ticket"
            onPress={() =>
              Alert.alert(
                'Ticket Created',
                'Your support ticket has been submitted. Our team will contact you within 15 minutes.',
              )
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
  channelsGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  channelCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
    gap: 4,
  },
  channelIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  channelTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  section: {
    gap: spacing.xs,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  faqCard: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  ticketsCard: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
    gap: 8,
  },
  ticketItem: {
    paddingVertical: 4,
  },
  actionWrap: {
    marginTop: spacing.xs,
  },
});
