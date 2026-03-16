import { useEffect, useState } from 'react';
import { Send, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { GPSStatus } from './GPSStatus';
import { MapPreview } from './MapPreview';
import { VoiceRecorder } from './VoiceRecorder';
import { ImageUploader } from './ImageUploader';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useVoiceRecording } from '@/hooks/useVoiceRecording';

interface ProblemDetailsFormProps {
  onSubmit: (data: {
    title: string;
    villageName: string;
    description: string;
    audioBlob: Blob | null;
    images: File[];
    location: {
      latitude: number;
      longitude: number;
      accuracy: number;
    };
  }) => void;
  onBack: () => void;
  isLoading: boolean; // Add this line
}

export const ProblemDetailsForm = ({ onSubmit, onBack ,isLoading }: ProblemDetailsFormProps) => {

  const [title, setTitle] = useState('');
  const [villageName, setVillageName] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<File[]>([]);

  const {
    latitude,
    longitude,
    accuracy,
    isLoading: isGpsLoading,
    isAccurate,
    error: gpsError,
    startWatching,
    retry,
    accuracyThreshold,
  } = useGeolocation();

  const {
    isRecording,
    audioBlob,
    audioUrl,
    duration,
    error: recordingError,
    startRecording,
    stopRecording,
    clearRecording,
  } = useVoiceRecording();

  useEffect(() => {
    startWatching();
  }, [startWatching]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAccurate || latitude === null || longitude === null || accuracy === null || !title) {
      return;
    }

    onSubmit({
      title,
      villageName,
      description,
      audioBlob,
      images,
      location: {
        latitude,
        longitude,
        accuracy,
      },
    });
  };

  const canSubmit = isAccurate && !isGpsLoading && !gpsError && !!title;

  return (
    <form onSubmit={handleSubmit} className="space-y-6 slide-up">

      <div className="flex items-center gap-3 mb-6">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="shrink-0"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>

        <div>
          <h1 className="text-xl font-bold text-foreground">
            Describe the Problem
          </h1>
          <p className="text-sm text-muted-foreground">
            Provide details using text, voice, or images
          </p>
        </div>
      </div>

      <div className="space-y-5">

        {/* GPS Status */}
        <GPSStatus
          latitude={latitude}
          longitude={longitude}
          accuracy={accuracy}
          isLoading={isGpsLoading}
          isAccurate={isAccurate}
          error={gpsError}
          accuracyThreshold={accuracyThreshold}
          onRetry={retry}
        />

        {/* Map Preview */}
        {!gpsError && (
          <MapPreview
            latitude={latitude}
            longitude={longitude}
            accuracy={accuracy}
            isLoading={isGpsLoading}
            isAccurate={isAccurate}
          />
        )}

        {/* Title (MANDATORY) */}
        <div className="space-y-2">
          <Label htmlFor="title" className="text-sm font-medium">
            Title <span className="text-destructive">*</span>
          </Label>

          <Input
            id="title"
            placeholder="Enter a short title for the observation..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        {/* Village Name */}
        <div className="space-y-2">
          <Label htmlFor="villageName" className="text-sm font-medium">
            Village Name <span className="text-muted-foreground font-normal"></span>
          </Label>

          <Input
            id="villageName"
            placeholder="Enter village name..."
            value={villageName}
            onChange={(e) => setVillageName(e.target.value)}
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description" className="text-sm font-medium">
            Problem Description <span className="text-muted-foreground font-normal"></span>
          </Label>

          <Textarea
            id="description"
            placeholder="Describe the issue you're reporting..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={6}
            required
            className="resize-none"
          />
        </div>

        {/* Voice Recorder */}
        <VoiceRecorder
          isRecording={isRecording}
          audioUrl={audioUrl}
          duration={duration}
          error={recordingError}
          onStartRecording={startRecording}
          onStopRecording={stopRecording}
          onClearRecording={clearRecording}
        />

        {/* Image Uploader */}
        <ImageUploader
          images={images}
          onImagesChange={setImages}
        />

      </div>

      <Button
        type="submit"
        className="w-full h-12 text-base font-semibold shadow-lg shadow-primary/25"
        disabled={!canSubmit}
      >
        <Send className="w-5 h-5 mr-2" />
        Submit Report
      </Button>

      {!canSubmit && !gpsError && (
        <p className="text-xs text-center text-muted-foreground">
          Waiting for accurate GPS location and title before submission...
        </p>
      )}

    </form>
  );
};