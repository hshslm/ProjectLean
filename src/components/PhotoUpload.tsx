import React, { useCallback, useState, useRef } from 'react';
import { Upload, Camera, X, Image } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface PhotoUploadProps {
  onImageSelect: (file: File, preview: string) => void;
  onImageClear: () => void;
  preview: string | null;
  disabled?: boolean;
}

export const PhotoUpload: React.FC<PhotoUploadProps> = ({
  onImageSelect,
  onImageClear,
  preview,
  disabled = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onImageSelect(file, reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, [onImageSelect]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [disabled, handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const openCamera = () => {
    cameraInputRef.current?.click();
  };

  if (preview) {
    return (
      <div className="relative rounded-2xl overflow-hidden shadow-elevated animate-fade-up">
        <img
          src={preview}
          alt="Meal preview"
          className="w-full h-64 sm:h-80 object-cover"
        />
        <button
          onClick={onImageClear}
          disabled={disabled}
          className={cn(
            "absolute top-3 right-3 p-2 rounded-full bg-foreground/80 text-background",
            "hover:bg-foreground transition-colors duration-200",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
          aria-label="Remove image"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Main drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={openFilePicker}
        className={cn(
          "relative rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer",
          "h-48 sm:h-56 flex flex-col items-center justify-center gap-3",
          isDragging
            ? "border-sage bg-sage-light scale-[1.02]"
            : "border-border bg-card hover:border-sage/50 hover:bg-sage-light/30",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        {/* Hidden file inputs */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleInputChange}
          disabled={disabled}
          className="hidden"
          aria-label="Upload meal photo"
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleInputChange}
          disabled={disabled}
          className="hidden"
          aria-label="Take photo with camera"
        />
        
        <div className={cn(
          "p-3 rounded-full transition-colors duration-300",
          isDragging ? "bg-sage/20" : "bg-sage-light"
        )}>
          <Image className="w-6 h-6 text-sage" />
        </div>
        
        <div className="text-center px-4">
          <p className="text-foreground font-medium mb-0.5">
            Drop your meal photo here
          </p>
          <p className="text-sm text-muted-foreground">
            or tap to browse gallery
          </p>
        </div>
      </div>

      {/* Camera button - prominent for mobile */}
      <Button
        type="button"
        variant="sage"
        size="lg"
        onClick={openCamera}
        disabled={disabled}
        className="w-full"
      >
        <Camera className="w-5 h-5" />
        Take a photo
      </Button>
    </div>
  );
};
