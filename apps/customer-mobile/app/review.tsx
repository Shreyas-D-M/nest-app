import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState, type ReactElement } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Text } from '@nest/ui';
import { Header } from '@/components';
import { colors, radius, shadows, spacing } from '@/theme/colors';

const TAGS = [
  'On-Time Arrival',
  'Polite Behaviour',
  'Clean & Tidy Work',
  'Transparent Pricing',
  'Expert Knowledge',
  'Quick Resolution',
];

const RATING_LABELS: Record<number, string> = {
  1: 'Needs Improvement',
  2: 'Fair Experience',
  3: 'Good Service',
  4: 'Very Good!',
  5: 'Exceptional & Highly Recommended!',
};

export default function ReviewScreen(): ReactElement {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ service?: string; professionalName?: string }>();

  const serviceName = params.service ?? 'AC Inspection & Service';
  const proName = params.professionalName ?? 'Ramesh Kumar';

  const [rating, setRating] = useState<number>(5);
  const [selectedTags, setSelectedTags] = useState<string[]>(['On-Time Arrival', 'Clean & Tidy Work']);
  const [feedback, setFeedback] = useState<string>('');

  const toggleTag = (tag: string): void => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const handleSubmit = (): void => {
    Alert.alert(
      'Review Submitted!',
      'Thank you for your feedback! Your rating helps maintain high service quality across the NEST community.',
      [{ text: 'Back to Home', onPress: () => router.replace('/') }],
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 48 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
            <Header
              caption="Customer Feedback"
              title="Rate Your Experience"
              subtitle="How was your service with your assigned specialist?"
            />

            {/* Specialist Summary Card */}
            <View style={styles.proCard}>
              <View style={styles.avatarCircle}>
                <Text variant="h2" color="inverse" style={{ fontSize: 18 }}>
                  {proName.slice(0, 1).toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text variant="bodyStrong" style={{ fontSize: 16 }}>
                    {proName}
                  </Text>
                  <Ionicons name="shield-checkmark" size={14} color={colors.success} />
                </View>
                <Text variant="caption" color="secondary" style={{ marginTop: 2 }}>
                  {serviceName}
                </Text>
              </View>
            </View>

            {/* Interactive Star Rating Card */}
            <View style={styles.card}>
              <Text variant="caption" style={styles.cardSectionLabel}>
                SELECT RATING
              </Text>

              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Pressable
                    key={star}
                    onPress={() => setRating(star)}
                    hitSlop={8}
                    style={styles.starButton}
                    accessibilityRole="button"
                    accessibilityLabel={`Rate ${star} star${star > 1 ? 's' : ''}`}
                  >
                    <Ionicons
                      name={star <= rating ? 'star' : 'star-outline'}
                      size={36}
                      color={colors.warning}
                    />
                  </Pressable>
                ))}
              </View>

              <Text variant="bodyStrong" style={styles.ratingSentiment}>
                {RATING_LABELS[rating]}
              </Text>
            </View>

            {/* Quick Feedback Tags */}
            <View style={styles.card}>
              <Text variant="caption" style={styles.cardSectionLabel}>
                WHAT WENT WELL?
              </Text>

              <View style={styles.tagsGrid}>
                {TAGS.map((tag) => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <Pressable
                      key={tag}
                      onPress={() => toggleTag(tag)}
                      style={[styles.tagPill, isSelected && styles.tagPillSelected]}
                      accessibilityRole="button"
                      accessibilityLabel={`Tag: ${tag}`}
                    >
                      <Ionicons
                        name={isSelected ? 'checkmark' : 'add'}
                        size={14}
                        color={isSelected ? colors.primaryDark : colors.textSecondary}
                      />
                      <Text
                        variant="caption"
                        style={[styles.tagText, isSelected && styles.tagTextSelected]}
                      >
                        {tag}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Detailed Feedback Text Input */}
            <View style={styles.card}>
              <Text variant="caption" style={styles.cardSectionLabel}>
                WRITE A REVIEW (OPTIONAL)
              </Text>

              <TextInput
                value={feedback}
                onChangeText={setFeedback}
                placeholder="Share more details about technician punctuality, work quality, or overall service..."
                placeholderTextColor={colors.textMuted}
                multiline
                maxLength={400}
                style={styles.feedbackInput}
              />
            </View>

            {/* Actions */}
            <View style={styles.actionWrap}>
              <Button label="Submit Review →" onPress={handleSubmit} />

              <Pressable
                style={styles.skipBtn}
                onPress={() => router.replace('/')}
                accessibilityRole="button"
                accessibilityLabel="Skip for now"
              >
                <Text variant="bodyStrong" color="secondary">
                  Skip for now
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
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
  proCard: {
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
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
    gap: spacing.md,
  },
  cardSectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    color: colors.textSecondary,
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xs,
  },
  starButton: {
    padding: 4,
  },
  ratingSentiment: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  tagsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  tagPillSelected: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primaryBorder,
  },
  tagText: {
    fontSize: 12,
    color: colors.text,
  },
  tagTextSelected: {
    color: colors.primaryDark,
    fontWeight: '700',
  },
  feedbackInput: {
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: 14,
    lineHeight: 20,
    color: colors.text,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  actionWrap: {
    gap: 10,
    marginTop: spacing.xs,
  },
  skipBtn: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
