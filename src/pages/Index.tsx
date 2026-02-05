import { useState } from 'react';
import { ProgressIndicator } from '@/components/ProgressIndicator';
import { BasicDetailsForm } from '@/components/BasicDetailsForm';
import { ProblemDetailsForm } from '@/components/ProblemDetailsForm';
import { SuccessScreen } from '@/components/SuccessScreen';
 import { LanguageSelector } from '@/components/LanguageSelector';
 import { useTranslation } from 'react-i18next';

interface UserDetails {
  name: string;
  phone: string;
  password: string;
}

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

const Index = () => {
   const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(1);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleBasicDetailsSubmit = (data: UserDetails) => {
    setUserDetails(data);
    setCurrentStep(2);
  };

  const handleProblemDetailsSubmit = (data: ProblemDetails) => {
    // Here you would typically send the data to your backend
    console.log('Form submitted:', {
      user: userDetails,
      problem: data,
    });
    setIsSubmitted(true);
  };

  const handleBack = () => {
    setCurrentStep(1);
  };

  const handleReset = () => {
    setCurrentStep(1);
    setUserDetails(null);
    setIsSubmitted(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-md mx-auto px-4 py-8">
        {/* Header */}
         <div className="flex items-center justify-between mb-6">
           <div className="flex items-center gap-3">
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
           <LanguageSelector />
        </div>

        {!isSubmitted && (
          <ProgressIndicator currentStep={currentStep} totalSteps={2} />
        )}

        {/* Form Container */}
        <div className="glass-card rounded-2xl p-6">
          {isSubmitted ? (
            <SuccessScreen onReset={handleReset} />
          ) : currentStep === 1 ? (
            <BasicDetailsForm onSubmit={handleBasicDetailsSubmit} />
          ) : (
            <ProblemDetailsForm
              onSubmit={handleProblemDetailsSubmit}
              onBack={handleBack}
            />
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-6">
           {t('footer.dataSecure')}
        </p>
      </div>
    </div>
  );
};

export default Index;
