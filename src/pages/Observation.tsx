import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProblemDetailsForm, ActivityType, AssetType } from '@/components/ProblemDetailsForm';
import { SuccessScreen } from '@/components/SuccessScreen';
import { TopNav } from '@/components/TopNav';
import { Zap } from 'lucide-react';

import { v4 as uuid } from 'uuid';
import { saveObservationOffline } from '@/offline/saveObservation';
import { runFullSync } from "@/offline/syncmanage";
import { useSyncStatus } from '@/offline/syncState';
import { Button } from '@/components/ui/button';


interface ProblemDetails {
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
}

const Observation = () => {
  const navigate = useNavigate();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // 1. Add loading state
  const syncStatus = useSyncStatus(); // "idle" | "offline" | "syncing" | "error" | "up_to_date"

  const handleProblemDetailsSubmit = async (data: ProblemDetails) => {
    setIsLoading(true); // 2. Set loading to true when user clicks submit
    const observation = {
  id: uuid(),
  title: data.title,
  narrative: data.description,
  latitude: data.location.latitude,
  longitude: data.location.longitude,
  observation_type: null,   // AI will classify later
  activity_type: data.activityType,
  asset_type: data.assetType, // null unless Activity Type is "Transect Walk"
  village_name: data.villageName,
  image_urls: [],
  audio_url: null,
  updated_at: Date.now()
};

   // 1. Save data locally (Crucial first step)
    await saveObservationOffline(observation, data.images, data.audioBlob);

    // 2. Trigger sync in the background without blocking the UI.
    // runFullSync handles operations -> media -> AI events in order, and is
    // safe to call even if App.tsx's mount/online effect is already running
    // one — they share the same in-flight run instead of racing.
    if (navigator.onLine) {
      const token = localStorage.getItem('access_token');
      if (token) {
        runFullSync(token).catch((syncError) => {
          console.error("Background sync failed:", syncError);
        });
      }
    }



    // 3. Immediately update UI state so user sees SuccessScreen
    console.log("Setting isSubmitted to true now");
    setIsSubmitted(true);
  };

  const handleReset = () => {
    setIsSubmitted(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-violet-500/[0.03] via-background to-purple-900/[0.04] pointer-events-none" />

      <TopNav />

      <div className="relative max-w-lg mx-auto px-4 py-8">
        {/* Form header */}
        {!isSubmitted && (
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-700 shadow-xl shadow-violet-500/30 mb-4">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-black text-foreground tracking-tight">New Observation</h1>
            <p className="text-sm text-muted-foreground mt-1">Submit a field report from your location</p>
          </div>
        )}

        {/* Form Container */}
        <div className="rounded-2xl border border-violet-500/15 bg-card/60 backdrop-blur-sm shadow-xl shadow-violet-500/5 overflow-hidden">
          {/* Purple top accent */}
          <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-violet-500 to-transparent" />
          
          <div className="p-6">
            {isSubmitted ? (
              <SuccessScreen onReset={handleReset} />
            ) : (
              <>
                {syncStatus === "syncing" && (
                  <div className="mb-4 flex items-center gap-2 text-xs text-violet-500">
                    <span className="h-1.5 w-1.5 rounded-full bg-violet-500 animate-pulse" />
                    Syncing your last observation…
                  </div>
                )}
                {syncStatus === "error" && (
                  <div className="mb-4 flex items-center gap-2 text-xs text-destructive">
                    <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
                    Last sync failed — will retry automatically
                  </div>
                )}
                {syncStatus === "offline" && (
                  <div className="mb-4 flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                    Offline — saved locally, will sync when back online
                  </div>
                )}
                <ProblemDetailsForm
                  onSubmit={handleProblemDetailsSubmit}
                  onBack={() => {}}
                  isLoading={isLoading} // Pass the state here
                />
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground/60 mt-6">
          🔒 Your data is encrypted and stored securely
        </p>
      </div>
    </div>
  );
};

export default Observation;