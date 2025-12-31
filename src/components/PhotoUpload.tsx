import React, { useCallback, useState } from 'react';
import { Upload, Camera, X, Image } from 'lucide-react';
import { cn } from '@/lib/utils';

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
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={cn(
        "relative rounded-2xl border-2 border-dashed transition-all duration-300",
        "h-64 sm:h-80 flex flex-col items-center justify-center gap-4",
        isDragging
          ? "border-sage bg-sage-light scale-[1.02]"
          : "border-border bg-card hover:border-sage/50 hover:bg-sage-light/30",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <input
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleInputChange}
        disabled={disabled}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        aria-label="Upload meal photo"
      />
      
      <div className={cn(
        "p-4 rounded-full transition-colors duration-300",
        isDragging ? "bg-sage/20" : "bg-sage-light"
      )}>
        <Image className="w-8 h-8 text-sage" />
      </div>
      
      <div className="text-center px-4">
        <p className="text-foreground font-medium mb-1">
          Drop your meal photo here
        </p>
        <p className="text-sm text-muted-foreground">
          or tap to take a photo
        </p>
      </div>
      
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Upload className="w-3.5 h-3.5" /> Upload
        </span>
        <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
        <span className="flex items-center gap-1">
          <Camera className="w-3.5 h-3.5" /> Camera
        </span>
      </div>
    </div>
  );
};
