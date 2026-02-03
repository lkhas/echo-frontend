import { Check } from 'lucide-react';

interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

export const ProgressIndicator = ({ currentStep, totalSteps }: ProgressIndicatorProps) => {
  return (
    <div className="flex items-center justify-center gap-3 mb-8">
      {Array.from({ length: totalSteps }).map((_, index) => {
        const stepNumber = index + 1;
        const isCompleted = stepNumber < currentStep;
        const isCurrent = stepNumber === currentStep;

        return (
          <div key={stepNumber} className="flex items-center gap-3">
            <div
              className={`
                w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold
                transition-all duration-300
                ${isCompleted 
                  ? 'bg-success text-success-foreground' 
                  : isCurrent 
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30' 
                    : 'bg-muted text-muted-foreground'
                }
              `}
            >
              {isCompleted ? <Check className="w-5 h-5" /> : stepNumber}
            </div>
            {stepNumber < totalSteps && (
              <div 
                className={`
                  w-12 h-1 rounded-full transition-all duration-300
                  ${isCompleted ? 'bg-success' : 'bg-muted'}
                `}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};
