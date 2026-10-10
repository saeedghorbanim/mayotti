import { useState, useRef, useCallback } from 'react';
import { aiRequestHeaders, functionUrl } from '@/lib/aiRequest';

interface UseVoiceRecordingOptions {
  onTranscription?: (text: string) => void;
  onError?: (error: string) => void;
}

export const useVoiceRecording = ({ onTranscription, onError }: UseVoiceRecordingOptions = {}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async () => {
    let stream: MediaStream | null = null;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        stream?.getTracks().forEach(track => track.stop());

        setIsProcessing(true);
        try {
          // Convert to base64
          const reader = new FileReader();
          reader.onloadend = async () => {
            try {
              const base64Audio = (reader.result as string).split(',')[1];

              // Send to transcription endpoint
              const response = await fetch(functionUrl('transcribe'), {
                method: 'POST',
                headers: await aiRequestHeaders(),
                body: JSON.stringify({ audio: base64Audio }),
              });

              if (response.status === 429) {
                onError?.("You've reached this month's voice limit. Try typing instead.");
                return;
              }
              if (!response.ok) {
                throw new Error('Transcription failed');
              }

              const data = await response.json();
              if (data.text) {
                onTranscription?.(data.text);
              }
            } catch (error) {
              console.error('Transcription error:', error);
              onError?.('Failed to transcribe audio');
            } finally {
              setIsProcessing(false);
            }
          };
          reader.readAsDataURL(audioBlob);
        } catch (error) {
          console.error('Transcription error:', error);
          onError?.('Failed to transcribe audio');
          setIsProcessing(false);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Recording error:', error);
      stream?.getTracks().forEach(track => track.stop());
      onError?.('Could not access microphone');
    }
  }, [onTranscription, onError]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  return {
    isRecording,
    isProcessing,
    startRecording,
    stopRecording,
  };
};
