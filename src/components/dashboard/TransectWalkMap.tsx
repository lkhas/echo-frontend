import { useMemo, useState } from 'react';
import { useTheme } from 'next-themes';
import {
  GoogleMap,
  Marker,
  Polyline,
  InfoWindow,
  useJsApiLoader,
} from '@react-google-maps/api';
import { getAssetCategoryColor, getAssetCategory } from '@/lib/assetTypeColors';
import { silverMapStyle, darkMapStyle } from '@/lib/mapStyle';
import { Loader2, Map as MapIcon, Mountain, Satellite } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface TransectPoint {
  id: string;
  latitude: number;
  longitude: number;
  assetType: string | null;
  title: string;
  createdAt: string;
}

interface TransectWalkMapProps {
  points: TransectPoint[];
}

const containerStyle = { width: '100%', height: '100%' };

type MapTypeOption = 'roadmap' | 'hybrid' | 'terrain';

const MAP_TYPE_OPTIONS: { value: MapTypeOption; label: string; icon: typeof MapIcon }[] = [
  { value: 'roadmap', label: 'Map', icon: MapIcon },
  { value: 'hybrid', label: 'Hybrid', icon: Satellite },
  { value: 'terrain', label: 'Terrain', icon: Mountain },
];

function buildPinIcon(color: string, label: string): google.maps.Icon {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="34" height="42" viewBox="0 0 34 42">
      <path d="M17 0C7.6 0 0 7.6 0 17c0 12.7 17 25 17 25s17-12.3 17-25C34 7.6 26.4 0 17 0z"
            fill="${color}" stroke="white" stroke-width="2"/>
      <circle cx="17" cy="17" r="10" fill="white"/>
      <text x="17" y="21" font-size="11" font-weight="700" text-anchor="middle" fill="${color}" font-family="Arial, sans-serif">${label}</text>
    </svg>
  `;
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: typeof google !== 'undefined' ? new google.maps.Size(34, 42) : undefined,
    anchor: typeof google !== 'undefined' ? new google.maps.Point(17, 42) : undefined,
  } as google.maps.Icon;
}

export const TransectWalkMap = ({ points }: TransectWalkMapProps) => {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string,
  });

  const { resolvedTheme } = useTheme();
  const [activePoint, setActivePoint] = useState<TransectPoint | null>(null);
  const [mapType, setMapType] = useState<MapTypeOption>('hybrid'); // NEW — default to Hybrid, most useful for field work

  // Custom dark/light styles only take effect on 'roadmap' — Google ignores
  // custom styles on satellite-based types (hybrid/terrain/satellite).
  const mapStyle = mapType === 'roadmap' ? (resolvedTheme === 'dark' ? darkMapStyle : silverMapStyle) : undefined;

  const center = useMemo(
    () => (points.length > 0 ? { lat: points[0].latitude, lng: points[0].longitude } : { lat: 20.5937, lng: 78.9629 }),
    [points]
  );

  if (!isLoaded) {
    return (
      <div className="h-[500px] rounded-2xl border border-violet-500/15 bg-card/50 flex items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin text-violet-500" />
        <span className="text-sm font-medium">Loading map…</span>
      </div>
    );
  }

  if (points.length === 0) {
    return (
      <div className="h-[500px] rounded-2xl border border-violet-500/15 bg-card/50 flex items-center justify-center text-muted-foreground text-sm">
        Select a village and date to view the walking path.
      </div>
    );
  }

  return (
    <div className="relative h-[500px] rounded-2xl overflow-hidden border border-violet-500/15 shadow-xl shadow-violet-500/5">
      {/* NEW — Map type toggle, floats over the map top-left */}
      <div className="absolute top-3 left-3 z-10 flex gap-1 p-1 rounded-xl bg-background/90 backdrop-blur-sm border border-border/60 shadow-lg">
        {MAP_TYPE_OPTIONS.map(({ value, label, icon: Icon }) => (
          <Button
            key={value}
            type="button"
            size="sm"
            variant={mapType === value ? 'default' : 'ghost'}
            className="h-8 px-2.5 gap-1.5 rounded-lg text-xs"
            onClick={() => setMapType(value)}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </Button>
        ))}
      </div>

      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={17}
        mapTypeId={mapType} // NEW
        options={{
          styles: mapStyle,
          disableDefaultUI: false,
          zoomControl: true,
          streetViewControl: false,
          mapTypeControl: false, // keep off — we use our own custom toggle above
          fullscreenControl: true,
        }}
      >
        {points.slice(1).map((point, i) => {
          const prev = points[i];
          return (
            <Polyline
              key={`${prev.id}-${point.id}`}
              path={[
                { lat: prev.latitude, lng: prev.longitude },
                { lat: point.latitude, lng: point.longitude },
              ]}
              options={{
                strokeColor: getAssetCategoryColor(point.assetType),
                strokeOpacity: 0.9,
                strokeWeight: 4,
                geodesic: true,
                icons: [
                  {
                    icon: { path: 'M 0,-1 0,1', strokeOpacity: 1, scale: 3 },
                    offset: '0',
                    repeat: '14px',
                  },
                ],
              }}
            />
          );
        })}

        {points.map((point, idx) => (
          <Marker
            key={point.id}
            position={{ lat: point.latitude, lng: point.longitude }}
            icon={buildPinIcon(getAssetCategoryColor(point.assetType), String(idx + 1))}
            onClick={() => setActivePoint(point)}
          />
        ))}

        {activePoint && (
          <InfoWindow
            position={{ lat: activePoint.latitude, lng: activePoint.longitude }}
            onCloseClick={() => setActivePoint(null)}
          >
            <div className="text-sm space-y-1 min-w-[180px]">
              <p className="font-semibold text-foreground">{activePoint.title}</p>
              <p className="text-muted-foreground">
                {getAssetCategory(activePoint.assetType)}
                {activePoint.assetType ? ` — ${activePoint.assetType.split(' - ')[1] || ''}` : ''}
              </p>
              <p className="text-xs text-muted-foreground">
                {new Date(activePoint.createdAt).toLocaleTimeString()}
              </p>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  );
};