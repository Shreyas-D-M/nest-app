import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import {
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createTranslator } from '@nest/i18n';
import { Button, Text, useTheme } from '@nest/ui';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState, type ReactElement } from 'react';
import { ApiRequestError, getServices } from '@/lib/api';
import { useVoiceTranscription } from '@/lib/use-voice-transcription';

const t = createTranslator('en');

const fallbackCategories = [
  t('customer.home.problemOne'),
  t('customer.home.problemTwo'),
  t('customer.home.problemThree'),
  t('customer.home.problemFour'),
];

export default function CustomerHomeScreen(): ReactElement {
  const theme = useTheme();
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ['catalog'], queryFn: getServices });
  const [issueText, setIssueText] = useState('');
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const { voiceStatus, voiceUiState, isRecording, toggleVoice, stopListening } = useVoiceTranscription({
    onTranscript: (transcript) => setIssueText((current) => (current.trim() ? `${current.trim()} ${transcript}` : transcript)),
    onError: (title, message) => Alert.alert(title, message),
  });

  const categories = (data?.categories ?? []).flatMap((category) =>
    category.services.map((service) => service.name),
  );

  const quickCategories = categories.length > 0 ? categories.slice(0, 6) : fallbackCategories;

  const handleFindHelp = async (): Promise<void> => {
    const trimmed = issueText.trim();

    if (!trimmed) {
      Alert.alert('Describe the issue', 'Tell us what happened before continuing to matching.');
      return;
    }

    try {
      const { createServiceRequest, uploadServiceRequestAttachment } = await import('@/lib/api');
      const request = await createServiceRequest({ rawText: trimmed });

      if (selectedImageUri) {
        await uploadServiceRequestAttachment(request.id, selectedImageUri, 'image');
      }

      router.push({
        pathname: '/problem-assistant',
        params: {
          issue: trimmed,
          voiceStatus: voiceStatus,
          photoUri: selectedImageUri ?? '',
          voiceUri: '',
        },
      });
    } catch (error) {
      if (error instanceof ApiRequestError && error.status === 401) {
        Alert.alert('Sign in required', 'Your session has expired. Please sign in again, then submit your request.');
      } else {
        Alert.alert('Request failed', 'Please check your connection and try again.');
      }
    }
  };

  const handlePhotoPress = async (): Promise<void> => {
    try {
      const choice = await new Promise<string>((resolve) => {
        Alert.alert('Add a photo', 'Choose how to add the image.', [
          { text: 'Camera', onPress: () => resolve('camera') },
          { text: 'Library', onPress: () => resolve('library') },
          { text: 'Cancel', style: 'cancel', onPress: () => resolve('cancel') },
        ]);
      });

      if (choice === 'cancel') {
        return;
      }

      if (choice === 'camera') {
        const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
        if (cameraPermission.status !== 'granted') {
          Alert.alert('Camera access denied', 'We need camera access to take a photo.');
          return;
        }
      } else {
        const libraryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (libraryPermission.status !== 'granted') {
          Alert.alert('Photo access denied', 'We need photo access to attach an image.');
          return;
        }
      }

      const pickerResult = choice === 'camera'
        ? await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.8 })
        : await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, quality: 0.8 });

      if (pickerResult.canceled || !pickerResult.assets?.[0]?.uri) {
        return;
      }

      setSelectedImageUri(pickerResult.assets[0].uri);
      Alert.alert('Photo ready', 'The image has been added to your request.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to pick a photo.';
      Alert.alert('Photo unavailable', message);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: '#F7F7FF' }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
        keyboardVerticalOffset={0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={{ padding: theme.spacing.xl, gap: theme.spacing.lg, paddingBottom: 140 }}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.headerRow}>
              <View style={styles.headerTextWrap}>
                <Text variant="caption" color="secondary">
                  {t('customer.home.greeting')}
                </Text>
                <Text variant="h1">{t('customer.home.title')}</Text>
              </View>
              <View style={styles.headerActions}>
                <Pressable
                  accessibilityLabel="Open menu"
                  style={[styles.iconButton, { borderColor: '#E1E3F0', backgroundColor: '#FFFFFF' }]}
                  onPress={() => router.push('/menu')}
                >
                  <Ionicons name="menu" size={22} color="#4F46E5" />
                </Pressable>
                <Pressable
                  style={[styles.avatar, { backgroundColor: '#4F46E5' }]}
                  onPress={() => router.push('/profile')}
                  accessibilityRole="button"
                  accessibilityLabel="Open profile"
                >
                  <Text variant="bodyStrong" color="inverse">
                    N
                  </Text>
                </Pressable>
              </View>
            </View>

            <View
              style={[
                styles.primaryPanel,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                  borderRadius: theme.radius.md,
                  padding: theme.spacing.lg,
                },
              ]}
            >
              <Text variant="bodyStrong" color="primary">
                {t('customer.home.problemPrompt')}
              </Text>

              <TextInput
                value={issueText}
                onChangeText={setIssueText}
                placeholder={t('customer.home.problemPlaceholder')}
                placeholderTextColor="#66667A"
                multiline
                maxLength={300}
                accessibilityLabel="Describe the problem"
                style={[
                  styles.textInput,
                  {
                    backgroundColor: '#EEF0FF',
                    borderColor: '#E1E3F0',
                    color: '#17172B',
                    borderRadius: theme.radius.sm,
                    marginTop: theme.spacing.sm,
                    minHeight: 120,
                    padding: theme.spacing.md,
                    textAlignVertical: 'top',
                  },
                ]}
              />

              {voiceStatus ? (
                <View style={{ marginTop: theme.spacing.sm, gap: 6 }}>
                  <Text variant="secondary" color={voiceUiState === 'error' ? 'danger' : 'secondary'}>
                    {voiceUiState === 'recording' ? '● Recording' : voiceStatus}
                  </Text>
                </View>
              ) : null}

              {selectedImageUri ? (
                <View style={{ marginTop: theme.spacing.md }}>
                  <Image source={{ uri: selectedImageUri }} style={styles.thumb} />
                  <Pressable onPress={() => setSelectedImageUri(null)} style={styles.removePhoto}>
                    <Text variant="secondary" color="accent">
                      Remove photo
                    </Text>
                  </Pressable>
                </View>
              ) : null}

              <View style={[styles.inlineActions, { marginTop: theme.spacing.md }]}>
                <Pressable
                  style={[
                    styles.pillButton,
                    {
                      backgroundColor: isRecording ? '#4F46E5' : '#EEF0FF',
                      borderColor: '#E1E3F0',
                    },
                  ]}
                  onPress={() => void toggleVoice()}
                  accessibilityLabel={isRecording ? 'Finish and transcribe recording' : 'Record a voice note'}
                >
                  <View style={styles.actionRow}>
                    <Ionicons name={isRecording ? 'checkmark-circle' : 'mic-outline'} size={18} color={isRecording ? '#FFFFFF' : theme.colors.textPrimary} />
                    <Text variant="secondary" color={isRecording ? 'inverse' : 'primary'}>
                      {isRecording ? 'Finish recording' : 'Voice'}
                    </Text>
                  </View>
                </Pressable>
                {isRecording ? (
                  <Pressable
                    style={[styles.pillButton, styles.widePillButton, { backgroundColor: '#4F46E5', borderColor: '#4F46E5' }]}
                    onPress={() => void stopListening()}
                    accessibilityLabel="Stop listening"
                  >
                    <View style={styles.actionRow}>
                      <Ionicons name="stop-circle" size={18} color="#FFFFFF" />
                      <Text variant="secondary" color="inverse">Stop listening</Text>
                    </View>
                  </Pressable>
                ) : null}
                <Pressable
                  style={[
                    styles.pillButton,
                    { backgroundColor: selectedImageUri ? '#F97360' : '#EEF0FF', borderColor: '#E1E3F0' },
                  ]}
                  onPress={handlePhotoPress}
                  accessibilityLabel="Add a photo"
                >
                  <View style={styles.actionRow}>
                    <Ionicons name={selectedImageUri ? 'checkmark-circle-outline' : 'camera-outline'} size={18} color={selectedImageUri ? '#FFFFFF' : theme.colors.textPrimary} />
                    <Text variant="secondary" color={selectedImageUri ? 'inverse' : 'primary'}>
                      {selectedImageUri ? 'Photo added' : 'Photo'}
                    </Text>
                  </View>
                </Pressable>
              </View>

              <View style={{ marginTop: theme.spacing.md }}>
                <Button label={t('customer.home.findHelp')} onPress={handleFindHelp} />
              </View>
            </View>

            <View>
              <View style={styles.sectionHeaderRow}>
                <Text variant="h2">{t('customer.home.quickCategories')}</Text>
                <Pressable onPress={() => router.push('/professionals')}>
                  <Text variant="secondary" color="accent">
                    {t('customer.home.viewAll')}
                  </Text>
                </Pressable>
              </View>
              <View style={styles.categoryGrid}>
                {quickCategories.map((category) => (
                  <Pressable
                    key={category}
                    onPress={() => router.push({ pathname: '/professionals', params: { category } })}
                    style={[
                      styles.categoryChip,
                      { backgroundColor: '#FFFFFF', borderColor: '#E1E3F0' },
                    ]}
                  >
                    <Text variant="secondary" color="primary">
                      {category}
                    </Text>
                  </Pressable>
                ))}
              </View>
              {isLoading && (
                <Text variant="secondary" color="secondary" style={{ marginTop: 12 }}>
                  Loading services…
                </Text>
              )}
              {error && (
                <View
                  style={{
                    marginTop: 12,
                    padding: theme.spacing.md,
                    borderRadius: theme.radius.md,
                    borderWidth: 1,
                    borderColor: '#E1E3F0',
                    backgroundColor: '#FFFFFF',
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text variant="bodyStrong" color="accent">!</Text>
                    <Text variant="bodyStrong">Service catalogue unavailable</Text>
                  </View>
                  <Text variant="secondary" color="secondary" style={{ marginTop: 6 }}>
                    We couldn’t load the latest services right now.
                  </Text>
                  <View style={{ marginTop: 12 }}>
                    <Button label="Retry" onPress={() => void refetch()} variant="secondary" />
                  </View>
                </View>
              )}
            </View>

            <View>
              <View style={styles.sectionHeaderRow}>
                <Text variant="h2">{t('customer.home.availableNow')}</Text>
                <Pressable onPress={() => router.push('/professionals')}>
                  <Text variant="secondary" color="accent">
                    {t('customer.home.viewAll')}
                  </Text>
                </Pressable>
              </View>

              {((data?.categories ?? []).slice(0, 3).length === 0) ? (
                <View
                  style={{
                    padding: theme.spacing.lg,
                    borderRadius: theme.radius.md,
                    borderWidth: 1,
                    borderColor: '#E1E3F0',
                    backgroundColor: '#FFFFFF',
                  }}
                >
                  <Text variant="bodyStrong">No professionals available right now</Text>
                  <Text variant="secondary" color="secondary" style={{ marginTop: 6 }}>
                    Check back soon or browse all professionals.
                  </Text>
                  <View style={{ marginTop: 12 }}>
                    <Button label="Browse professionals" onPress={() => router.push('/professionals')} variant="secondary" />
                  </View>
                </View>
              ) : (
                <View style={styles.stack}>
                  {(data?.categories ?? []).slice(0, 3).map((category) => (
                    <View
                      key={category.id}
                      style={[
                        styles.card,
                        {
                          backgroundColor: theme.colors.surface,
                          borderColor: theme.colors.border,
                          borderRadius: theme.radius.md,
                          padding: theme.spacing.md,
                        },
                      ]}
                    >
                      <View style={styles.cardHeaderRow}>
                        <View>
                          <Text variant="bodyStrong">{category.name}</Text>
                          <Text variant="secondary" color="secondary">
                            {category.services.length} services available
                          </Text>
                        </View>
                        <View style={[styles.badge, { backgroundColor: '#EEF0FF' }]}>
                          <Text variant="secondary" color="accent">
                            {t('common.now')}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.metaRow}>
                        <Text variant="secondary" color="secondary">
                          {category.services[0]?.name ?? 'Service'}
                        </Text>
                        <Text variant="secondary" color="secondary">
                          {category.services[0]?.basePriceMinor !== null &&
                          category.services[0]?.basePriceMinor !== undefined
                            ? `From ₹${(category.services[0].basePriceMinor / 100).toFixed(0)}`
                            : 'Estimate available'}
                        </Text>
                      </View>

                      <View style={{ marginTop: theme.spacing.sm }}>
                        <Button
                          label="Book now"
                          onPress={() => router.push(`/booking?service=${encodeURIComponent(category.name)}`)}
                          variant="secondary"
                        />
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>

            <View>
              <View style={styles.sectionHeaderRow}>
                <Text variant="h2">{t('customer.home.yourPeople')}</Text>
                <Pressable onPress={() => router.push('/favorites')}>
                  <Text variant="secondary" color="accent">
                    {t('customer.home.viewAll')}
                  </Text>
                </Pressable>
              </View>

              <View style={styles.stack}>
                {[
                  { name: 'Priya M.', label: 'Water purifier', lastBooked: 'Booked 2 weeks ago' },
                  { name: 'Anil R.', label: 'AC service', lastBooked: 'Booked last month' },
                ].map((person) => (
                  <View
                    key={person.name}
                    style={[
                      styles.rowCard,
                      {
                        backgroundColor: theme.colors.surface,
                        borderColor: theme.colors.border,
                        borderRadius: theme.radius.md,
                        padding: theme.spacing.md,
                      },
                    ]}
                  >
                    <View>
                      <Text variant="bodyStrong">{person.name}</Text>
                      <Text variant="secondary" color="secondary">
                        {person.label} · {person.lastBooked}
                      </Text>
                    </View>
                    <Button
                      label={t('customer.home.bookAgain')}
                      onPress={() => router.push(`/booking?service=${encodeURIComponent(person.label)}`)}
                      variant="secondary"
                    />
                  </View>
                ))}
              </View>
            </View>

            <View
              style={[
                styles.primaryPanel,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                  borderRadius: theme.radius.md,
                  padding: theme.spacing.lg,
                },
              ]}
            >
              <Text variant="h2">{t('customer.home.homePassport')}</Text>
              <Text variant="secondary" color="secondary" style={{ marginTop: 4 }}>
                {t('customer.home.passportDue')}
              </Text>
              <Text variant="bodyStrong" style={{ marginTop: theme.spacing.sm }}>
                {t('customer.home.passportText')}
              </Text>
              <View style={{ marginTop: theme.spacing.md }}>
                <Button label="View details" onPress={() => router.push('/home-passport')} variant="accent" />
              </View>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  headerTextWrap: {
    flex: 1,
    paddingRight: 16,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderWidth: 1,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryPanel: {
    borderWidth: 1,
    shadowColor: '#4F46E5',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  inputPlaceholder: {
    borderWidth: 1,
  },
  textInput: {
    borderWidth: 1,
  },
  thumb: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E1E3F0',
  },
  removePhoto: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  inlineActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pillButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  widePillButton: {
    flexBasis: '100%',
    flexGrow: 0,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 10,
    shadowColor: '#4F46E5',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  stack: {
    gap: 12,
  },
  card: {
    borderWidth: 1,
    shadowColor: '#4F46E5',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  rowCard: {
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#4F46E5',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
});
