import { CheckCircle2, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SuccessScreenProps {
  onReset: () => void;
}

export const SuccessScreen = ({ onReset }: SuccessScreenProps) => {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 slide-up">
      <div className="w-20 h-20 bg-success/20 rounded-full flex items-center justify-center mb-6">
        <CheckCircle2 className="w-10 h-10 text-success" />
      </div>
      
      <h1 className="text-2xl font-bold text-foreground mb-2">
        Report Submitted!
      </h1>
      
      <p className="text-muted-foreground mb-8 max-w-sm">
        Thank you for your report. Our team will review it and take the necessary action.
      </p>

      <Button
        onClick={onReset}
        variant="outline"
        size="lg"
        className="gap-2"
      >
        <RotateCcw className="w-4 h-4" />
        Submit Another Report
      </Button>
    </div>
  );
};
