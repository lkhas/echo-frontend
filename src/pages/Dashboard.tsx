import { lazy, Suspense, useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Download, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatsCards } from '@/components/dashboard/StatsCards';
import { ObservationTable } from '@/components/dashboard/ObservationTable';
import { AnalyticsCharts } from '@/components/dashboard/AnalyticsCharts';
import { DashboardFilters } from '@/components/dashboard/DashboardFilters';
import { TopNav } from '@/components/TopNav';
import { exportToCSV, exportToPDF } from '@/lib/exportObservations';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { apiFetch } from '@/services/api';

const DashboardMap = lazy(() => import('@/components/dashboard/DashboardMap').then(m => ({ default: m.DashboardMap })));

const Dashboard = () => {
  const navigate = useNavigate();
  const [observations, setObservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const validObservations = observations.filter(
    (obs) =>
      obs.latitude !== null &&
      obs.latitude !== undefined &&
      obs.longitude !== null &&
      obs.longitude !== undefined
  );

  const center = validObservations.length > 0
    ? [
        validObservations.reduce((s, o) => s + o.latitude, 0) / validObservations.length,
        validObservations.reduce((s, o) => s + o.longitude, 0) / validObservations.length,
      ] as [number, number]
    : [20.5937, 78.9629] as [number, number];

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) return;

        const data = await apiFetch<any[]>('/observations', {
          method: "GET",
          headers: { 'Authorization': `Bearer ${token}` }
        });

        const mappedData = data.map((obs: any) => {
          const lat = parseFloat(obs.latitude);
          const lng = parseFloat(obs.longitude);
          let count = 0;
          const rawUrls = obs.image_urls;

          if (Array.isArray(rawUrls)) {
            count = rawUrls.length;
          } else if (typeof rawUrls === 'string') {
            if (rawUrls.startsWith('{') && rawUrls.endsWith('}')) {
              const cleaned = rawUrls.substring(1, rawUrls.length - 1);
              count = cleaned.trim() ? cleaned.split(',').length : 0;
            }
          }

          return {
            ...obs,
            latitude: isNaN(lat) ? null : lat,
            longitude: isNaN(lng) ? null : lng,
            observationType: obs.observation_type,
            villageName: obs.village_name,
            description: obs.narrative,
            imageCount: count,
            imageUrls: obs.image_urls || [],
            hasAudio: !!obs.audio_url,
            sdg: obs.sdg || null,
            domain: obs.domain || null,
            dimension: obs.dimension || null,
            createdAt: obs.updated_at || obs.created_at,
          };
        });

        setObservations(mappedData);
      } catch (err) {
        console.error("Dashboard Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  const filtered = useMemo(() => {
    return observations.filter((obs) => {
      const matchesType = typeFilter === 'all' || obs.observationType === typeFilter;
      const obsDate = new Date(obs.createdAt);
      const matchesFrom = !dateFrom || obsDate >= new Date(dateFrom);
      const matchesTo = !dateTo || obsDate <= new Date(dateTo + 'T23:59:59');
      return matchesType && matchesFrom && matchesTo;
    });
  }, [observations, dateFrom, dateTo, typeFilter]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shadow-xl shadow-violet-500/30 animate-pulse">
            <Loader2 className="w-6 h-6 text-white animate-spin" />
          </div>
          <p className="text-sm text-muted-foreground font-medium">Loading Dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Subtle purple background gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-violet-500/[0.03] via-background to-purple-900/[0.04] pointer-events-none" />

      <TopNav />

      {/* Content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        
        {/* Page Title + Export */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-foreground tracking-tight">Overview</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {filtered.length} observation{filtered.length !== 1 ? 's' : ''} {typeFilter !== 'all' ? `· ${typeFilter}` : ''}
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl gap-2 border-border/60 hover:bg-violet-500/8 hover:border-violet-500/40 hover:text-violet-600 transition-all"
              >
                <Download className="w-4 h-4" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-xl border-border/60">
              <DropdownMenuItem onClick={() => exportToCSV(filtered)} className="rounded-lg gap-2">
                <FileText className="w-4 h-4" /> Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportToPDF(filtered)} className="rounded-lg gap-2">
                <FileText className="w-4 h-4" /> Export as PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Stats */}
        <StatsCards observations={filtered} />

        {/* Filters */}
        <DashboardFilters
          dateFrom={dateFrom}
          dateTo={dateTo}
          typeFilter={typeFilter}
          onDateFromChange={setDateFrom}
          onDateToChange={setDateTo}
          onTypeChange={setTypeFilter}
        />

        {/* Map + Chart */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '1.25rem',
          }}
        >
          <div style={{ gridColumn: 'span 2' }}>
            <Suspense fallback={
              <div className="h-[400px] rounded-2xl border border-violet-500/15 bg-card/50 flex flex-col items-center justify-center gap-3 text-muted-foreground">
                <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
                <span className="text-xs font-medium uppercase tracking-widest">Loading map…</span>
              </div>
            }>
              <DashboardMap observations={filtered} />
            </Suspense>
          </div>
          <AnalyticsCharts observations={filtered} />
        </div>

        {/* Table */}
        <ObservationTable observations={filtered} />
      </div>
    </div>
  );
};

export default Dashboard;