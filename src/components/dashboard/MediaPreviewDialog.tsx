import { useState } from 'react';
import { ChevronLeft, ChevronRight, Volume2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface MediaPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  images: string[];
  audioUrl?: string;
  title: string;
}

export const MediaPreviewDialog = ({
  open,
  onOpenChange,
  images,
  audioUrl,
  title,
}: MediaPreviewDialogProps) => {
  const [currentImage, setCurrentImage] = useState(0);

  const prev = () => setCurrentImage((i) => (i > 0 ? i - 1 : images.length - 1));
  const next = () => setCurrentImage((i) => (i < images.length - 1 ? i + 1 : 0));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent style={{
        maxWidth: '680px', borderRadius: '20px', padding: 0, overflow: 'hidden',
        background: '#fffbf5', border: '1.5px solid #fde68a',
        boxShadow: '0 24px 64px rgba(15,118,110,0.18)',
      }}>
        <DialogHeader style={{ padding: '20px 20px 0' }}>
          <DialogTitle style={{ fontSize: '1.1rem', color: '#1c1917' }}>{title}</DialogTitle>
        </DialogHeader>

        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Image Carousel */}
          {images.length > 0 && (
            <div style={{ position: 'relative', borderRadius: '14px', overflow: 'hidden', background: 'rgba(236,253,245,0.4)' }}>
              <img
                src={images[currentImage]}
                alt={`Photo ${currentImage + 1}`}
                style={{ width: '100%', height: '350px', objectFit: 'cover' }}
              />
              {images.length > 1 && (
                <>
                  <Button
                    variant="secondary"
                    size="icon"
                    style={{
                      position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)',
                      borderRadius: '50%', background: 'rgba(255,251,245,0.85)',
                      backdropFilter: 'blur(8px)', boxShadow: '0 2px 12px rgba(15,118,110,0.2)',
                      border: '1px solid #fde68a', color: '#0f766e',
                    }}
                    onClick={prev}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    style={{
                      position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)',
                      borderRadius: '50%', background: 'rgba(255,251,245,0.85)',
                      backdropFilter: 'blur(8px)', boxShadow: '0 2px 12px rgba(15,118,110,0.2)',
                      border: '1px solid #fde68a', color: '#0f766e',
                    }}
                    onClick={next}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                  <div style={{
                    position: 'absolute', bottom: '12px', left: '50%', transform: 'translateX(-50%)',
                    display: 'flex', gap: '6px',
                  }}>
                    {images.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentImage(i)}
                        style={{
                          height: '6px', borderRadius: '100px',
                          width: i === currentImage ? '24px' : '6px',
                          background: i === currentImage ? '#0f766e' : 'rgba(255,255,255,0.7)',
                          transition: 'all 0.2s', border: 'none', cursor: 'pointer', padding: 0,
                        }}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Audio Player */}
          {audioUrl && (
            <div style={{
              borderRadius: '14px',
              background: 'rgba(236,253,245,0.5)',
              border: '1px solid #a7f3d0',
              padding: '16px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div style={{
                  padding: '8px', borderRadius: '10px',
                  background: 'rgba(15,118,110,0.1)',
                  color: '#0f766e', display: 'flex', alignItems: 'center',
                }}>
                  <Volume2 size={16} />
                </div>
                <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#1c1917' }}>Audio Recording</span>
              </div>
              <audio controls style={{ width: '100%' }} preload="none">
                <source src={audioUrl} type="audio/mpeg" />
                Your browser does not support audio playback.
              </audio>
            </div>
          )}

          {!images.length && !audioUrl && (
            <p style={{ textAlign: 'center', color: '#78716c', padding: '32px 0' }}>No media attached to this observation.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};