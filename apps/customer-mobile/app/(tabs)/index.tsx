import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useMemo, useState, type ReactElement } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@nest/ui';
import { useQuery } from '@tanstack/react-query';
import {
  createServiceRequest,
  listCustomerBookings,
  listNotifications,
  uploadServiceRequestAttachment,
} from '@/lib/api';
import { useAddress } from '@/lib/address-context';
import { useAuth } from '@/lib/auth-context';
import { useVoiceTranscription } from '@/lib/use-voice-transcription';
import {
  BookingCard,
  SearchBar,
  SectionHeader,
  ServiceCard,
  TrustBadge,
} from '@/components';
import { colors, radius, shadows, spacing } from '@/theme/colors';

const POPULAR_SERVICES = [
  {
    id: 'ac_service',
    name: 'AC Service',
    category: 'AC Repair',
    icon: 'snow-outline' as const,
    iconColor: colors.primary,
    iconBg: colors.primaryLight,
    badge: 'Popular',
    badgeBg: colors.primaryLight,
    badgeColor: colors.primaryDark,
  },
  {
    id: 'plumbing',
    name: 'Plumbing',
    category: 'Plumbing',
    icon: 'water-outline' as const,
    iconColor: '#0284C7',
    iconBg: '#E0F2FE',
  },
  {
    id: 'electrical',
    name: 'Electrical',
    category: 'Electrical',
    icon: 'flash-outline' as const,
    iconColor: colors.warning,
    iconBg: colors.warningLight,
  },
  {
    id: 'cleaning',
    name: 'Cleaning',
    category: 'Cleaning',
    icon: 'sparkles-outline' as const,
    iconColor: colors.success,
    iconBg: colors.successLight,
    badge: 'Fast',
    badgeBg: colors.successLight,
    badgeColor: colors.successText,
  },
  {
    id: 'appliance',
    name: 'Appliance',
    category: 'Appliance Repair',
    icon: 'construct-outline' as const,
    iconColor: '#7C3AED',
    iconBg: '#F3E8FF',
  },
  {
    id: 'painting',
    name: 'Painting',
    category: 'Painting',
    icon: 'color-palette-outline' as const,
    iconColor: '#EA580C',
    iconBg: '#FFEDD5',
  },
  {
    id: 'carpentry',
    name: 'Handyman',
    category: 'General Handyman',
    icon: 'hammer-outline' as const,
    iconColor: '#4B5563',
    iconBg: '#F3F4F6',
  },
  {
    id: 'purifier',
    name: 'Purifier',
    category: 'Appliance Repair',
    icon: 'shield-checkmark-outline' as const,
    iconColor: '#2563EB',
    iconBg: '#DBEAFE',
  },
];

export default function CustomerHomeScreen(): ReactElement {
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const { selectedAddress, refetchAddresses } = useAddress();

  const { data: bookingsData, refetch: refetchBookings } = useQuery({
    queryKey: ['customer-bookings'],
    queryFn: listCustomerBookings,
  });

  const { data: notificationsData, refetch: refetchNotifications } = useQuery({
    queryKey: ['notifications'],
    queryFn: listNotifications,
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [issueText, setIssueText] = useState('');
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { voiceStatus, voiceUiState, isRecording, toggleVoice, stopListening } =
    useVoiceTranscription({
      onTranscript: (transcript) =>
        setIssueText((current) => {
          const trimmed = current.trim();
          if (!trimmed) return transcript;
          return `${trimmed} ${transcript}`;
        }),
      onError: (title, message) => Alert.alert(title, message),
    });

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const userName = session?.user.name?.trim().split(' ')[0] ?? 'there';
  const recentBookings = useMemo(
    () => (bookingsData?.data ?? []).slice(0, 2),
    [bookingsData?.data],
  );
  const unreadNotificationsCount = notificationsData?.unreadCount ?? 0;

  const locationLabel = selectedAddress
    ? `${selectedAddress.locality} · ${selectedAddress.city}`
    : 'Set Service Location';

  const onRefresh = async (): Promise<void> => {
    setRefreshing(true);
    await Promise.all([refetchBookings(), refetchNotifications(), refetchAddresses()]);
    setRefreshing(false);
  };

  const handlePhotoPress = async (): Promise<void> => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Photo Library Access',
          'Please allow photo library access in device settings to attach images of the repair issue.',
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedImageUri(result.assets[0]!.uri);
      }
    } catch {
      Alert.alert('Error', 'Unable to pick photo. Please try again.');
    }
  };

  const handleFindHelp = async (): Promise<void> => {
    Keyboard.dismiss();
    const trimmed = issueText.trim();
    if (!trimmed) {
      Alert.alert('Describe the issue', 'Tell us what happened so we can find the right professional.');
      return;
    }

    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const request = await createServiceRequest({
        rawText: trimmed,
        addressId: selectedAddress?.id ?? null,
      });

      if (selectedImageUri) {
        await uploadServiceRequestAttachment(request.id, selectedImageUri, 'image').catch(
          () => undefined,
        );
      }

      setIssueText('');
      setSelectedImageUri(null);

      router.push({
        pathname: '/problem-assistant',
        params: {
          requestId: request.id,
          issue: trimmed,
        },
      });
    } catch (err) {
      Alert.alert('Request Failed', err instanceof Error ? err.message : 'Please check your connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredServices = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return POPULAR_SERVICES;
    return POPULAR_SERVICES.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q),
    );
  }, [searchQuery]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: 72 + insets.bottom + 48 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void onRefresh()}
              tintColor={colors.primary}
            />
          }
        >
          {/* 1. Header with Location, Notifications, Avatar */}
          <View style={styles.topHeader}>
            <View style={styles.headerLeft}>
              <Text variant="caption" style={styles.greetingText}>
                {greeting}, {userName}
              </Text>
              <Pressable
                style={styles.locationPill}
                onPress={() => router.push('/addresses')}
                accessibilityRole="button"
                accessibilityLabel={`Change address: ${locationLabel}`}
              >
                <Ionicons name="location" size={14} color={colors.primary} />
                <Text variant="bodyStrong" style={styles.locationText} numberOfLines={1}>
                  {locationLabel}
                </Text>
                <Ionicons name="chevron-down" size={13} color={colors.textSecondary} />
              </Pressable>
            </View>

            <View style={styles.headerRight}>
              <Pressable
                style={styles.iconButton}
                onPress={() => router.push('/notifications')}
                accessibilityRole="button"
                accessibilityLabel="Notifications"
              >
                <Ionicons name="notifications-outline" size={20} color={colors.text} />
                {unreadNotificationsCount > 0 ? <View style={styles.notificationDot} /> : null}
              </Pressable>

              <Pressable
                style={styles.avatarWrap}
                onPress={() => router.push('/profile')}
                accessibilityRole="button"
                accessibilityLabel="My Profile"
              >
                <Text variant="bodyStrong" style={{ color: colors.primaryDark }}>
                  {userName.slice(0, 1).toUpperCase()}
                </Text>
              </Pressable>
            </View>
          </View>

          {/* 2. Search Bar */}
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="What service do you need? (e.g. AC repair, tap leak)"
            onClear={() => setSearchQuery('')}
          />

          {/* 3. Primary Hero Card: "Tell us what happened" */}
          <View style={styles.heroCard}>
            <View style={styles.heroContent}>
              <Text variant="h2" style={styles.heroTitle}>
                Tell us what happened?
              </Text>
              <Text variant="secondary" color="secondary" style={styles.heroSubtitle}>
                Describe your problem or speak into microphone. We'll match top specialists.
              </Text>
            </View>

            {/* Functional Problem Input Area */}
            <View style={styles.inputArea}>
              <TextInput
                value={issueText}
                onChangeText={setIssueText}
                placeholder="e.g. Kitchen tap is leaking heavily under the sink..."
                placeholderTextColor={colors.textMuted}
                multiline
                maxLength={500}
                style={styles.textInput}
              />

              {/* Voice Status Indicator if active */}
              {voiceUiState === 'processing' ? (
                <View style={styles.voiceProcessingRow}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text variant="caption" style={{ color: colors.primary, fontWeight: '700' }}>
                    Transcribing speech with Whisper AI…
                  </Text>
                </View>
              ) : voiceUiState === 'error' ? (
                <Pressable
                  style={styles.voiceErrorRow}
                  onPress={() => void toggleVoice()}
                >
                  <Ionicons name="refresh" size={13} color={colors.danger} />
                  <Text variant="caption" style={{ color: colors.danger, fontWeight: '600' }}>
                    {voiceStatus || 'Transcription error. Tap to retry.'}
                  </Text>
                </Pressable>
              ) : null}

              {/* Image preview if attached */}
              {selectedImageUri ? (
                <View style={styles.imagePreviewWrap}>
                  <Image source={{ uri: selectedImageUri }} style={styles.previewThumb} />
                  <Pressable
                    style={styles.removeImageBtn}
                    onPress={() => setSelectedImageUri(null)}
                    accessibilityLabel="Remove attached photo"
                  >
                    <Ionicons name="close" size={12} color="#FFFFFF" />
                  </Pressable>
                </View>
              ) : null}

              {/* Input Actions Bar */}
              <View style={styles.inputActionRow}>
                <Pressable
                  style={[
                    styles.voiceBtn,
                    isRecording && styles.voiceBtnRecording,
                    voiceUiState === 'error' && styles.voiceBtnError,
                  ]}
                  onPress={() => void toggleVoice()}
                  accessibilityRole="button"
                  accessibilityLabel={isRecording ? 'Stop recording' : 'Voice input'}
                >
                  <Ionicons
                    name={isRecording ? 'stop' : voiceUiState === 'error' ? 'refresh' : 'mic'}
                    size={16}
                    color={isRecording ? colors.danger : colors.primary}
                  />
                  <Text
                    variant="bodyStrong"
                    style={[
                      styles.voiceBtnText,
                      isRecording && styles.voiceBtnTextRecording,
                    ]}
                  >
                    {isRecording ? 'Listening…' : voiceUiState === 'error' ? 'Retry' : 'Voice'}
                  </Text>
                </Pressable>

                {isRecording ? (
                  <Pressable
                    style={styles.cancelVoiceBtn}
                    onPress={() => void stopListening()}
                    accessibilityLabel="Cancel recording"
                  >
                    <Text variant="caption" color="inverse">
                      Cancel
                    </Text>
                  </Pressable>
                ) : null}

                <Pressable
                  style={[
                    styles.photoBtn,
                    selectedImageUri ? styles.photoBtnActive : null,
                  ]}
                  onPress={() => void handlePhotoPress()}
                  accessibilityLabel="Attach photo"
                >
                  <Ionicons
                    name={selectedImageUri ? 'image' : 'camera-outline'}
                    size={16}
                    color={selectedImageUri ? colors.primary : colors.textSecondary}
                  />
                  <Text
                    variant="bodyStrong"
                    style={[
                      styles.photoBtnText,
                      selectedImageUri ? styles.photoBtnTextActive : null,
                    ]}
                  >
                    {selectedImageUri ? 'Photo added' : 'Photo'}
                  </Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.submitBtn,
                    (!issueText.trim() || isSubmitting) && styles.submitBtnDisabled,
                  ]}
                  onPress={() => void handleFindHelp()}
                  disabled={!issueText.trim() || isSubmitting}
                  accessibilityRole="button"
                  accessibilityLabel="Find Help"
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text variant="bodyStrong" color="inverse" style={styles.submitBtnText}>
                      Find Help →
                    </Text>
                  )}
                </Pressable>
              </View>
            </View>

            <Pressable
              style={styles.fullScreenLink}
              onPress={() => router.push('/create')}
            >
              <Text variant="secondary" style={styles.fullScreenLinkText}>
                Open guided intake form →
              </Text>
            </Pressable>
          </View>

          {/* 4. Popular Services Grid */}
          <View style={styles.section}>
            <SectionHeader
              title="Popular Services"
              subtitle="Verified local specialists with upfront pricing"
              rightActionText="View all →"
              onRightActionPress={() => router.push('/discover')}
            />

            <View style={styles.serviceGrid}>
              {filteredServices.map((service) => (
                <ServiceCard
                  key={service.id}
                  name={service.name}
                  category={service.category}
                  icon={service.icon}
                  iconColor={service.iconColor}
                  iconBg={service.iconBg}
                  badge={service.badge}
                  badgeBg={service.badgeBg}
                  badgeColor={service.badgeColor}
                  onPress={() =>
                    router.push({
                      pathname: '/create',
                      params: { category: service.category },
                    })
                  }
                />
              ))}
            </View>
          </View>

          {/* 5. Recent / Upcoming Bookings Feed */}
          {recentBookings.length > 0 ? (
            <View style={styles.section}>
              <SectionHeader
                title="Upcoming Appointments"
                rightActionText="All bookings →"
                onRightActionPress={() => router.push('/bookings')}
              />

              <View style={{ gap: spacing.sm }}>
                {recentBookings.map((booking) => (
                  <BookingCard
                    key={booking.id}
                    id={booking.id}
                    serviceName={booking.service.name}
                    scheduledStart={booking.scheduledStart}
                    status={booking.status}
                    amountFormatted={
                      booking.finalAmountMinor != null
                        ? `₹${(booking.finalAmountMinor / 100).toFixed(0)}`
                        : `₹${(booking.estimatedAmountMinor / 100).toFixed(0)}`
                    }
                    onTrack={() => router.push('/active-booking')}
                  />
                ))}
              </View>
            </View>
          ) : null}

          {/* 6. NEST Trust & Safety Guarantees */}
          <TrustBadge />
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
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  headerLeft: {
    gap: 1,
    flex: 1,
  },
  greetingText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 1,
  },
  locationText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    maxWidth: 200,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    ...shadows.sm,
  },
  notificationDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  avatarWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroCard: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
    gap: spacing.md,
  },
  heroContent: {
    gap: 2,
  },
  heroTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  heroSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  inputArea: {
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
  },
  textInput: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.text,
    minHeight: 56,
    textAlignVertical: 'top',
  },
  voiceProcessingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.sm,
    alignSelf: 'flex-start',
  },
  voiceErrorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.dangerLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.sm,
    alignSelf: 'flex-start',
  },
  imagePreviewWrap: {
    position: 'relative',
    width: 60,
    height: 60,
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
  previewThumb: {
    width: '100%',
    height: '100%',
  },
  removeImageBtn: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: 'rgba(0,0,0,0.7)',
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  voiceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 10,
    height: 36,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  voiceBtnRecording: {
    backgroundColor: colors.dangerLight,
    borderColor: colors.dangerBorder,
  },
  voiceBtnError: {
    backgroundColor: colors.dangerLight,
    borderColor: colors.dangerBorder,
  },
  voiceBtnText: {
    fontSize: 12,
    color: colors.primaryDark,
  },
  voiceBtnTextRecording: {
    color: colors.danger,
  },
  cancelVoiceBtn: {
    backgroundColor: '#374151',
    paddingHorizontal: 8,
    height: 36,
    borderRadius: radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.card,
    paddingHorizontal: 10,
    height: 36,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  photoBtnActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primaryBorder,
  },
  photoBtnText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  photoBtnTextActive: {
    color: colors.primaryDark,
  },
  submitBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    height: 36,
    borderRadius: radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitBtnDisabled: {
    opacity: 0.45,
  },
  submitBtnText: {
    fontSize: 12,
  },
  fullScreenLink: {
    alignSelf: 'center',
    paddingVertical: 2,
  },
  fullScreenLinkText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  section: {
    gap: spacing.sm,
  },
  serviceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 6,
  },
});
