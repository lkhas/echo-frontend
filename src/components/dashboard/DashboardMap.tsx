import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import { Badge } from '@/components/ui/badge';
import { MediaPreviewDialog } from './MediaPreviewDialog';
import { Camera, Volume2, Eye, ExternalLink, MapPin } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface Observation {
  id: string;
  latitude: number;
  longitude: number;
  observationType: string;
  villageName: string;
  description: string;
  imageCount: number;
  imageUrls: string[];
  hasAudio: boolean;
  audioUrl?: string;
  createdAt: string;
  [key: string]: any;
}

interface DashboardMapProps {
  observations: Observation[];
}

const typeColorMap: Record<string, string> = {
  environmental: '#10b981',
  social: '#8b5cf6',
  health: '#f43f5e',
  infrastructure: '#f59e0b',
  education: '#0ea5e9',
};

// Fits map to all markers automatically — no manual zoom needed
const FitBounds = ({ observations }: { observations: Observation[] }) => {
  const map = useMap();
  const fittedRef = useRef(false);

  useEffect(() => {
    if (observations.length === 0) return;

    setTimeout(() => {
      map.invalidateSize();

      if (observations.length === 1) {
        map.setView([observations[0].latitude, observations[0].longitude], 14, { animate: true });
      } else {
        const bounds = L.latLngBounds(
          observations.map((o) => [o.latitude, o.longitude] as [number, number])
        );
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14, animate: true });
      }

      fittedRef.current = true;
    }, 150);
  }, [observations, map]);

  return null;
};

export const DashboardMap = ({ observations }: DashboardMapProps) => {
  const navigate = useNavigate();
  const [selectedObs, setSelectedObs] = useState<Observation | null>(null);

  const validObservations = observations.filter(
    (obs) =>
      obs &&
      typeof obs.latitude === 'number' &&
      typeof obs.longitude === 'number' &&
      !isNaN(obs.latitude) &&
      !isNaN(obs.longitude)
  );

  // India center as initial placeholder before data loads
  const INDIA_CENTER: [number, number] = [20.5937, 78.9629];

  return (
    <>
      <div className="rounded-2xl overflow-hidden border border-violet-500/15 bg-card/50 backdrop-blur-sm shadow-sm slide-up">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-border/40 bg-gradient-to-r from-violet-500/8 to-transparent flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-violet-500/12 border border-violet-500/20">
              <MapPin className="w-3.5 h-3.5 text-violet-500" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground leading-none">Field Map</h2>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {validObservations.length} mapped location{validObservations.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-3">
            {Object.entries(typeColorMap).map(([type, color]) => (
              <div key={type} className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                <span className="capitalize">{type}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="h-[380px] w-full relative" style={{ zIndex: 0 }}>
          <MapContainer
            center={INDIA_CENTER}
            zoom={5}
            scrollWheelZoom={true}
            style={{ height: '100%', width: '100%' }}
          >
            {/* Auto-fit to markers whenever observations change */}
            <FitBounds observations={validObservations} />

            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />

            {validObservations.map((obs) => {
              const color = typeColorMap[obs.observationType?.toLowerCase()] || '#7c3aed';
              return (
                <CircleMarker
                  key={obs.id}
                  center={[obs.latitude, obs.longitude]}
                  radius={9}
                  pathOptions={{
                    fillColor: color,
                    color: 'white',
                    weight: 2.5,
                    fillOpacity: 0.85,
                  }}
                >
                  <Popup minWidth={220} autoPan={true}>
                    <div className="p-1 min-w-[200px]">
                      <div className="flex justify-between items-start mb-2.5">
                        <Badge
                          variant="outline"
                          className="capitalize text-[10px] font-medium border-0"
                          style={{ background: `${color}18`, color }}
                        >
                          ● {obs.observationType}
                        </Badge>
                        <span className="text-[10px] text-gray-400">
                          {new Date(obs.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>

                      <h4 className="font-bold text-sm text-gray-900 dark:text-white mb-1">{obs.villageName}</h4>
                      <p className="text-xs text-gray-500 line-clamp-2 mb-3 leading-relaxed">{obs.description}</p>

                      {(obs.imageCount > 0 || obs.hasAudio) && (
                        <div className="flex items-center gap-3 mb-3 pb-3 border-b border-gray-100">
                          {obs.imageCount > 0 && (
                            <div className="flex items-center gap-1 text-[10px] text-gray-400">
                              <Camera className="w-3 h-3" /> {obs.imageCount} photo{obs.imageCount !== 1 ? 's' : ''}
                            </div>
                          )}
                          {obs.hasAudio && (
                            <div className="flex items-center gap-1 text-[10px] text-gray-400">
                              <Volume2 className="w-3 h-3" /> Audio
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex flex-col gap-1.5">
                        {(obs.imageCount > 0 || obs.hasAudio) && (
                          <button
                            onClick={() => setSelectedObs(obs)}
                            className="flex items-center gap-1.5 text-xs font-semibold text-violet-600 hover:text-violet-500 transition-colors"
                          >
                            <Eye className="w-3 h-3" /> View Media
                          </button>
                        )}
                        <button
                          onClick={() => navigate(`/observation/${obs.id}`)}
                          className="flex items-center gap-1.5 text-xs font-semibold text-violet-600 hover:text-violet-500 transition-colors"
                        >
                          <ExternalLink className="w-3 h-3" /> Full Details
                        </button>
                      </div>
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}
          </MapContainer>
        </div>

        {/* Mobile legend */}
        <div className="sm:hidden p-3 border-t border-border/30 flex flex-wrap gap-2">
          {Object.entries(typeColorMap).map(([type, color]) => (
            <div key={type} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
              <span className="capitalize">{type}</span>
            </div>
          ))}
        </div>
      </div>

      {selectedObs && (
        <MediaPreviewDialog
          open={!!selectedObs}
          onOpenChange={(open) => !open && setSelectedObs(null)}
          images={selectedObs.imageUrls}
          audioUrl={selectedObs.audioUrl}
          title={`${selectedObs.villageName} — ${selectedObs.observationType}`}
        />
      )}
    </>
  );
};