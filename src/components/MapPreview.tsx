import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Icon } from 'leaflet';
import { MapPin, Loader2 } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
 import { useTranslation } from 'react-i18next';

// Fix for default marker icon in Leaflet with bundlers
const customIcon = new Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface MapPreviewProps {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  isLoading: boolean;
  isAccurate: boolean;
}

export const MapPreview = ({
  latitude,
  longitude,
  accuracy,
  isLoading,
  isAccurate,
}: MapPreviewProps) => {
   const { t } = useTranslation();
 
  // Don't show map if no coordinates yet
  if (latitude === null || longitude === null) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-muted-foreground" />
           <span className="text-sm font-medium text-foreground">{t('map.locationPreview')}</span>
        </div>
        <div className="relative h-40 bg-muted rounded-lg border border-border overflow-hidden flex items-center justify-center">
          {isLoading ? (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin" />
               <span className="text-xs">{t('map.waitingForLocation')}</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <MapPin className="w-6 h-6" />
               <span className="text-xs">{t('map.noLocation')}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-primary" />
           <span className="text-sm font-medium text-foreground">{t('map.locationPreview')}</span>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full ${
          isAccurate 
            ? 'bg-success/20 text-success' 
            : 'bg-warning/20 text-warning'
        }`}>
           {isAccurate ? t('map.accurate') : t('map.lowAccuracy')}
        </span>
      </div>
      <div className="relative h-40 rounded-lg border border-border overflow-hidden">
        <MapContainer
          center={[latitude, longitude]}
          zoom={16}
          scrollWheelZoom={false}
          dragging={false}
          zoomControl={false}
          attributionControl={false}
          style={{ height: '100%', width: '100%' }}
          key={`${latitude}-${longitude}`}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={[latitude, longitude]} icon={customIcon}>
            <Popup>
               {t('map.yourLocation')}<br />
               {t('gps.accuracy')}: {accuracy?.toFixed(0)}m
            </Popup>
          </Marker>
        </MapContainer>
        {!isAccurate && (
          <div className="absolute bottom-2 left-2 right-2 bg-warning/90 text-warning-foreground text-xs px-2 py-1 rounded text-center">
             {t('map.gpsImproving')}
          </div>
        )}
      </div>
    </div>
  );
};
