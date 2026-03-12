import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import {
  ArrowLeft, Download, Globe, User, Users,
  FileText, AlignLeft, List, Layers, BookOpen,
  ChevronDown, ChevronUp, Play, Pause
} from 'lucide-react';

interface Segment {
  index: number;
  speaker: string;
  start: number;
  end: number;
  text: string;
}

interface Speaker {
  id: string;
  role: 'interviewer' | 'interviewee' | 'unknown';
}

interface TranscriptResult {
  detected_language: string;
  duration: number;
  speakers: Speaker[];
  original_text: string;
  english_text: string;
  original_segments: Segment[];
  english_segments: Segment[];
}

// ─── Speaker Colors ───────────────────────────────────────────────────────────
const SPEAKER_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
const speakerColor = (id: string) => SPEAKER_COLORS[parseInt(id.replace(/\D/g, '')) % SPEAKER_COLORS.length] || '#6366f1';

const ROLE_ICONS: Record<string, string> = {
  interviewer: '🎤',
  interviewee: '💬',
  unknown: '👤',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

function downloadText(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

function segmentsToText(segs: Segment[]) {
  return segs.map((s) => `[${formatTime(s.start)} - ${formatTime(s.end)}] ${s.speaker}: ${s.text}`).join('\n');
}

function combinedSegmentsText(orig: Segment[], eng: Segment[]) {
  return orig.map((s, i) => {
    const e = eng[i];
    return `[${formatTime(s.start)} - ${formatTime(s.end)}] ${s.speaker}:\n  Original:   ${s.text}\n  Translated: ${e?.text || ''}\n`;
  }).join('\n');
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function SectionCard({ title, icon, children, defaultOpen = true }: {
  title: string; icon: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{
      background: 'var(--card)',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 20,
      overflow: 'hidden',
    }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          width: '100%', padding: '16px 20px',
          background: 'none', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          color: 'var(--foreground)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, fontWeight: 700 }}>
          {icon}
          {title}
        </div>
        {open ? <ChevronUp size={16} color="var(--muted-foreground)" /> : <ChevronDown size={16} color="#6b6b8a" />}
      </button>
      {open && (
        <div style={{ padding: '0 20px 20px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          {children}
        </div>
      )}
    </div>
  );
}

function SegmentRow({ orig, eng, active }: { orig: Segment; eng: Segment | undefined; active: boolean }) {
  const color = speakerColor(orig.speaker);
  return (
    <div
      id={`seg-${orig.index}`}
      style={{
        display: 'grid', gridTemplateColumns: '90px 1fr 1fr',
        gap: 12, padding: '12px 0',
        borderBottom: '1px solid var(--border)',
        background: active ? `${color}08` : 'transparent',
        borderRadius: active ? 10 : 0,
        transition: 'background 0.3s',
      }}
    >
      {/* Time + Speaker */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ fontSize: 10, color: 'var(--muted-foreground)', fontVariantNumeric: 'tabular-nums' }}>
          {formatTime(orig.start)}
        </span>
        <span style={{
          fontSize: 10, fontWeight: 700, color,
          background: `${color}15`, padding: '1px 6px',
          borderRadius: 100, display: 'inline-block', whiteSpace: 'nowrap',
        }}>
          {orig.speaker}
        </span>
      </div>

      {/* Original */}
      <p style={{
        margin: 0, fontSize: 13, color: 'var(--foreground)', lineHeight: 1.6,
        fontStyle: active ? 'normal' : undefined,
      }}>
        {orig.text}
      </p>

      {/* English */}
      <p style={{ margin: 0, fontSize: 13, color: 'var(--primary)', lineHeight: 1.6, fontStyle: 'italic' }}>
        {eng?.text || '—'}
      </p>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function TranscribeResultPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const result: TranscriptResult | null = location.state?.result || null;
  const fileName: string = location.state?.fileName || 'transcript';
  const [activeSegment, setActiveSegment] = useState<number | null>(null);

  // If user refreshes, state is gone — redirect back
  useEffect(() => {
    if (!result) navigate('/transcribe', { replace: true });
  }, [result, navigate]);

  if (!result) return null;

  const baseName = fileName.replace(/\.[^.]+$/, '');

  const DOWNLOADS = [
    {
      label: 'Original Text',
      icon: <BookOpen size={14} />,
      color: '#6366f1',
      action: () => downloadText(result.original_text, `${baseName}_original.txt`),
    },
    {
      label: 'Translated Text',
      icon: <Globe size={14} />,
      color: '#10b981',
      action: () => downloadText(result.english_text, `${baseName}_translated.txt`),
    },
    {
      label: 'Original Segments',
      icon: <List size={14} />,
      color: '#f59e0b',
      action: () => downloadText(segmentsToText(result.original_segments), `${baseName}_original_segments.txt`),
    },
    {
      label: 'Translated Segments',
      icon: <AlignLeft size={14} />,
      color: '#8b5cf6',
      action: () => downloadText(segmentsToText(result.english_segments), `${baseName}_translated_segments.txt`),
    },
    {
      label: 'Both (Combined)',
      icon: <Layers size={14} />,
      color: '#06b6d4',
      action: () => downloadText(combinedSegmentsText(result.original_segments, result.english_segments), `${baseName}_combined_segments.txt`),
    },
  ];

  return (
    <div style={{
      minHeight: '100vh',
     background: 'var(--background)',
color: 'var(--foreground)',
      fontFamily: "'DM Sans', sans-serif",

      padding: '24px 16px 60px',
    }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');`}</style>

      {/* Bg glow */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(99,102,241,0.08) 0%, transparent 70%)',
      }} />

      <div style={{ maxWidth: 860, margin: '0 auto', position: 'relative', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => navigate('/transcribe')}
            style={{
              background: 'var(--card)',
border: '1px solid var(--border)',
color: 'var(--muted-foreground)',
            }}
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700,color: 'var(--foreground)', letterSpacing: -0.4 }}>
              Transcription Result
            </h1>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--muted-foreground)' }}>{fileName}</p>
          </div>
        </div>

        {/* ── Language + Speaker Summary ── */}
        <div style={{
          background: 'var(--card)',
border: '1px solid var(--border)',
          borderRadius: 20, padding: 20,
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16,
        }}>
          {/* Language Info */}
          <div>
            <p style={{ margin: '0 0 10px', fontSize: 11, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>
              Detected Language
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 38, height: 38, borderRadius: 10,
                background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Globe size={18} color="#818cf8" />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#f0f0ff' }}>
                  {result.detected_language}
                </p>
                <p style={{ margin: 0, fontSize: 11, color: 'var(--muted-foreground)' }}>
                  {formatTime(result.duration)} total duration
                </p>
              </div>
            </div>
          </div>

          {/* Speakers */}
          <div>
            <p style={{ margin: '0 0 10px', fontSize: 11, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>
              Speakers ({result.speakers.length})
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {result.speakers.map((sp) => (
                <div key={sp.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                    background: speakerColor(sp.id),
                  }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--foreground)' }}>{sp.id}</span>
                  <span style={{
                    fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 100,
                    background: sp.role === 'unknown' ? 'rgba(107,107,138,0.2)' : 'rgba(99,102,241,0.12)',
                    color: sp.role === 'unknown' ? '#6b6b8a' : '#818cf8',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}>
                    {ROLE_ICONS[sp.role]} {sp.role}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Download Buttons ── */}
        <div>
          <p style={{ margin: '0 0 10px', fontSize: 11, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>
            Download Exports
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {DOWNLOADS.map((d) => (
              <button
                key={d.label}
                onClick={d.action}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '9px 14px', borderRadius: 10, border: `1px solid ${d.color}30`,
                  background: `${d.color}10`, color: d.color,
                  fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = `${d.color}20`; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = `${d.color}10`; }}
              >
                <Download size={13} />
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Original Full Text ── */}
        <SectionCard title="Original Transcript" icon={<BookOpen size={16} color="#818cf8" />}>
          <div style={{
            marginTop: 14,
            background: 'var(--muted)', borderRadius: 12, padding: 16,
            maxHeight: 300, overflowY: 'auto',
            fontSize: 14, lineHeight: 1.8, color: 'var(--foreground)',
            whiteSpace: 'pre-wrap', wordBreak: 'break-word',
          }}>
            {result.original_text}
          </div>
        </SectionCard>

        {/* ── Translated Full Text ── */}
        <SectionCard title="English Translation" icon={<Globe size={16} color="#10b981" />}>
          <div style={{
            marginTop: 14,
            background: 'var(--muted)', borderRadius: 12, padding: 16,
            maxHeight: 300, overflowY: 'auto',
            fontSize: 14, lineHeight: 1.8, color: 'var(--primary)', fontStyle: 'italic',
            whiteSpace: 'pre-wrap', wordBreak: 'break-word',
          }}>
            {result.english_text}
          </div>
        </SectionCard>

        {/* ── Combined Segments ── */}
        <SectionCard title="Segment-by-Segment (Original + Translation)" icon={<Layers size={16} color="#f59e0b" />}>
          {/* Column headers */}
          <div style={{
            display: 'grid', gridTemplateColumns: '90px 1fr 1fr',
            gap: 12, padding: '10px 0 6px',
            borderBottom: '1px solid var(--border)',
          }}>
            {['Time / Speaker', 'Original', 'English'].map((h) => (
              <span key={h} style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: 0.8 }}>
                {h}
              </span>
            ))}
          </div>

          <div style={{ maxHeight: 480, overflowY: 'auto', paddingRight: 4 }}>
            {result.original_segments.map((seg, i) => (
              <SegmentRow
                key={seg.index}
                orig={seg}
                eng={result.english_segments[i]}
                active={activeSegment === seg.index}
              />
            ))}
          </div>
        </SectionCard>

      </div>
    </div>
  );
}