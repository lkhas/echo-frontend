import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { TopNav } from '@/components/TopNav';
import { apiFetch } from '@/services/api';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getAssetCategory, getAssetCategoryColor } from '@/lib/assetTypeColors';

const TransectWalkMap = lazy(() =>
  import('@/components/dashboard/TransectWalkMap').then((m) => ({ default: m.TransectWalkMap }))
);

interface RawObservation {
  id: string;
  title: string;
  village_name: string;
  activity_type: string;
  asset_type: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  updated_at?: string;
}

const TransectWalkDashboard = () => {
  const [observations, setObservations] = useState<RawObservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVillage, setSelectedVillage] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) return;

        const data = await apiFetch<RawObservation[]>('/observations', {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        });

        // Only transect walk entries with valid coordinates matter here
        const transectOnly = data.filter(
          (obs) =>
            obs.activity_type === 'transect_walk' &&
            obs.latitude !== null &&
            obs.longitude !== null
        );

        setObservations(transectOnly);
      } catch (err) {
        console.error('Failed to load transect walk data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Village dropdown options — only villages that actually have transect walks
  const villageOptions = useMemo(() => {
    const set = new Set(observations.map((o) => o.village_name).filter(Boolean));
    return Array.from(set).sort();
  }, [observations]);

  // Date options, scoped to the selected village
  const dateOptions = useMemo(() => {
    const relevant = selectedVillage
      ? observations.filter((o) => o.village_name === selectedVillage)
      : observations;

    const dates = new Set(
      relevant.map((o) => new Date(o.created_at).toISOString().split('T')[0])
    );
    return Array.from(dates).sort().reverse(); // most recent first
  }, [observations, selectedVillage]);

  // Auto-select the most recent date whenever the village changes
  useEffect(() => {
    if (selectedVillage && dateOptions.length > 0) {
      setSelectedDate(dateOptions[0]);
    } else {
      setSelectedDate('');
    }
  }, [selectedVillage]); // eslint-disable-line react-hooks/exhaustive-deps

  // Final filtered + chronologically sorted path points
  const pathPoints = useMemo(() => {
    if (!selectedVillage || !selectedDate) return [];

    return observations
      .filter(
        (o) =>
          o.village_name === selectedVillage &&
          new Date(o.created_at).toISOString().split('T')[0] === selectedDate
      )
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      .map((o) => ({
        id: o.id,
        latitude: o.latitude as number,
        longitude: o.longitude as number,
        assetType: o.asset_type,
        title: o.title,
        createdAt: o.created_at,
      }));
  }, [observations, selectedVillage, selectedDate]);

  // Legend — unique categories present in the currently displayed path
  const legendCategories = useMemo(() => {
    const cats = new Set(pathPoints.map((p) => getAssetCategory(p.assetType)));
    return Array.from(cats).sort();
  }, [pathPoints]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 bg-gradient-to-br from-violet-500/[0.03] via-background to-purple-900/[0.04] pointer-events-none" />
      <TopNav />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        <div>
          <h1 className="text-2xl font-black text-foreground tracking-tight">Transect Walk Map</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Visualize the walking path and assets recorded during each transect walk
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="w-full sm:w-64 space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Village</label>
            <Select value={selectedVillage} onValueChange={setSelectedVillage}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Select a village" />
              </SelectTrigger>
              <SelectContent>
                {villageOptions.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-muted-foreground">No transect walks recorded</div>
                ) : (
                  villageOptions.map((v) => (
                    <SelectItem key={v} value={v}>{v}</SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="w-full sm:w-64 space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Date</label>
            <Select
              value={selectedDate}
              onValueChange={setSelectedDate}
              disabled={!selectedVillage}
            >
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder={selectedVillage ? 'Select a date' : 'Select village first'} />
              </SelectTrigger>
              <SelectContent>
                {dateOptions.map((d) => (
                  <SelectItem key={d} value={d}>
                    {new Date(d).toLocaleDateString(undefined, {
                      weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
                    })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Legend */}
        {legendCategories.length > 0 && (
          <div className="flex flex-wrap gap-3 items-center p-3 rounded-xl border border-border/50 bg-card/40">
            <span className="text-xs font-medium text-muted-foreground">Asset Type:</span>
            {legendCategories.map((cat) => (
              <div key={cat} className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: getAssetCategoryColor(cat) }}
                />
                <span className="text-xs text-foreground">{cat}</span>
              </div>
            ))}
          </div>
        )}

        {/* Map */}
        <Suspense
          fallback={
            <div className="h-[500px] rounded-2xl border border-violet-500/15 bg-card/50 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
            </div>
          }
        >
          <TransectWalkMap points={pathPoints} />
        </Suspense>

        {pathPoints.length > 0 && (
          <p className="text-xs text-muted-foreground">
            {pathPoints.length} point{pathPoints.length !== 1 ? 's' : ''} recorded on this walk, in chronological order.
          </p>
        )}
      </div>
    </div>
  );
};

export default TransectWalkDashboard;