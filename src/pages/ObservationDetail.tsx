import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Camera,
  Volume2,
  FileDown,
  Loader2,
  Target,
  ChevronLeft,
  ChevronRight,
  Hash,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { TopNav } from '@/components/TopNav';
import { exportObservationToWord } from '@/lib/exportWordDocument';
import { apiFetch } from '@/services/api';
import { toast } from 'sonner';
import 'leaflet/dist/leaflet.css';
import TranscriptViewer from "@/components/TranscriptViewer";


interface Observation {
  id: string;
  villageName: string;
  observationType: string;
  description: string;
  imageUrls: string[];
  imageCount: number;
  hasAudio: boolean;
  audioUrl?: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  status: string;
  createdAt: string;
}

const typeColorMap: Record<string, string> = {
  environmental: '#10b981',
  social: '#8b5cf6',
  health: '#f43f5e',
  infrastructure: '#f59e0b',
  education: '#0ea5e9',
};

const typeBadgeStyles: Record<string, string> = {
  environmental: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/25',
  social: 'bg-violet-500/10 text-violet-500 border-violet-500/25',
  health: 'bg-rose-500/10 text-rose-500 border-rose-500/25',
  infrastructure: 'bg-amber-500/10 text-amber-500 border-amber-500/25',
  education: 'bg-sky-500/10 text-sky-500 border-sky-500/25',
};

const statusStyles: Record<string, string> = {
  pending: 'bg-amber-500/10 text-amber-500 border-amber-500/25',
  in_review: 'bg-violet-500/10 text-violet-500 border-violet-500/25',
  resolved: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/25',
};

const ObservationDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [obs, setObs] = useState<Observation | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImage, setCurrentImage] = useState(0);
  const [downloading, setDownloading] = useState(false);
const [transcription, setTranscription] = useState<any>(null);
  useEffect(() => {
    const fetchDetail = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('access_token');
        const data = await apiFetch<any>(`/observations/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        let processedImages: string[] = [];
        const rawUrls = data.image_urls;
        if (Array.isArray(rawUrls)) {
          processedImages = rawUrls;
        } else if (typeof rawUrls === 'string') {
          const cleaned = rawUrls.replace(/{|}/g, '');
          processedImages = cleaned.trim() ? cleaned.split(',') : [];
        }
        

        setObs({
          id: data.id.toString(),
          villageName: data.village_name,
          observationType: data.observation_type,
          description: data.narrative || data.description,
          imageUrls: processedImages,
          imageCount: processedImages.length,
          hasAudio: !!data.audio_url,
          audioUrl: data.audio_url,
          latitude: parseFloat(data.latitude),
          longitude: parseFloat(data.longitude),
          accuracy: data.accuracy || 0,
          status: data.observation_status || 'pending',
          createdAt: data.created_at,
        });
      } catch (err) {
        console.error('Fetch error:', err);
        toast.error('Could not load observation details');
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchDetail();
    
  }, [id]);
  // 👇 ADD transcription
  useEffect(() => {
    if (!obs?.id) return;

    apiFetch(`/transcriptions/${obs.id}`)
      .then((data) => {
        setTranscription(data);
      })
      .catch(() => {
        setTranscription(null);
      });
  }, [obs?.id]);
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <TopNav />
        <div className="flex items-center justify-center h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shadow-xl shadow-violet-500/30 animate-pulse">
              <Loader2 className="w-6 h-6 text-white animate-spin" />
            </div>
            <p className="text-sm text-muted-foreground">Loading observation…</p>
          </div>
        </div>
      </div>
    );
  }

  if (!obs) {
    return (
      <div className="min-h-screen bg-background">
        <TopNav />
        <div className="flex items-center justify-center h-[60vh]">
          <Card className="max-w-md mx-auto border-border/40">
            <CardContent className="p-8 text-center space-y-4">
              <p className="text-lg font-semibold">Observation not found</p>
              <Button onClick={() => navigate('/dashboard')} className="rounded-xl bg-violet-600 hover:bg-violet-700">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await exportObservationToWord(obs as any);
      toast.success('Word document downloaded!');
    } catch {
      toast.error('Failed to generate document');
    } finally {
      setDownloading(false);
    }
  };

  const prev = () => setCurrentImage((i) => (i > 0 ? i - 1 : obs.imageUrls.length - 1));
  const next = () => setCurrentImage((i) => (i < obs.imageUrls.length - 1 ? i + 1 : 0));

  return (
    <div className="min-h-screen bg-background">
      {/* Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-violet-500/[0.03] via-background to-purple-900/[0.04] pointer-events-none" />

      <TopNav />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-5">
        
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/dashboard')}
              className="rounded-xl mt-0.5 hover:bg-violet-500/8 hover:text-violet-600"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-black text-foreground tracking-tight">{obs.villageName}</h1>
              <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                <Hash className="w-3 h-3" />
                <span>Observation {obs.id}</span>
              </div>
            </div>
          </div>
          <Button
            onClick={handleDownload}
            disabled={downloading}
            className="rounded-xl gap-2 bg-violet-600 hover:bg-violet-700 shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all"
          >
            {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
            Download Report
          </Button>
        </div>

        {/* Meta badges */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className={`capitalize ${typeBadgeStyles[obs.observationType]}`}>
            ● {obs.observationType}
          </Badge>
          <Badge variant="outline" className={statusStyles[obs.status]}>
            {obs.status.replace('_', ' ')}
          </Badge>
          <Badge variant="outline" className="bg-muted/50 text-muted-foreground border-border/50 gap-1">
            <Calendar className="w-3 h-3" />
            {new Date(obs.createdAt).toLocaleDateString('en-US', {
              year: 'numeric', month: 'long', day: 'numeric',
              hour: '2-digit', minute: '2-digit',
            })}
          </Badge>
        </div>

        {/* Description */}
        <div className="rounded-2xl border border-violet-500/15 bg-card/50 backdrop-blur-sm p-6">
          <p className="text-[10px] font-bold text-violet-500/70 uppercase tracking-widest mb-3">Description</p>
          <p className="text-foreground leading-relaxed">{obs.description}</p>
        </div>

        {/* Photos */}
        {obs.imageUrls.length > 0 && (
          <div className="rounded-2xl border border-violet-500/15 bg-card/50 backdrop-blur-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-border/40 bg-gradient-to-r from-violet-500/8 to-transparent flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-violet-500/12 border border-violet-500/20">
                <Camera className="w-3.5 h-3.5 text-violet-500" />
              </div>
              <h2 className="text-sm font-semibold text-foreground">
                Photos <span className="text-muted-foreground font-normal">({obs.imageUrls.length})</span>
              </h2>
            </div>
            <div className="p-5">
              <div className="relative rounded-xl overflow-hidden bg-muted/20">
                <img
                  src={obs.imageUrls[currentImage]}
                  alt={`Photo ${currentImage + 1}`}
                  className="w-full h-[400px] object-cover"
                />
                {obs.imageUrls.length > 1 && (
                  <>
                    <button
                      onClick={prev}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white transition-all hover:scale-110 hover:border-violet-500/60"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={next}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white transition-all hover:scale-110 hover:border-violet-500/60"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-medium text-white">
                      {currentImage + 1} / {obs.imageUrls.length}
                    </div>
                  </>
                )}
              </div>

              {obs.imageUrls.length > 1 && (
                <div className="flex gap-2 mt-3 overflow-x-auto">
                  {obs.imageUrls.map((url, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentImage(i)}
                      className={`flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden transition-all duration-200 ${
                        i === currentImage
                          ? 'ring-2 ring-violet-500 ring-offset-2 ring-offset-background scale-105'
                          : 'opacity-50 hover:opacity-80 hover:scale-105'
                      }`}
                    >
                      <img src={url} alt={`Thumb ${i + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Audio */}
        {obs.audioUrl && (
          <div className="rounded-2xl border border-violet-500/15 bg-card/50 backdrop-blur-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-border/40 bg-gradient-to-r from-violet-500/8 to-transparent flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-violet-500/12 border border-violet-500/20">
                <Volume2 className="w-3.5 h-3.5 text-violet-500" />
              </div>
              <h2 className="text-sm font-semibold text-foreground">Audio Recording</h2>
            </div>
            <div className="p-5">
              <audio controls className="w-full" preload="none" style={{ accentColor: '#7c3aed' }}>
                <source src={obs.audioUrl} type="audio/mpeg" />
              </audio>
            </div>
          </div>
        )}

     
{transcription && obs.audioUrl && (
    <TranscriptViewer
      audioUrl={obs.audioUrl}
      detectedLanguage={transcription.detected_language}
      originalSegments={transcription.original_segments}
      englishSegments={transcription.english_segments}
    />
  )}

        {/* Map */}
        <div className="rounded-2xl border border-violet-500/15 bg-card/50 backdrop-blur-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-border/40 bg-gradient-to-r from-violet-500/8 to-transparent flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-violet-500/12 border border-violet-500/20">
                <MapPin className="w-3.5 h-3.5 text-violet-500" />
              </div>
              <h2 className="text-sm font-semibold text-foreground">Location</h2>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="tabular-nums">{obs.latitude.toFixed(4)}°N, {obs.longitude.toFixed(4)}°E</span>
              <span className="flex items-center gap-1">
                <Target className="w-3 h-3" /> ±{obs.accuracy}m
              </span>
            </div>
          </div>
          <div className="h-[350px]">
            <MapContainer
              center={[obs.latitude, obs.longitude]}
              zoom={15}
              style={{ height: '100%', width: '100%' }}
              scrollWheelZoom={false}
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <CircleMarker
                center={[obs.latitude, obs.longitude]}
                radius={10}
                pathOptions={{
                  color: 'white',
                  weight: 3,
                  fillColor: typeColorMap[obs.observationType] || '#7c3aed',
                  fillOpacity: 0.85,
                }}
              >
                <Popup>
                  <div className="text-sm font-semibold">{obs.villageName}</div>
                </Popup>
              </CircleMarker>
            </MapContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ObservationDetail;