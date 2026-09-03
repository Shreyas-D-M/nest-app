import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState, type ReactElement } from 'react';
import { ActivityIndicator, Animated, Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@nest/ui';
import { colors, radius, spacing } from '../theme/colors';

export interface VoiceRecorderProps {
  isRecording: boolean;
  voiceStatus: string | null;
  voiceUiState: 'idle' | 'recording' | 'processing' | 'transcribing' | 'success' | 'error';
  onToggleRecord: () => void;
  onCancelRecord: () => void;
  compact?: boolean;
}

export function VoiceRecorder({
  isRecording,
  voiceStatus,
  voiceUiState,
  onToggleRecord,
  onCancelRecord,
  compact = false,
}: VoiceRecorderProps): ReactElement {
  const [seconds, setSeconds] = useState(0);
  const wave1 = useRef(new Animated.Value(6)).current;
  const wave2 = useRef(new Animated.Value(14)).current;
  const wave3 = useRef(new Animated.Value(8)).current;
  const wave4 = useRef(new Animated.Value(18)).current;

  const isProcessing = voiceUiState === 'processing' || voiceUiState === 'transcribing';
  const isError = voiceUiState === 'error';
  const isSuccess = voiceUiState === 'success';

  useEffect(() => {
    if (!isRecording) {
      setSeconds(0);
      return;
    }

    const timer = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);

    const anim = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(wave1, { toValue: 18, duration: 300, useNativeDriver: false }),
          Animated.timing(wave2, { toValue: 8, duration: 300, useNativeDriver: false }),
          Animated.timing(wave3, { toValue: 20, duration: 300, useNativeDriver: false }),
          Animated.timing(wave4, { toValue: 10, duration: 300, useNativeDriver: false }),
        ]),
        Animated.parallel([
          Animated.timing(wave1, { toValue: 6, duration: 300, useNativeDriver: false }),
          Animated.timing(wave2, { toValue: 18, duration: 300, useNativeDriver: false }),
          Animated.timing(wave3, { toValue: 6, duration: 300, useNativeDriver: false }),
          Animated.timing(wave4, { toValue: 22, duration: 300, useNativeDriver: false }),
        ]),
      ]),
    );

    anim.start();

    return () => {
      clearInterval(timer);
      anim.stop();
    };
  }, [isRecording, wave1, wave2, wave3, wave4]);

  const formattedTime = `00:${String(seconds).padStart(2, '0')}`;

  if (compact) {
    if (isProcessing) {
      return (
        <View style={styles.compactProcessingRow}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text variant="caption" style={{ color: colors.primary, fontWeight: '600' }}>
            Transcribing…
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.compactRow}>
        <Pressable
          style={[
            styles.compactBtn,
            isRecording && styles.compactBtnRecording,
            isError && styles.compactBtnError,
          ]}
          onPress={onToggleRecord}
          accessibilityRole="button"
          accessibilityLabel={isRecording ? 'Stop recording' : 'Record voice note'}
        >
          <Ionicons
            name={isRecording ? 'stop' : isError ? 'refresh' : 'mic'}
            size={16}
            color={isRecording ? colors.danger : isError ? colors.danger : colors.primary}
          />
          <Text
            variant="bodyStrong"
            style={[
              styles.compactBtnText,
              isRecording && styles.compactBtnTextRecording,
              isError && styles.compactBtnTextError,
            ]}
          >
            {isRecording ? `Listening ${formattedTime}` : isError ? 'Retry' : 'Voice'}
          </Text>
        </Pressable>

        {isRecording ? (
          <Pressable
            style={styles.cancelBtn}
            onPress={onCancelRecord}
            accessibilityRole="button"
            accessibilityLabel="Cancel recording"
          >
            <Text variant="caption" style={{ color: colors.textSecondary }}>
              Cancel
            </Text>
          </Pressable>
        ) : null}
      </View>
    );
  }

  if (isProcessing) {
    return (
      <View style={[styles.fullContainer, styles.fullContainerProcessing]}>
        <View style={styles.processingRow}>
          <ActivityIndicator size="small" color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text variant="bodyStrong" style={{ color: colors.primary }}>
              Transcribing audio…
            </Text>
            <Text variant="caption" color="secondary">
              Converting speech to text via Whisper AI
            </Text>
          </View>
          <Pressable style={styles.cancelActionBtn} onPress={onCancelRecord}>
            <Ionicons name="close" size={18} color={colors.textSecondary} />
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.fullContainer,
        isRecording && styles.fullContainerRecording,
        isError && styles.fullContainerError,
        isSuccess && styles.fullContainerSuccess,
      ]}
    >
      {isRecording ? (
        <View style={styles.recordingRow}>
          <View style={styles.waveWrap}>
            <Animated.View style={[styles.waveBar, { height: wave1 }]} />
            <Animated.View style={[styles.waveBar, { height: wave2 }]} />
            <Animated.View style={[styles.waveBar, { height: wave3 }]} />
            <Animated.View style={[styles.waveBar, { height: wave4 }]} />
          </View>

          <View style={{ flex: 1 }}>
            <Text variant="bodyStrong" style={{ color: colors.danger }}>
              Listening ({formattedTime})
            </Text>
            <Text variant="caption" color="secondary">
              Speak clearly into your microphone
            </Text>
          </View>

          <Pressable style={styles.stopActionBtn} onPress={onToggleRecord}>
            <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
            <Text variant="bodyStrong" style={{ color: '#FFFFFF', fontSize: 12 }}>
              Finish
            </Text>
          </Pressable>

          <Pressable style={styles.cancelActionBtn} onPress={onCancelRecord}>
            <Ionicons name="close" size={16} color={colors.textSecondary} />
          </Pressable>
        </View>
      ) : isSuccess ? (
        <View style={styles.idleBtn}>
          <View style={[styles.idleIconCircle, { backgroundColor: colors.successLight }]}>
            <Ionicons name="checkmark" size={18} color={colors.successText} />
          </View>
          <View style={{ flex: 1 }}>
            <Text variant="bodyStrong" style={{ color: colors.successText }}>
              Transcript added successfully
            </Text>
            <Text variant="caption" color="secondary">
              Tap mic to add more details
            </Text>
          </View>
        </View>
      ) : isError ? (
        <Pressable
          style={styles.idleBtn}
          onPress={onToggleRecord}
          accessibilityRole="button"
          accessibilityLabel="Retry voice recording"
        >
          <View style={[styles.idleIconCircle, { backgroundColor: colors.dangerLight }]}>
            <Ionicons name="alert-circle-outline" size={18} color={colors.danger} />
          </View>
          <View style={{ flex: 1 }}>
            <Text variant="bodyStrong" style={{ color: colors.danger }}>
              Transcription issue — Tap to retry
            </Text>
            <Text variant="caption" color="secondary" numberOfLines={1}>
              {voiceStatus || 'Could not transcribe. Tap to try again.'}
            </Text>
          </View>
          <Ionicons name="refresh" size={16} color={colors.danger} />
        </Pressable>
      ) : (
        <Pressable
          style={styles.idleBtn}
          onPress={onToggleRecord}
          accessibilityRole="button"
          accessibilityLabel="Describe issue by voice"
        >
          <View style={styles.idleIconCircle}>
            <Ionicons name="mic" size={18} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text variant="bodyStrong" style={{ color: colors.text }}>
              Describe by voice
            </Text>
            <Text variant="caption" color="secondary">
              Tap to speak your problem with local Whisper AI
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  compactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  compactProcessingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    paddingHorizontal: 10,
    height: 36,
    borderRadius: radius.sm,
  },
  compactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    paddingHorizontal: 10,
    height: 36,
    borderRadius: radius.sm,
  },
  compactBtnRecording: {
    backgroundColor: colors.dangerLight,
    borderColor: colors.dangerBorder,
  },
  compactBtnError: {
    backgroundColor: colors.dangerLight,
    borderColor: colors.dangerBorder,
  },
  compactBtnText: {
    fontSize: 12,
    color: colors.primaryDark,
  },
  compactBtnTextRecording: {
    color: colors.danger,
  },
  compactBtnTextError: {
    color: colors.danger,
  },
  cancelBtn: {
    paddingHorizontal: 8,
    height: 36,
    justifyContent: 'center',
  },
  fullContainer: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  fullContainerRecording: {
    backgroundColor: colors.dangerLight,
    borderColor: colors.dangerBorder,
  },
  fullContainerProcessing: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primaryBorder,
  },
  fullContainerError: {
    backgroundColor: colors.dangerLight,
    borderColor: colors.dangerBorder,
  },
  fullContainerSuccess: {
    backgroundColor: colors.successLight,
    borderColor: colors.successBorder,
  },
  processingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  recordingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  waveWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    height: 24,
  },
  waveBar: {
    width: 3,
    backgroundColor: colors.danger,
    borderRadius: 2,
  },
  stopActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.success,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.sm,
  },
  cancelActionBtn: {
    padding: 6,
  },
  idleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  idleIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
