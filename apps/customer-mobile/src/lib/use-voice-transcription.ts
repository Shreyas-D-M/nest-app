import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiRequestError, transcribeAudio } from './api';

export type VoiceUiState = 'idle' | 'recording' | 'processing' | 'success' | 'error';

type Options = {
  onTranscript: (transcript: string) => void;
  onError: (title: string, message: string) => void;
};

/** Owns a recording session so stale Audio/fetch callbacks cannot revive it. */
export function useVoiceTranscription({ onTranscript, onError }: Options) {
  const [voiceUiState, setVoiceUiState] = useState<VoiceUiState>('idle');
  const [voiceStatus, setVoiceStatus] = useState('Tap to speak');
  const recordingRef = useRef<Audio.Recording | null>(null);
  const transcriptionRef = useRef<AbortController | null>(null);
  const sessionRef = useRef(0);
  const mountedRef = useRef(true);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const reset = useCallback((state: VoiceUiState = 'idle', status = 'Tap to speak') => {
    if (!mountedRef.current) return;
    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current);
      resetTimerRef.current = null;
    }
    setVoiceUiState(state);
    setVoiceStatus(status);
  }, []);

  const stopListening = useCallback(async () => {
    sessionRef.current += 1;
    transcriptionRef.current?.abort();
    transcriptionRef.current = null;
    const recording = recordingRef.current;
    recordingRef.current = null;
    if (recording) {
      await recording.stopAndUnloadAsync().catch(() => undefined);
    }
    reset('idle', 'Tap to speak');
  }, [reset]);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      sessionRef.current += 1;
      if (resetTimerRef.current) {
        clearTimeout(resetTimerRef.current);
      }
      transcriptionRef.current?.abort();
      const recording = recordingRef.current;
      recordingRef.current = null;
      if (recording) void recording.stopAndUnloadAsync().catch(() => undefined);
    };
  }, []);

  const reportError = useCallback(
    async (error: unknown) => {
      const recording = recordingRef.current;
      recordingRef.current = null;
      transcriptionRef.current?.abort();
      transcriptionRef.current = null;
      if (recording) await recording.stopAndUnloadAsync().catch(() => undefined);

      const auth = error instanceof ApiRequestError && error.status === 401;
      const unavailable = error instanceof ApiRequestError && error.status === 503;
      const message = auth
        ? 'Your session has expired. Please sign in again, then try voice input.'
        : unavailable
          ? 'Voice transcription is unavailable right now. You can type your request instead.'
          : error instanceof Error && error.message
            ? error.message
            : "We couldn't transcribe that recording. Please try again or type your request.";

      reset('error', message);
      onError(auth ? 'Sign in required' : 'Voice unavailable', message);

      // Auto-reset back to idle after 4 seconds so the user can easily retry
      resetTimerRef.current = setTimeout(() => {
        if (mountedRef.current) {
          reset('idle', 'Tap to speak');
        }
      }, 4000);
    },
    [onError, reset],
  );

  const startRecording = useCallback(async () => {
    const session = ++sessionRef.current;
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (session !== sessionRef.current) return;
      if (permission.status !== 'granted') {
        reset('error', 'Microphone permission is required for voice input.');
        onError('Microphone permission required', 'Please enable microphone access in settings to describe issues by voice.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        interruptionModeIOS: InterruptionModeIOS.MixWithOthers,
        interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
        shouldDuckAndroid: true,
        staysActiveInBackground: false,
        playThroughEarpieceAndroid: false,
      });

      if (session !== sessionRef.current) return;

      const recording = new Audio.Recording();
      recording.setOnRecordingStatusUpdate((status) => {
        if (session === sessionRef.current && recordingRef.current === recording && status.isRecording) {
          reset('recording', 'Listening…');
        }
      });

      await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      if (session !== sessionRef.current) {
        await recording.stopAndUnloadAsync().catch(() => undefined);
        return;
      }

      await recording.startAsync();
      if (session !== sessionRef.current) {
        await recording.stopAndUnloadAsync().catch(() => undefined);
        return;
      }

      recordingRef.current = recording;
      reset('recording', 'Listening…');
    } catch (error) {
      if (session === sessionRef.current) await reportError(error);
    }
  }, [onError, reportError, reset]);

  const finishAndTranscribe = useCallback(async () => {
    const recording = recordingRef.current;
    if (!recording) return;
    const session = ++sessionRef.current;
    recordingRef.current = null;
    reset('processing', 'Transcribing…');

    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      if (!uri) throw new Error('Recording URI unavailable');

      const controller = new AbortController();
      transcriptionRef.current = controller;

      const { transcript } = await transcribeAudio(uri, controller.signal);
      if (session !== sessionRef.current || controller.signal.aborted) return;
      transcriptionRef.current = null;

      onTranscript(transcript.trim());
      reset('success', 'Transcript added');

      // Reset to idle after success so user can record more if desired
      resetTimerRef.current = setTimeout(() => {
        if (mountedRef.current) {
          reset('idle', 'Tap to speak');
        }
      }, 2500);
    } catch (error) {
      if (session !== sessionRef.current) return;
      if (error instanceof Error && error.name === 'AbortError') {
        reset('idle', 'Tap to speak');
        return;
      }
      await reportError(error);
    }
  }, [onTranscript, reportError, reset]);

  const toggleVoice = useCallback(() => {
    if (voiceUiState === 'recording') return finishAndTranscribe();
    if (voiceUiState !== 'processing') return startRecording();
  }, [finishAndTranscribe, startRecording, voiceUiState]);

  return {
    voiceUiState,
    voiceStatus,
    isRecording: voiceUiState === 'recording',
    isProcessing: voiceUiState === 'processing',
    toggleVoice,
    stopListening,
  };
}
