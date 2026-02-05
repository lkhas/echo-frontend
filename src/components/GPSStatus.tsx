import { MapPin, Loader2, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
 import { useTranslation } from 'react-i18next';

interface GPSStatusProps {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  isLoading: boolean;
  isAccurate: boolean;
  error: string | null;
  accuracyThreshold: number;
  onRetry: () => void;
}

export const GPSStatus = ({
  latitude,
  longitude,
  accuracy,
  isLoading,
  isAccurate,
  error,
  accuracyThreshold,
  onRetry,
}: GPSStatusProps) => {
   const { t } = useTranslation();
 
  if (error) {
    return (
      <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 fade-in">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-destructive mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-destructive">{error}</p>
            <p className="text-xs text-muted-foreground mt-1">
               {t('gps.enableLocation')}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="shrink-0"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
             {t('common.retry')}
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-accent border border-primary/20 rounded-lg p-4 fade-in">
        <div className="flex items-center gap-3">
          <div className="relative">
            <MapPin className="w-5 h-5 text-primary gps-pulse" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              <p className="text-sm font-medium text-foreground">
                 {t('gps.fetchingLocation')}
              </p>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
               {t('gps.waitForGps')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`
        border rounded-lg p-4 transition-all duration-300 fade-in
        ${isAccurate 
          ? 'bg-success/10 border-success/30' 
          : 'bg-warning/10 border-warning/30'
        }
      `}
    >
      <div className="flex items-start gap-3">
        <div className="shrink-0">
          {isAccurate ? (
            <CheckCircle2 className="w-5 h-5 text-success" />
          ) : (
            <MapPin className="w-5 h-5 text-warning gps-pulse" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium text-foreground">
               {isAccurate ? t('gps.locationAcquired') : t('gps.improvingAccuracy')}
            </span>
            {!isAccurate && (
              <Loader2 className="w-3 h-3 animate-spin text-warning" />
            )}
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
             <div className="text-muted-foreground">{t('gps.latitude')}:</div>
            <div className="font-mono text-foreground">{latitude?.toFixed(6)}</div>
             <div className="text-muted-foreground">{t('gps.longitude')}:</div>
            <div className="font-mono text-foreground">{longitude?.toFixed(6)}</div>
             <div className="text-muted-foreground">{t('gps.accuracy')}:</div>
            <div className={`font-mono ${isAccurate ? 'text-success' : 'text-warning'}`}>
              {accuracy?.toFixed(0)}m 
               {isAccurate ? ' ✓' : ` (${t('gps.needLessThan', { threshold: accuracyThreshold })})`}
            </div>
          </div>
        </div>
        {!isAccurate && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRetry}
            className="shrink-0"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
};
