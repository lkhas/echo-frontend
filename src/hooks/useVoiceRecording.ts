import { useState, useRef, useCallback } from 'react';

interface VoiceRecordingState {
  isRecording: boolean;
  audioBlob: Blob | null;
  audioUrl: string | null;
  duration: number;
  error: string | null;
}

export const useVoiceRecording = () => {
  const [state, setState] = useState<VoiceRecordingState>({
    isRecording: false,
    audioBlob: null,
    audioUrl: null,
    duration: 0,
    error: null,
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setState(prev => ({
          ...prev,
          audioBlob: blob,
          audioUrl: url,
          isRecording: false,
        }));
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      startTimeRef.current = Date.now();

      timerRef.current = window.setInterval(() => {
        setState(prev => ({
          ...prev,
          duration: Math.floor((Date.now() - startTimeRef.current) / 1000),
        }));
      }, 1000);

      setState(prev => ({
        ...prev,
        isRecording: true,
        error: null,
        duration: 0,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: 'Could not access microphone',
      }));
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && state.isRecording) {
      mediaRecorderRef.current.stop();
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [state.isRecording]);

  const clearRecording = useCallback(() => {
    if (state.audioUrl) {
      URL.revokeObjectURL(state.audioUrl);
    }
    setState({
      isRecording: false,
      audioBlob: null,
      audioUrl: null,
      duration: 0,
      error: null,
    });
  }, [state.audioUrl]);

  return {
    ...state,
    startRecording,
    stopRecording,
    clearRecording,
  };
};
