import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProblemDetailsForm } from '@/components/ProblemDetailsForm';
import { SuccessScreen } from '@/components/SuccessScreen';

interface ProblemDetails {
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

  const handleProblemDetailsSubmit = (data: ProblemDetails) => {
    console.log('Observation submitted:', data);
    setIsSubmitted(true);
  };

  const handleReset = () => {
    setIsSubmitted(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-md mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/login')}
            className="mr-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1 flex justify-center">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <svg
                className="w-6 h-6 text-primary-foreground"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
          </div>
          <div className="w-10" /> {/* Spacer for centering */}
        </div>

        {/* Form Container */}
        <div className="glass-card rounded-2xl p-6">
          {isSubmitted ? (
            <SuccessScreen onReset={handleReset} />
          ) : (
            <ProblemDetailsForm
              onSubmit={handleProblemDetailsSubmit}
              onBack={() => {}}
            />
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          Your data is secure and will only be used to process your report
        </p>
      </div>
    </div>
  );
};

export default Observation;
