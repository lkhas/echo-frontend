import { Mic, Square, Play, Pause, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useRef } from 'react';

interface VoiceRecorderProps {
  isRecording: boolean;
  audioUrl: string | null;
  duration: number;
  error: string | null;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onClearRecording: () => void;
}

export const VoiceRecorder = ({
  isRecording,
  audioUrl,
  duration,
  error,
  onStartRecording,
  onStopRecording,
  onClearRecording,
}: VoiceRecorderProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const togglePlayback = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
  };

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-foreground">Voice Recording</label>
      
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}

      {!audioUrl ? (
        <div className="flex flex-col items-center gap-4 p-6 bg-muted/50 rounded-lg border border-dashed border-border">
          <Button
            type="button"
            variant={isRecording ? "destructive" : "default"}
            size="lg"
            className={`w-16 h-16 rounded-full ${isRecording ? 'animate-pulse' : ''}`}
            onClick={isRecording ? onStopRecording : onStartRecording}
          >
            {isRecording ? (
              <Square className="w-6 h-6" />
            ) : (
              <Mic className="w-6 h-6" />
            )}
          </Button>
          <div className="text-center">
            {isRecording ? (
              <>
                <p className="text-sm font-medium text-destructive">Recording...</p>
                <p className="text-2xl font-mono text-foreground mt-1">{formatTime(duration)}</p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Tap to start recording</p>
            )}
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 p-4 bg-success/10 border border-success/30 rounded-lg">
          <audio
            ref={audioRef}
            src={audioUrl}
            onEnded={handleAudioEnded}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={togglePlayback}
            className="shrink-0"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4" />
            )}
          </Button>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">Recording saved</p>
            <p className="text-xs text-muted-foreground">{formatTime(duration)}</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClearRecording}
            className="shrink-0 text-destructive hover:text-destructive"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
};
