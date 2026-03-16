import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProblemDetailsForm } from '@/components/ProblemDetailsForm';
import { SuccessScreen } from '@/components/SuccessScreen';
import { TopNav } from '@/components/TopNav';
import { Zap } from 'lucide-react';

import { v4 as uuid } from 'uuid';
import { saveObservationOffline } from '@/offline/saveObservation';
import { syncOperations } from '@/offline/sync';
import { syncNarTrans } from '@/offline/syncNarTrans';
import { syncMediaUploads } from '@/offline/syncMedia';
import { syncAI } from '@/offline/syncAI';
import { processAIEvents } from '@/offline/syncAIEvents';
import { Button } from '@/components/ui/button';


interface ProblemDetails {
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
}

const Observation = () => {
  const navigate = useNavigate();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // 1. Add loading state

  const handleProblemDetailsSubmit = async (data: ProblemDetails) => {
    setIsLoading(true); // 2. Set loading to true when user clicks submit
    const observation = {
  id: uuid(),
  title: data.title,
  narrative: data.description,
  latitude: data.location.latitude,
  longitude: data.location.longitude,
  observation_type: null,   // AI will classify later
  village_name: data.villageName,
  image_urls: [],
  audio_url: null,
  updated_at: Date.now()
};

   // 1. Save data locally (Crucial first step)
    await saveObservationOffline(observation, data.images, data.audioBlob);

    // 2. Trigger sync in the background without blocking the UI
    // We use a self-invoking async function or simply don't 'await' the syncs 
    // to ensure the user gets immediate feedback.
   if (navigator.onLine) {
  const token = localStorage.getItem('access_token');
  if (token) {
    (async () => {
      try {
        // 1. First, make sure the observation is created in the DB
        await syncOperations(token);
        
        // 2. Then, upload any associated images or audio
        await syncMediaUploads(token);
        
        // 3. Finally, trigger the AI processing (Transcribe -> Translate -> VIM)
        // Now it won't 404 because Step 1 is guaranteed to be finished!
        await processAIEvents(token);
        
        console.log("Background sync finished successfully");
      } catch (syncError) {
        console.error("Background sync failed:", syncError);
      }
    })();
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
              <ProblemDetailsForm
                onSubmit={handleProblemDetailsSubmit}
                onBack={() => {}}
                isLoading={isLoading} // Pass the state here
              />
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