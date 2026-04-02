import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload, Mic, Languages,
  X, FileAudio, Loader2, AlertCircle, CheckCircle2,
} from 'lucide-react';
import { apiFetch } from '@/services/api';

// ── Step metadata ─────────────────────────────────────────────────────────────
const STEP_LABELS: Record<string, string> = {
  saving:       'Saving file',
  normalizing:  'Normalizing audio',
  splitting:    'Splitting chunks',
  transcribing: 'Transcribing',
  merging:      'Merging results',
  done:         'Complete',
};

const STEP_ORDER = ['saving', 'normalizing', 'splitting', 'transcribing', 'merging', 'done'];

function formatBytes(b: number) {
  return b < 1024 * 1024 ? `${(b / 1024).toFixed(1)} KB` : `${(b / (1024 ** 2)).toFixed(1)} MB`;
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function AudioTranscribePage() {
  const navigate = useNavigate();

  const [tab, setTab]               = useState<'indian' | 'international'>('indian');
  const [file, setFile]             = useState<File | null>(null);
  const [dragOver, setDragOver]     = useState(false);

  // Progress state
  const [processing, setProcessing] = useState(false);
  const [step, setStep]             = useState('');
  const [percent, setPercent]       = useState(0);
  const [detail, setDetail]         = useState('');
  const [error, setError]           = useState('');
  const [done, setDone]             = useState(false);

  const fileRef  = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // ── File handling ─────────────────────────────────────────────────────────
  const loadFile = useCallback((f: File) => {
    const allowed = ['.mp3', '.wav', '.m4a', '.ogg', '.flac', '.aac', '.opus', '.wma', '.webm'];
    const ext = '.' + f.name.split('.').pop()?.toLowerCase();
    if (!allowed.includes(ext)) { setError(`Unsupported format "${ext}"`); return; }
    setFile(f); setError(''); setStep(''); setPercent(0); setDone(false);
  }, []);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) loadFile(f); else setError('Please drop an audio file.');
  };

  // ── Transcribe via SSE ────────────────────────────────────────────────────
  const handleTranscribe = async () => {
    if (!file) { setError('Please select an audio file first.'); return; }

    setProcessing(true); setError(''); setPercent(0); setDone(false); setDetail('');

    const formData = new FormData();
    formData.append('audio', file, file.name);
    formData.append('language_code', tab === 'indian' ? 'indian' : 'auto');

    abortRef.current = new AbortController();

    try {
      const token = localStorage.getItem('access_token');
      // apiFetch wraps the base URL — but SSE needs a raw fetch with ReadableStream.
      // So we grab the base URL from apiFetch's config and call fetch directly.
      const baseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
      const res = await fetch(`${baseUrl}/transcribe`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
        signal: abortRef.current.signal,
      });

      if (!res.ok) throw new Error(`Server error: ${res.status} ${res.statusText}`);
      if (!res.body) throw new Error('No response body');

      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let   buffer  = '';

      while (true) {
        const { done: streamDone, value } = await reader.read();
        if (streamDone) break;

        buffer += decoder.decode(value, { stream: true });
        const frames = buffer.split('\n\n');
        buffer = frames.pop() ?? '';   // keep incomplete last frame

        for (const frame of frames) {
          if (!frame.trim()) continue;
          if (frame.startsWith(':')) continue;   // heartbeat ping — ignore

          // Parse SSE frame: "event: xxx\ndata: {...}"
          const eventMatch = frame.match(/^event:\s*(.+)$/m);
          const dataMatch  = frame.match(/^data:\s*(.+)$/ms);
          if (!eventMatch || !dataMatch) continue;

          const eventName = eventMatch[1].trim();
          let   payload: any;
          try { payload = JSON.parse(dataMatch[1].trim()); }
          catch { continue; }

          if (eventName === 'progress') {
            setStep(payload.step ?? '');
            setPercent(payload.percent ?? 0);
            setDetail(payload.detail ?? '');
          } else if (eventName === 'result') {
            setPercent(100);
            setStep('done');
            setDone(true);
            setProcessing(false);
            navigate('/transcribe/result', {
              state: { result: payload, fileName: file.name },
            });
            return;
          } else if (eventName === 'error') {
            throw new Error(payload.message || 'Transcription failed');
          }
        }
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setError(err.message || 'Transcription failed');
      }
      setProcessing(false);
    }
  };

  const handleCancel = () => {
    abortRef.current?.abort();
    setProcessing(false); setPercent(0); setStep(''); setDetail('');
  };

  // ── Derived ───────────────────────────────────────────────────────────────
  const canStart      = !!file && !processing;
  const currentStepIdx = STEP_ORDER.indexOf(step);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: '100vh', background: 'var(--background)',
      fontFamily: "'DM Sans', sans-serif", color: 'var(--foreground)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '32px 16px', position: 'relative', overflow: 'hidden',
    }}>
      {/* Bg glow */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(99,102,241,0.12) 0%, transparent 70%)',
      }} />

      <div style={{ position: 'relative', width: '100%', maxWidth: 580, zIndex: 1 }}>

        {/* ── Header ── */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 52, height: 52, borderRadius: 16, marginBottom: 14,
            background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
            boxShadow: '0 0 32px rgba(99,102,241,0.35)',
          }}>
            <Mic size={24} color="#fff" />
          </div>
         <h1 style={{
  fontSize: 26,
  fontWeight: 700,
  margin: '0 0 6px',
  letterSpacing: -0.5,
  color: 'var(--foreground)'
}}>
            Audio Transcription
          </h1>
          <p style={{ fontSize: 13, color: 'var(--foreground)', margin: 0 }}>
            MP3 · WAV · M4A · OGG · FLAC · Any duration
          </p>
        </div>

        {/* ── Card ── */}
        <div style={{
         background: 'var(--card)',border: '1px solid var(--border)',
                   borderRadius: 24, padding: 28, backdropFilter: 'blur(12px)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.4)', display: 'flex',
          flexDirection: 'column', gap: 20,
        }}>

          {/* ── Drop Zone ── */}
          <div
            onDrop={onDrop}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onClick={() => !file && !processing && fileRef.current?.click()}
            style={{
             border: `2px dashed ${
  dragOver ? 'var(--primary)' :
  file ? '#10b981' :
  'var(--border)'
}`,
              borderRadius: 16, padding: '26px 20px', textAlign: 'center',
              cursor: file || processing ? 'default' : 'pointer',
              transition: 'all 0.2s',
             background: dragOver
  ? 'color-mix(in srgb, var(--primary) 8%, transparent)'
  : file
  ? 'rgba(16,185,129,0.05)'
  : 'var(--card)',
            }}
          >
            <input
              ref={fileRef} type="file"
              accept=".mp3,.wav,.m4a,.ogg,.flac,.aac,.opus,.wma,.webm,audio/*"
              style={{ display: 'none' }}
              onChange={(e) => e.target.files?.[0] && loadFile(e.target.files[0])}
            />

            {!file ? (
              <>
                <div style={{
                  width: 46, height: 46, borderRadius: 12, margin: '0 auto 12px',
                  background: 'rgba(99,102,241,0.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Upload size={22} color="#6366f1" />
                </div>
                <p style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 600, color: 'var(--foreground)' }}>
                  Drop audio file here
                </p>
                <p style={{ margin: 0, fontSize: 12, color: 'var(--muted-foreground)' }}>
                  MP3, WAV, M4A, OGG, FLAC — any duration
                </p>
              </>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, textAlign: 'left' }}>
                <div style={{
                  width: 42, height: 42, borderRadius: 11, flexShrink: 0,
                  background: 'rgba(16,185,129,0.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <FileAudio size={19} color="#10b981" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    margin: '0 0 2px', fontSize: 14, fontWeight: 600, color: 'var(--foreground)',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>{file.name}</p>
                  <p style={{ margin: 0, fontSize: 12, color: '#var(--muted-foreground)' }}>{formatBytes(file.size)}</p>
                </div>
                {!processing && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setFile(null); setStep(''); setPercent(0); setDone(false); }}
                    style={{
                      background: 'var(--muted)', border: 'none',
                      borderRadius: 8, padding: 6, cursor: 'pointer', color: 'var(--muted-foreground)',
                      display: 'flex',
                    }}
                  ><X size={15} /></button>
                )}
              </div>
            )}
          </div>

          {/* ── Language Selection ── */}
          <div>
            <p style={{ margin: '0 0 10px', fontSize: 11, fontWeight: 700, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: 1 }}>
              Audio Language
            </p>

            {/* Tab */}
            <div style={{
              display: 'flex', background: 'var(--muted)', borderRadius: 10,
              padding: 3, marginBottom: 10, border: '1px solid var(--border)',
            }}>
              {(['indian', 'international'] as ('indian' | 'international')[]).map((t) => (
                <button key={t} onClick={() => { setTab(t); }}
                  disabled={processing}
                  style={{
                    flex: 1, padding: '7px 0', borderRadius: 8, border: 'none', cursor: 'pointer',
                    fontSize: 13, fontWeight: 600, transition: 'all 0.18s',
                    background: tab === t ? (t === 'indian' ? '#6366f1' : '#0ea5e9') : 'transparent',
                    color: tab === t ? '#fff' : 'var(--muted-foreground)',
                    boxShadow: tab === t ? '0 2px 10px rgba(0,0,0,0.3)' : 'none',
                  }}
                >
                  {t === 'indian' ? '🇮🇳 Indian' : '🌍 International'}
                </button>
              ))}
            </div>


          </div>

          {/* ── Progress ── */}
          {processing && (
            <div style={{
             background: 'color-mix(in srgb, var(--primary) 10%, transparent)',
border: '1px solid var(--border)',
              borderRadius: 16, padding: 16, display: 'flex', flexDirection: 'column', gap: 14,
            }}>
              {/* Step pipeline */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                {STEP_ORDER.filter(s => s !== 'done').map((s, i) => {
                  const idx   = STEP_ORDER.indexOf(s);
                  const past  = currentStepIdx > idx;
                  const active = currentStepIdx === idx;
                  const color  = past ? '#10b981' : active ? '#6366f1' : '#2a2a3a';
                  const textC  = past ? '#10b981' : active ? '#818cf8' : '#3a3a52';
                  return (
                    <div key={s} style={{ display: 'flex', alignItems: 'center', flex: i < STEP_ORDER.length - 2 ? 1 : undefined }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                        <div style={{
                          width: 28, height: 28, borderRadius: '50%',
                          border: `2px solid ${color}`,
                          background: past ? '#10b98120' : active ? '#6366f120' : 'transparent',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'all 0.3s',
                        }}>
                          {past
                            ? <CheckCircle2 size={14} color="#10b981" />
                            : active
                              ? <Loader2 size={13} color="#818cf8" style={{ animation: 'spin 1s linear infinite' }} />
                              : <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#2a2a3a' }} />
                          }
                        </div>
                        <span style={{ fontSize: 9, color: textC, whiteSpace: 'nowrap', fontWeight: active ? 700 : 400 }}>
                          {STEP_LABELS[s]}
                        </span>
                      </div>
                      {i < STEP_ORDER.filter(s => s !== 'done').length - 1 && (
                        <div style={{
                          flex: 1, height: 2, margin: '0 4px', marginBottom: 14,
                          background: past ? '#10b981' : 'rgba(255,255,255,0.06)',
                          transition: 'background 0.3s',
                        }} />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Progress bar */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: '#818cf8', fontWeight: 600 }}>{detail}</span>
                  <span style={{ fontSize: 12, color: '#6366f1', fontWeight: 700 }}>{percent}%</span>
                </div>
                <div style={{ height: 6, background: 'var(--muted)', borderRadius: 100, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: 100,
                    width: `${percent}%`, transition: 'width 0.5s ease',
                    background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
                    boxShadow: '0 0 10px rgba(99,102,241,0.5)',
                  }} />
                </div>
              </div>
            </div>
          )}

          {/* ── Error ── */}
          {error && (
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: 10,
              background: 'color-mix(in srgb, red 8%, transparent)', border: '1px solid red',
              borderRadius: 12, padding: '12px 14px',
            }}>
              <AlertCircle size={16} color="#ef4444" style={{ flexShrink: 0, marginTop: 1 }} />
              <p style={{ margin: 0, fontSize: 13, color: '#fca5a5' }}>{error}</p>
            </div>
          )}

          {/* ── Buttons ── */}
          <div style={{ display: 'flex', gap: 10 }}>
            {processing ? (
              <button onClick={handleCancel} style={{
                flex: 1, padding: '13px', borderRadius: 14, border: '1px solid red',
                background: 'color-mix(in srgb, red 8%, transparent)',
 color: '#f87171',
                fontSize: 14, fontWeight: 700, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}>
                <X size={16} /> Cancel
              </button>
            ) : (
              <button onClick={handleTranscribe} disabled={!canStart} style={{
                flex: 1, padding: '13px', borderRadius: 14, border: 'none',
                cursor: canStart ? 'pointer' : 'not-allowed',
                fontSize: 14, fontWeight: 700,
                background: canStart
                  ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)'
                  : 'rgba(255,255,255,0.04)',
                color: canStart ? '#fff' : '#3a3a52',
                boxShadow: canStart ? '0 8px 24px rgba(99,102,241,0.35)' : 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'all 0.2s',
              }}>
                <Languages size={17} />
                Transcribe & Translate
              </button>
            )}
          </div>

        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
      `}</style>
    </div>
  );
}