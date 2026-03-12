import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProblemDetailsForm } from '@/components/ProblemDetailsForm';
import { SuccessScreen } from '@/components/SuccessScreen';
import { TopNav } from '@/components/TopNav';
import { Zap } from 'lucide-react';

import { v4 as uuid } from 'uuid';
import { saveObservationOffline } from '@/offline/saveObservation';
import { syncOperations } from '@/offline/sync';
import { syncMediaUploads } from '@/offline/syncMedia';
import { syncAI } from '@/offline/syncAI';


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

  const handleProblemDetailsSubmit = async (data: ProblemDetails) => {
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

    await saveObservationOffline(observation, data.images, data.audioBlob);

    const token = localStorage.getItem('access_token');
    if (navigator.onLine && token) {
  await syncOperations(token);
  await syncMediaUploads(token);
  await syncAI(token);
}

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