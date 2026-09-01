import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState, type ReactElement } from 'react';
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
import * as ImagePicker from 'expo-image-picker';
import { Button, Text, useTheme } from '@nest/ui';
import { ApiRequestError } from '@/lib/api';
import { useVoiceTranscription } from '@/lib/use-voice-transcription';

const emptyMessage = 'Describe the issue you need help with.';

export default function CreateRequestScreen(): ReactElement {
  const theme = useTheme();
  const [issueText, setIssueText] = useState('');
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const { voiceStatus, voiceUiState, isRecording, toggleVoice, stopListening } = useVoiceTranscription({
    onTranscript: (transcript) => setIssueText((current) => (current.trim() ? `${current.trim()} ${transcript}` : transcript)),
    onError: (title, message) => Alert.alert(title, message),
  });

  const helperText = useMemo(() => {
    if (!issueText.trim()) {
      return emptyMessage;
    }
    return `We will match this with the most relevant professionals.`;
  }, [issueText]);

  const handlePhotoPress = async (): Promise<void> => {
    try {
      const choice = await new Promise<'camera' | 'library' | 'cancel'>((resolve) => {
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
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (permission.status !== 'granted') {
          Alert.alert('Camera access denied', 'Please allow camera access to take a photo.');
          return;
        }
      } else {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (permission.status !== 'granted') {
          Alert.alert('Photo access denied', 'Please allow photo access to attach an image.');
          return;
        }
      }

      const result = choice === 'camera'
        ? await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.8 })
        : await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, quality: 0.8 });

      if (result.canceled || !result.assets?.[0]?.uri) {
        return;
      }

      setSelectedImageUri(result.assets[0].uri);
    } catch (error) {
      Alert.alert('Photo unavailable', error instanceof Error ? error.message : 'Unable to attach an image.');
    }
  };

  const handleContinue = async (): Promise<void> => {
    const trimmed = issueText.trim();
    if (!trimmed) {
      Alert.alert('Describe the issue', 'Tell us what happened before we match the right professionals.');
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

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
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
                  Create a request
                </Text>
                <Text variant="h1">Tell us what happened</Text>
              </View>
            </View>

            <View style={[styles.panel, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: theme.radius.md, padding: theme.spacing.lg }] }>
              <Text variant="bodyStrong">Describe the issue</Text>
              <TextInput
                value={issueText}
                onChangeText={setIssueText}
                placeholder="Air conditioner is not cooling, kitchen tap is leaking, light keeps flickering..."
                placeholderTextColor="#62627A"
                multiline
                maxLength={300}
                accessibilityLabel="Describe the issue"
                style={[
                  styles.textInput,
                  {
                    backgroundColor: theme.colors.surfaceMuted,
                    borderColor: theme.colors.border,
                    color: '#17172B',
                    minHeight: 120,
                    marginTop: theme.spacing.sm,
                    padding: theme.spacing.md,
                    textAlignVertical: 'top',
                  },
                ]}
              />

              <Text variant="secondary" color="secondary" style={{ marginTop: theme.spacing.sm }}>
                {helperText}
              </Text>

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
                    { backgroundColor: isRecording ? '#4F46E5' : theme.colors.actionSecondary, borderColor: isRecording ? '#4F46E5' : theme.colors.border },
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
                    { backgroundColor: selectedImageUri ? '#FFEDD5' : theme.colors.actionSecondary, borderColor: theme.colors.border },
                  ]}
                  onPress={handlePhotoPress}
                >
                  <View style={styles.actionRow}>
                    <Ionicons name={selectedImageUri ? 'checkmark-circle-outline' : 'camera-outline'} size={18} color={theme.colors.textPrimary} />
                    <Text variant="secondary" color="primary">
                      {selectedImageUri ? 'Photo added' : 'Photo'}
                    </Text>
                  </View>
                </Pressable>
              </View>
            </View>

            <Button label="Find help" onPress={handleContinue} />
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTextWrap: { flex: 1 },
  panel: {
    borderWidth: 1,
    shadowColor: '#312E81',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  textInput: { borderWidth: 1, borderRadius: 12 },
  inlineActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pillButton: { flex: 1, minHeight: 44, borderRadius: 999, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  widePillButton: { flexBasis: '100%', flexGrow: 0 },
  thumb: { width: '100%', height: 180, borderRadius: 12, borderWidth: 1, borderColor: '#E2E2F0' },
  removePhoto: { marginTop: 8, alignSelf: 'flex-start' },
});
