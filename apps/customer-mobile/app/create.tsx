import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState, type ReactElement } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@nest/ui';
import {
  ApiRequestError,
  createServiceRequest,
  uploadServiceRequestAttachment,
} from '@/lib/api';
import { useAddress } from '@/lib/address-context';
import { useVoiceTranscription } from '@/lib/use-voice-transcription';
import { PhotoAttachmentGrid, StatusStepper, VoiceRecorder } from '@/components';
import { colors, radius, spacing } from '@/theme/colors';

const CATEGORY_PRESETS: Record<
  string,
  { icon: keyof typeof Ionicons.glyphMap; title: string; suggestions: string[] }
> = {
  'AC Repair': {
    icon: 'snow-outline',
    title: 'AC Repair & Service',
    suggestions: [
      'Not cooling properly',
      'Water leaking from unit',
      'Making loud rattling noise',
      'Turns off automatically',
      'Coil & filter cleaning needed',
    ],
  },
  'Plumbing': {
    icon: 'water-outline',
    title: 'Plumbing & Pipe Repair',
    suggestions: [
      'Tap is leaking',
      'Low water pressure',
      'Drain pipe clogged',
      'Toilet flush broken',
      'Pipe leakage behind wall',
    ],
  },
  'Electrical': {
    icon: 'flash-outline',
    title: 'Electrical & Wiring',
    suggestions: [
      'Switchboard sparking / broken',
      'Ceiling fan running slow',
      'Circuit breaker tripping',
      'New light fixture installation',
      'Power socket burnt or loose',
    ],
  },
  'Cleaning': {
    icon: 'sparkles-outline',
    title: 'Home & Deep Cleaning',
    suggestions: [
      'Bathroom deep cleaning',
      'Kitchen chimney grease removal',
      'Complete home deep clean',
      'Sofa & upholstery shampooing',
      'Balcony & window cleaning',
    ],
  },
  'Appliance Repair': {
    icon: 'construct-outline',
    title: 'Appliance Repair',
    suggestions: [
      'Washing machine not spinning',
      'Refrigerator not cooling',
      'Microwave oven not heating',
      'Water purifier filter choked',
      'Geyser not heating water',
    ],
  },
  'Painting': {
    icon: 'color-palette-outline',
    title: 'Painting & Waterproofing',
    suggestions: [
      'Wall paint peeling / dampness',
      'Single room repainting',
      'Balcony ceiling waterproofing',
      'Full house interior painting',
    ],
  },
  'General Handyman': {
    icon: 'hammer-outline',
    title: 'Handyman & Carpentry',
    suggestions: [
      'Door lock / latch jammed',
      'Cabinet hinge loose',
      'Curtain rod / shelf mounting',
      'Furniture assembly required',
    ],
  },
};

const TIMING_OPTIONS = [
  { id: 'asap', label: 'ASAP / Today' },
  { id: 'tomorrow', label: 'Tomorrow' },
  { id: 'weekend', label: 'This weekend' },
  { id: 'flexible', label: 'Flexible' },
];

const STEPS = [
  { id: '1', title: 'Problem', icon: 'document-text-outline' as const },
  { id: '2', title: 'Diagnosis', icon: 'sparkles-outline' as const },
  { id: '3', title: 'Specialists', icon: 'people-outline' as const },
];

export default function CreateRequestScreen(): ReactElement {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ category?: string; service?: string; issue?: string }>();
  const { selectedAddress } = useAddress();

  const [selectedCategory, setSelectedCategory] = useState<string>(() => {
    if (params.category && CATEGORY_PRESETS[params.category]) {
      return params.category;
    }
    return 'AC Repair';
  });

  const [issueText, setIssueText] = useState<string>(params.issue ?? '');
  const [selectedImageUris, setSelectedImageUris] = useState<string[]>([]);
  const [selectedTiming, setSelectedTiming] = useState<string>('asap');
  const [isEmergency, setIsEmergency] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const { voiceStatus, voiceUiState, isRecording, toggleVoice, stopListening } =
    useVoiceTranscription({
      onTranscript: (transcript) => {
        setIssueText((current) => {
          const trimmed = current.trim();
          return trimmed ? `${trimmed} ${transcript}` : transcript;
        });
      },
      onError: (title, message) => Alert.alert(title, message),
    });

  const currentPreset = CATEGORY_PRESETS[selectedCategory] ?? CATEGORY_PRESETS['AC Repair']!;

  const handleAddPhoto = (uri: string): void => {
    setSelectedImageUris((prev) => [...prev, uri]);
  };

  const handleRemovePhoto = (index: number): void => {
    setSelectedImageUris((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSuggestionPress = (suggestion: string): void => {
    setIssueText((current) => {
      if (!current.trim()) return suggestion;
      if (current.includes(suggestion)) return current;
      return `${current.trim()}, ${suggestion}`;
    });
  };

  const handleSubmit = async (): Promise<void> => {
    Keyboard.dismiss();
    const trimmed = issueText.trim();
    if (!trimmed) {
      Alert.alert('Describe the problem', 'Please describe what happened before finding professionals.');
      return;
    }

    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const timingLabel = TIMING_OPTIONS.find((t) => t.id === selectedTiming)?.label ?? 'Flexible';
      const fullText = isEmergency
        ? `[URGENT / EMERGENCY] [Timing: ${timingLabel}] [Category: ${selectedCategory}] ${trimmed}`
        : `[Timing: ${timingLabel}] [Category: ${selectedCategory}] ${trimmed}`;

      const created = await createServiceRequest({
        rawText: fullText,
        addressId: selectedAddress?.id ?? null,
      });

      for (const uri of selectedImageUris) {
        try {
          await uploadServiceRequestAttachment(created.id, uri, 'image');
        } catch {
          // Continue if one attachment fails
        }
      }

      router.push({
        pathname: '/problem-assistant',
        params: {
          requestId: created.id,
          category: selectedCategory,
          issue: trimmed,
          voiceStatus: voiceStatus ?? '',
          photoUri: selectedImageUris[0] ?? '',
          voiceUri: '',
        },
      });
    } catch (err) {
      if (err instanceof ApiRequestError && err.status === 401) {
        Alert.alert('Session expired', 'Please sign in again to submit your service request.');
      } else {
        const message = err instanceof Error ? err.message : 'Unable to create service request.';
        Alert.alert('Submission Error', message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <View style={{ flex: 1 }}>
          <ScrollView
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: 80 + insets.bottom + 48 },
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Header Navigation */}
            <View style={styles.topNavRow}>
              <Pressable
                onPress={() => router.back()}
                style={styles.backBtn}
                accessibilityRole="button"
                accessibilityLabel="Go back"
              >
                <Ionicons name="arrow-back" size={20} color={colors.text} />
              </Pressable>
              <View style={{ flex: 1 }}>
                <Text variant="caption" style={styles.topCaption}>
                  SERVICE REQUEST
                </Text>
                <Text variant="h1" style={styles.pageTitle}>
                  Tell us what happened?
                </Text>
              </View>
            </View>

            {/* Progress Stepper */}
            <View style={styles.stepperWrap}>
              <StatusStepper steps={STEPS} currentStepIndex={0} orientation="horizontal" />
            </View>

            {/* Category Picker Chips */}
            <View style={styles.section}>
              <Text variant="caption" style={styles.sectionLabel}>
                SELECT CATEGORY
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryScroll}
                keyboardShouldPersistTaps="handled"
              >
                {Object.keys(CATEGORY_PRESETS).map((catKey) => {
                  const isSelected = catKey === selectedCategory;
                  const catPreset = CATEGORY_PRESETS[catKey]!;
                  return (
                    <Pressable
                      key={catKey}
                      onPress={() => setSelectedCategory(catKey)}
                      style={[styles.catPill, isSelected && styles.catPillActive]}
                      accessibilityRole="button"
                      accessibilityLabel={`Category: ${catKey}`}
                    >
                      <Ionicons
                        name={catPreset.icon}
                        size={16}
                        color={isSelected ? '#FFFFFF' : colors.primary}
                      />
                      <Text
                        variant="caption"
                        style={[
                          styles.catPillText,
                          isSelected && styles.catPillTextActive,
                        ]}
                      >
                        {catKey}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            {/* Main Problem Input Card */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.iconCircle}>
                  <Ionicons name={currentPreset.icon} size={18} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text variant="bodyStrong" style={styles.cardTitle}>
                    What seems to be the problem?
                  </Text>
                  <Text variant="caption" color="secondary">
                    Type description or speak into microphone
                  </Text>
                </View>
                <Text variant="caption" style={styles.charCount}>
                  {issueText.length}/500
                </Text>
              </View>

              {/* Multiline Input */}
              <TextInput
                value={issueText}
                onChangeText={setIssueText}
                placeholder="Example: My AC is not cooling and water is leaking..."
                placeholderTextColor={colors.textMuted}
                multiline
                maxLength={500}
                style={styles.textInput}
              />

              {/* Quick Suggestions based on selected category */}
              <View style={styles.suggestionsWrap}>
                <Text variant="caption" style={styles.suggestionsLabel}>
                  QUICK SUGGESTIONS
                </Text>
                <View style={styles.chipsRow}>
                  {currentPreset.suggestions.map((suggestion) => (
                    <Pressable
                      key={suggestion}
                      onPress={() => handleSuggestionPress(suggestion)}
                      style={styles.chip}
                      accessibilityRole="button"
                      accessibilityLabel={`Add suggestion: ${suggestion}`}
                    >
                      <Text variant="caption" style={styles.chipText}>
                        + {suggestion}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </View>

            {/* Voice Recorder Component with animated waveform & timer */}
            <VoiceRecorder
              isRecording={isRecording}
              voiceStatus={voiceStatus}
              voiceUiState={voiceUiState}
              onToggleRecord={() => void toggleVoice()}
              onCancelRecord={() => void stopListening()}
            />

            {/* Photo Attachments with Camera and Gallery direct actions */}
            <View style={styles.card}>
              <PhotoAttachmentGrid
                photos={selectedImageUris}
                maxPhotos={3}
                onAddPhoto={handleAddPhoto}
                onRemovePhoto={handleRemovePhoto}
              />
            </View>

            {/* Service Location Selection */}
            <View style={styles.section}>
              <View style={styles.addressHeaderRow}>
                <Text variant="caption" style={styles.sectionLabel}>
                  SERVICE LOCATION
                </Text>
                <Pressable
                  onPress={() =>
                    router.push({
                      pathname: '/addresses',
                      params: { returnTo: '/create' },
                    })
                  }
                  hitSlop={8}
                >
                  <Text variant="caption" style={{ color: colors.primary, fontWeight: '700' }}>
                    {selectedAddress ? 'Change →' : '+ Add Address'}
                  </Text>
                </Pressable>
              </View>

              <Pressable
                style={styles.addressPillCard}
                onPress={() =>
                  router.push({
                    pathname: '/addresses',
                    params: { returnTo: '/create' },
                  })
                }
              >
                <Ionicons name="location" size={18} color={colors.primary} />
                <View style={{ flex: 1 }}>
                  {selectedAddress ? (
                    <>
                      <Text variant="bodyStrong">
                        {selectedAddress.label} · {selectedAddress.locality}
                      </Text>
                      <Text variant="caption" color="secondary" numberOfLines={1}>
                        {selectedAddress.addressLine}, {selectedAddress.city} - {selectedAddress.pincode}
                      </Text>
                    </>
                  ) : (
                    <>
                      <Text variant="bodyStrong" style={{ color: colors.primary }}>
                        No address selected
                      </Text>
                      <Text variant="caption" color="secondary">
                        Tap to add or select your doorstep address
                      </Text>
                    </>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
              </Pressable>
            </View>

            {/* Preferred Timing */}
            <View style={styles.section}>
              <Text variant="caption" style={styles.sectionLabel}>
                WHEN DO YOU NEED SERVICE?
              </Text>
              <View style={styles.timingGrid}>
                {TIMING_OPTIONS.map((opt) => {
                  const isSelected = selectedTiming === opt.id;
                  return (
                    <Pressable
                      key={opt.id}
                      onPress={() => setSelectedTiming(opt.id)}
                      style={[styles.timingCard, isSelected && styles.timingCardActive]}
                      accessibilityRole="button"
                      accessibilityLabel={`Timing: ${opt.label}`}
                    >
                      <Text
                        variant="caption"
                        style={[
                          styles.timingText,
                          isSelected && styles.timingTextActive,
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Urgent Emergency Switch */}
            <View style={styles.emergencyCard}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="warning" size={16} color={colors.danger} />
                  <Text variant="bodyStrong" style={{ color: colors.text }}>
                    Emergency Service
                  </Text>
                </View>
                <Text variant="caption" color="secondary" style={{ marginTop: 2 }}>
                  Water pipe burst, short circuit hazard, or urgent repair
                </Text>
              </View>
              <Switch
                value={isEmergency}
                onValueChange={setIsEmergency}
                trackColor={{ false: colors.border, true: colors.danger }}
                thumbColor="#FFFFFF"
              />
            </View>
          </ScrollView>

          {/* Sticky Bottom Action Bar with safe area padding */}
          <View
            style={[
              styles.stickyBottom,
              { paddingBottom: Math.max(insets.bottom, spacing.md) },
            ]}
          >
            <Pressable
              style={[
                styles.findBtn,
                (!issueText.trim() || isSubmitting) && styles.findBtnDisabled,
              ]}
              onPress={() => void handleSubmit()}
              disabled={!issueText.trim() || isSubmitting}
              accessibilityRole="button"
              accessibilityLabel="Find Specialists"
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="search" size={18} color="#FFFFFF" />
                  <Text variant="bodyStrong" color="inverse" style={styles.findBtnText}>
                    Find Matching Specialists →
                  </Text>
                </>
              )}
            </Pressable>
          </View>
        </View>
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
  },
  topNavRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  topCaption: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: colors.primary,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
  stepperWrap: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  section: {
    gap: spacing.xs,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    color: colors.textSecondary,
  },
  categoryScroll: {
    gap: 8,
    paddingVertical: 2,
  },
  catPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.full,
  },
  catPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  catPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  catPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  charCount: {
    fontSize: 11,
    color: colors.textMuted,
  },
  textInput: {
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: 14,
    lineHeight: 20,
    color: colors.text,
    minHeight: 88,
    textAlignVertical: 'top',
  },
  suggestionsWrap: {
    gap: 6,
  },
  suggestionsLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
    color: colors.textMuted,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  addressHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addressPillCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  timingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timingCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timingCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  timingText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  timingTextActive: {
    color: colors.primaryDark,
    fontWeight: '700',
  },
  emergencyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  stickyBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: spacing.lg,
  },
  findBtn: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: radius.md,
  },
  findBtnDisabled: {
    opacity: 0.5,
  },
  findBtnText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
