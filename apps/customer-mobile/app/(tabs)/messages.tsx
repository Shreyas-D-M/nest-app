import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@nest/ui';
import type { ReactElement } from 'react';
import { colors, radius, spacing } from '@/theme/colors';

const CONVERSATIONS = [
  {
    id: '1',
    sender: 'Ramesh Kumar',
    role: 'AC Specialist',
    preview: 'I have reached your doorstep address. Please confirm if someone is home.',
    time: '4m ago',
    unread: true,
    initial: 'R',
    avatarBg: colors.primary,
  },
  {
    id: '2',
    sender: 'NEST Customer Care',
    role: '24/7 Support',
    preview: 'Your plumbing ticket #8942 has been resolved. Let us know how it went!',
    time: '2h ago',
    unread: false,
    initial: 'N',
    avatarBg: '#059669',
  },
  {
    id: '3',
    sender: 'Home Passport',
    role: 'Appliance Records',
    preview: 'Your AC warranty certificate has been generated and added to your passport.',
    time: 'Yesterday',
    unread: false,
    initial: 'H',
    avatarBg: '#D97706',
  },
];

export default function MessagesScreen(): ReactElement {
  const insets = useSafeAreaInsets();

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
            CHAT & CONVERSATIONS
          </Text>
          <Text variant="h1" style={styles.title}>
            Messages
          </Text>
          <Text variant="secondary" style={styles.subtitle}>
            Direct communication with your assigned specialists and support.
          </Text>
        </View>

        {/* Message Cards List */}
        <View style={styles.list}>
          {CONVERSATIONS.map((item) => (
            <Pressable
              key={item.id}
              style={[styles.card, item.unread && styles.cardUnread]}
              onPress={() => router.push('/support')}
              accessibilityRole="button"
              accessibilityLabel={`Conversation with ${item.sender}`}
            >
              <View style={[styles.avatarCircle, { backgroundColor: item.avatarBg }]}>
                <Text variant="bodyStrong" color="inverse" style={{ fontSize: 16 }}>
                  {item.initial}
                </Text>
              </View>

              <View style={{ flex: 1 }}>
                <View style={styles.nameRow}>
                  <Text variant="bodyStrong" style={styles.senderName}>
                    {item.sender}
                  </Text>
                  <Text variant="caption" color="secondary">
                    {item.time}
                  </Text>
                </View>
                <Text variant="caption" color="secondary" style={{ marginTop: 1 }}>
                  {item.role}
                </Text>
                <Text
                  variant="secondary"
                  style={[styles.previewText, item.unread && styles.previewTextUnread]}
                  numberOfLines={2}
                >
                  {item.preview}
                </Text>
              </View>

              {item.unread ? <View style={styles.unreadDot} /> : null}
            </Pressable>
          ))}
        </View>

        {/* Help Banner */}
        <Pressable
          style={styles.helpBanner}
          onPress={() => router.push('/support')}
        >
          <Ionicons name="chatbubbles-outline" size={20} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text variant="bodyStrong" style={{ color: colors.text }}>
              Need urgent help?
            </Text>
            <Text variant="caption" color="secondary">
              Connect with our live 24/7 customer care team
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.primary} />
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
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  list: {
    gap: spacing.sm,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  cardUnread: {
    borderColor: colors.primaryBorder,
    backgroundColor: colors.surfaceSubtle,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  senderName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  previewText: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
    marginTop: 4,
  },
  previewTextUnread: {
    color: colors.text,
    fontWeight: '500',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  helpBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.primaryLight,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    marginTop: spacing.xs,
  },
});
