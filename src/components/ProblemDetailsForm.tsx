import { useEffect, useState } from 'react';
import { Send, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { GPSStatus } from './GPSStatus';
import { MapPreview } from './MapPreview';
import { VoiceRecorder } from './VoiceRecorder';
import { ImageUploader } from './ImageUploader';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useVoiceRecording } from '@/hooks/useVoiceRecording';

export type ActivityType = 'transect_walk' | 'observation_notes';

// Asset Type list (source: List_of_Assets_expert_standardized.xlsx)
export const ASSET_TYPES = [
  'Agriculture - Animal farm',
  'Agriculture - Cultivated land',
  'Agriculture - Grazing land',
  'Agriculture - Open field',
  'Community Facilities - Community hall',
  'Community Facilities - Computer centre',
  'Drainage - Piped sewer system',
  'Drainage - Wastewater discharged to farmland',
  'Drainage - Wastewater discharged to open street',
  'Drainage - Wastewater discharged to river',
  'Education - Anganwadi',
  'Education - Primary school (Grades 1–5)',
  'Education - Upper primary school (Grades 6–8)',
  'Education - High school (Grades 9–10)',
  'Education - Higher secondary school (Grades 11–12)',
  'Education - Primary and upper primary school (Grades 1–8)',
  'Education - Primary to high school (Grades 1–10)',
  'Education - Primary to higher secondary school (Grades 1–12)',
  'Education - Upper primary to high school (Grades 6–10)',
  'Education - High school and higher secondary school (Grades 9–12)',
  'Education - College',
  'Emergency Services - Fire station',
  'Emergency Services - Police station',
  'Energy - Solar power unit',
  'Financial Services - Bank',
  'Governance - Government office',
  'Governance - Local self-government body',
  'Governance - Political party office',
  'Governance - Village office',
  'Health Care - Community Health Centre (CHC)',
  'Health Care - Primary Health Centre (PHC)',
  'Health Care - Private clinic',
  'Health Care - Private hospital',
  'Housing - Construction material',
  'Industry - Factory',
  'Livelihood - Tailoring unit',
  'Natural Resources - Forest area',
  'Natural Resources - Marine resources',
  'Other - Other asset',
  'Public Services - Post office',
  'Recreation - Playground',
  'Religious Places - Church',
  'Religious Places - Mosque',
  'Religious Places - Temple',
  'Retail - General store',
  'Retail - Other retail store',
  'Retail - Public market',
  'Retail - Tea shop',
  'Retail - Vegetable shop',
  'Sanitation - Ammachi Labs toilet',
  'Sanitation - Toilet',
  'Tourism - Hotel',
  'Tourism - Tourist attraction',
  'Transport - Bridge',
  'Transport - Bus waiting area',
  'Transport - Railway',
  'Transport - Road',
  'Transect Walk - Start point',
  'Transect Walk - End point',
  'Utilities - Electricity office',
  'Utilities - Street light',
  'Water Bodies - Canal',
  'Water Bodies - Pond',
  'Water Bodies - River',
  'Water Sources - Borewell',
  'Water Sources - Other water source',
  'Water Sources - Rainwater harvesting system',
  'Water Sources - Tubewell',
  'Water Sources - Well',
  'Water Supply Infrastructure - Water purifier',
  'Water Supply Infrastructure - Water storage tank',
  'Water Supply Infrastructure - Water tap',
  'Water Supply Infrastructure - Water treatment plant',
] as const;

export type AssetType = typeof ASSET_TYPES[number];

interface ProblemDetailsFormProps {
  onSubmit: (data: {
    title: string;
    villageName: string;
    description: string;
    activityType: ActivityType;
    assetType: AssetType | null;
    audioBlob: Blob | null;
    images: File[];
    location: {
      latitude: number;
      longitude: number;
      accuracy: number;
    };
  }) => void;
  onBack: () => void;
  isLoading: boolean;
}

export const ProblemDetailsForm = ({ onSubmit, onBack, isLoading }: ProblemDetailsFormProps) => {

  const [title, setTitle] = useState('');
  const [activityType, setActivityType] = useState<ActivityType>('observation_notes');
  const [assetType, setAssetType] = useState<AssetType | ''>('');
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

  // Reset Asset Type whenever Activity Type moves away from "Transect Walk"
  useEffect(() => {
    if (activityType !== 'transect_walk') {
      setAssetType('');
    }
  }, [activityType]);

  const isAssetTypeRequired = activityType === 'transect_walk';
  const isAssetTypeValid = !isAssetTypeRequired || !!assetType;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !isAccurate ||
      latitude === null ||
      longitude === null ||
      accuracy === null ||
      !title ||
      !isAssetTypeValid
    ) {
      return;
    }

    onSubmit({
      title,
      villageName,
      description,
      activityType,
      assetType: isAssetTypeRequired ? (assetType as AssetType) : null,
      audioBlob,
      images,
      location: {
        latitude,
        longitude,
        accuracy,
      },
    });
  };

  const canSubmit = isAccurate && !isGpsLoading && !gpsError && !!title && isAssetTypeValid;

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

        {/* Activity Type */}
        <div className="space-y-2">
          <Label htmlFor="activityType" className="text-sm font-medium">
            Activity Type <span className="text-destructive">*</span>
          </Label>

          <Select
            value={activityType}
            onValueChange={(value) => setActivityType(value as ActivityType)}
          >
            <SelectTrigger id="activityType">
              <SelectValue placeholder="Select activity type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="transect_walk">Transect Walk</SelectItem>
              <SelectItem value="observation_notes">Observation Notes</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Asset Type - only visible & mandatory for Transect Walk */}
        {isAssetTypeRequired && (
          <div className="space-y-2">
            <Label htmlFor="assetType" className="text-sm font-medium">
              Asset Type <span className="text-destructive">*</span>
            </Label>

            <Select
              value={assetType}
              onValueChange={(value) => setAssetType(value as AssetType)}
            >
              <SelectTrigger id="assetType">
                <SelectValue placeholder="Select asset type" />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {ASSET_TYPES.map((asset) => (
                  <SelectItem key={asset} value={asset}>
                    {asset}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

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
          {!isAssetTypeValid
            ? 'Please select an Asset Type to continue...'
            : 'Waiting for accurate GPS location and title before submission...'}
        </p>
      )}

    </form>
  );
};