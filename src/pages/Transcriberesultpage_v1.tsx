import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, CSSProperties } from 'react';
import { ArrowLeft, Globe, BookOpen, FileText } from 'lucide-react';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { saveAs } from 'file-saver';

interface TranscriptResult {
  detected_language: string;
  duration: number;
  original_text: string;
  english_text: string;
}

// ─── Export Helpers ──────────────────────────────────────────────────────────
async function downloadDocx(content: string, filename: string) {
  const doc = new Document({
    sections: [{
      children: content.split('\n').map((line) => {
        const parts = line.split(/(Interviewer|Interviewee)/gi);
        return new Paragraph({
          spacing: { after: 300 },
          children: parts.map((part) => {
            const lowerPart = part.toLowerCase();
            const isMatch = lowerPart === "interviewer" || lowerPart === "interviewee";
            return new TextRun({
              text: part,
              bold: isMatch,
              color: lowerPart === "interviewer" ? "10b981" : (lowerPart === "interviewee" ? "a855f7" : "000000"),
            });
          }),
        });
      }),
    }],
  });
  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${filename}.docx`);
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function TranscribeResultPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const result: TranscriptResult | null = location.state?.result || null;
  const fileName: string = location.state?.fileName || 'transcript';

  useEffect(() => {
    if (!result) navigate('/transcribe', { replace: true });
  }, [result, navigate]);

  if (!result) return null;

  const baseName = fileName.replace(/\.[^.]+$/, '');
  const DOWNLOAD_OPTIONS = [
    { label: 'Original', text: result.original_text, color: '#6366f1' },
    { label: 'Translation', text: result.english_text, color: '#10b981' },
    { label: 'Combined', text: `ORIGINAL:\n${result.original_text}\n\nTRANSLATION:\n${result.english_text}`, color: '#f59e0b' }
  ];

  return (
    <div style={pageContainerStyle}>
      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } } .animated-card { animation: fadeIn 0.5s ease-out forwards; }`}</style>
      
      <div style={contentWrapperStyle}>
        {/* Header */}
        <div style={headerStyle}>
          <button onClick={() => navigate('/transcribe')} style={backBtnStyle}>
            <ArrowLeft size={20} />
          </button>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>Transcription Result</h1>
        </div>

        {/* Download Section */}
        <div style={gridStyle}>
          {DOWNLOAD_OPTIONS.map((d) => (
            <div key={d.label} className="animated-card" style={downloadCardStyle}>
              <p style={{ fontSize: 12, fontWeight: 700, color: d.color, marginBottom: 16, textTransform: 'uppercase' }}>{d.label}</p>
              <div style={{ display: 'flex', gap: 8 }}>
                <InteractiveButton label="TXT" onClick={() => {}} />
                <InteractiveButton label="DOCX" color={d.color} onClick={() => downloadDocx(d.text, `${baseName}_${d.label.toLowerCase()}`)} />
              </div>
            </div>
          ))}
        </div>

        {/* Preview */}
        <div style={gridStyle}>
          <PreviewCard title="Original" icon={<BookOpen size={16} />} text={result.original_text} />
          <PreviewCard title="Translation" icon={<Globe size={16} />} text={result.english_text} />
        </div>
      </div>
    </div>
  );
}

// ─── Styles & Components ──────────────────────────────────────────

function InteractiveButton({ label, color, onClick }: { label: string, color?: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      style={{
        ...baseBtn,
        background: color || '#f1f5f9',
        color: color ? '#fff' : '#475569',
        border: color ? 'none' : '1px solid #e2e8f0',
      }}
    >
      {label === 'DOCX' && <FileText size={14}/>} {label}
    </button>
  );
}

function PreviewCard({ title, icon, text }: { title: string, icon: JSX.Element, text: string }) {
  return (
    <div className="animated-card" style={previewCardStyle}>
      <h3 style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: 8, color: '#64748b', marginBottom: '20px' }}>{icon} {title}</h3>
      <div style={{ flex: 1, overflowY: 'auto', fontSize: '15px', lineHeight: '1.7', color: '#334155', paddingRight: '12px' }}>
        <pre style={{ fontFamily: "'Inter', sans-serif", whiteSpace: 'pre-wrap', margin: 0 }}>{text}</pre>
      </div>
    </div>
  );
}

// Strictly Typed Styles
const pageContainerStyle: CSSProperties = { minHeight: '100vh', background: '#f8fafc', color: '#1e293b', padding: '40px 20px', fontFamily: "'Inter', sans-serif" };
const contentWrapperStyle: CSSProperties = { maxWidth: 900, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 32 };
const headerStyle: CSSProperties = { display: 'flex', alignItems: 'center', gap: 16 };
const gridStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 };
const backBtnStyle: CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', border: '1px solid #e2e8f0', cursor: 'pointer', padding: 10, borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' };
const downloadCardStyle: CSSProperties = { background: '#fff', padding: 20, borderRadius: 20, border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' };
const previewCardStyle: CSSProperties = { background: '#ffffff', padding: '32px', borderRadius: '24px', border: '1px solid #e2e8f0', height: '600px', display: 'flex', flexDirection: 'column', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)' };
const baseBtn: CSSProperties = { flex: 1, padding: '10px', borderRadius: '10px', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer', transition: 'all 0.2s ease' };