import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, Image, MapPin, Search, ArrowUpDown, ArrowUp, ArrowDown, Eye, FileDown, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious,
} from '@/components/ui/pagination';
import { MediaPreviewDialog } from './MediaPreviewDialog';
import { exportObservationToWord } from '@/lib/exportWordDocument';
import { toast } from 'sonner';

// Define the Observation interface to match the mapped data from Dashboard.tsx
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
  createdAt: string;
  status: string;
}

interface ObservationTableProps {
  observations: Observation[];
}

const typeColors: Record<string, string> = {
  environmental: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  social: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20',
  health: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
  infrastructure: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  education: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20',
};

type SortKey = 'createdAt' | 'observationType' | 'villageName';
type SortDir = 'asc' | 'desc';
const ITEMS_PER_PAGE = 5;

export const ObservationTable = ({ observations }: ObservationTableProps) => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortKey, setSortKey] = useState<SortKey>('createdAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [mediaObs, setMediaObs] = useState<Observation | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
    setCurrentPage(1);
  };

  const SortIcon = ({ column }: { column: SortKey }) => {
    if (sortKey !== column) return <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground/50" />;
    return sortDir === 'asc'
      ? <ArrowUp className="w-3.5 h-3.5 text-primary" />
      : <ArrowDown className="w-3.5 h-3.5 text-primary" />;
  };

  const filtered = useMemo(() => {
    let data = observations.filter((obs) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        (obs.villageName?.toLowerCase().includes(q)) || 
        (obs.description?.toLowerCase().includes(q))
      );
    });
    data.sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'createdAt') cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      else if (sortKey === 'observationType') cmp = (a.observationType || "").localeCompare(b.observationType || "");
      else if (sortKey === 'villageName') cmp = (a.villageName || "").localeCompare(b.villageName || "");
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return data;
  }, [observations, search, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const paginated = filtered.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE);

  const handleDownloadWord = async (obs: Observation) => {
    setDownloadingId(obs.id);
    try {
      await exportObservationToWord(obs as any);
      toast.success('Word document downloaded!');
    } catch {
      toast.error('Failed to generate document');
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <>
      <div className="glass-card rounded-2xl overflow-hidden slide-up">
        <div className="p-5 border-b border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Recent Observations</h2>
            <p className="text-sm text-muted-foreground">All submitted problem reports</p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search village or description…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className="pl-9 rounded-xl"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => toggleSort('observationType')}>
                  <span className="flex items-center gap-1.5">Type <SortIcon column="observationType" /></span>
                </TableHead>
                <TableHead className="cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => toggleSort('villageName')}>
                  <span className="flex items-center gap-1.5">Village <SortIcon column="villageName" /></span>
                </TableHead>
                <TableHead className="hidden md:table-cell">Description</TableHead>
                <TableHead>Media</TableHead>
                <TableHead className="cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => toggleSort('createdAt')}>
                  <span className="flex items-center gap-1.5">Date <SortIcon column="createdAt" /></span>
                </TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                    No observations match your search.
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((obs) => (
                  <TableRow key={obs.id} className="hover:bg-muted/30 transition-colors group">
                    <TableCell>
                      <Badge variant="outline" className={typeColors[obs.observationType] || ''}>
                        {obs.observationType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-sm font-medium">{obs.villageName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell max-w-[300px]">
                      <p className="text-sm text-muted-foreground truncate">{obs.description}</p>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {obs.imageUrls && obs.imageUrls.length > 0 && (
                          <button
                            onClick={() => setMediaObs(obs)}
                            className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors"
                            title="View photos"
                          >
                            <Image className="w-4 h-4" />
                            <span className="text-xs font-medium">{obs.imageCount}</span>
                          </button>
                        )}
                        {obs.hasAudio && (
                          <button
                            onClick={() => setMediaObs(obs)}
                            className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors"
                            title="Play audio"
                          >
                            <Mic className="w-4 h-4" />
                          </button>
                        )}
                        {!obs.hasAudio && (!obs.imageUrls || obs.imageUrls.length === 0) && (
                          <span className="text-xs text-muted-foreground/50">—</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {new Date(obs.createdAt).toLocaleDateString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg opacity-60 group-hover:opacity-100 transition-opacity"
                          onClick={() => navigate(`/observation/${obs.id}`)}
                          title="View details"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg opacity-60 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleDownloadWord(obs)}
                          disabled={downloadingId === obs.id}
                          title="Download Word document"
                        >
                          {downloadingId === obs.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <FileDown className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {totalPages > 1 && (
          <div className="p-4 border-t border-border/50 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {filtered.length} result{filtered.length !== 1 ? 's' : ''} · Page {safePage} of {totalPages}
            </span>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className={safePage <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <PaginationItem key={page}>
                    <PaginationLink
                      isActive={page === safePage}
                      onClick={() => setCurrentPage(page)}
                      className="cursor-pointer"
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className={safePage >= totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>

      {mediaObs && (
        <MediaPreviewDialog
          open={!!mediaObs}
          onOpenChange={(open) => !open && setMediaObs(null)}
          images={mediaObs.imageUrls}
          audioUrl={mediaObs.audioUrl}
          title={`${mediaObs.villageName} — ${mediaObs.observationType}`}
        />
      )}
    </>
  );
};