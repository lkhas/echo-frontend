import { Camera, Upload, X, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRef } from 'react';

interface ImageUploaderProps {
  images: File[];
  onImagesChange: (images: File[]) => void;
}

export const ImageUploader = ({ images, onImagesChange }: ImageUploaderProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      onImagesChange([...images, ...Array.from(files)]);
    }
    // Reset input
    if (event.target) {
      event.target.value = '';
    }
  };

  const removeImage = (index: number) => {
    onImagesChange(images.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-foreground">Images</label>
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />
      
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />

      {images.length === 0 ? (
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            className="flex-1 h-24 flex-col gap-2"
            onClick={() => cameraInputRef.current?.click()}
          >
            <Camera className="w-6 h-6" />
            <span className="text-xs">Camera</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            className="flex-1 h-24 flex-col gap-2"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-6 h-6" />
            <span className="text-xs">Upload</span>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            {images.map((image, index) => (
              <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-border">
                <img
                  src={URL.createObjectURL(image)}
                  alt={`Upload ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-1 right-1 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center shadow-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            {images.length < 5 && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary hover:text-primary transition-colors"
              >
                <ImageIcon className="w-5 h-5" />
                <span className="text-xs">Add</span>
              </button>
            )}
          </div>
          <p className="text-xs text-muted-foreground text-center">
            {images.length}/5 images
          </p>
        </div>
      )}
    </div>
  );
};
