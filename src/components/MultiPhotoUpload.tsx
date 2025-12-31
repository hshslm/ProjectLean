import React, { useCallback, useRef } from 'react';
import { Plus, X, Camera, Image } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface PhotoItem {
  file: File;
  preview: string;
}

interface MultiPhotoUploadProps {
  photos: PhotoItem[];
  onPhotosChange: (photos: PhotoItem[]) => void;
  maxPhotos?: number;
  disabled?: boolean;
}

export const MultiPhotoUpload: React.FC<MultiPhotoUploadProps> = ({
  photos,
  onPhotosChange,
  maxPhotos = 4,
  disabled = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return;
    if (photos.length >= maxPhotos) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      onPhotosChange([...photos, { file, preview: reader.result as string }]);
    };
    reader.readAsDataURL(file);
  }, [photos, maxPhotos, onPhotosChange]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(handleFile);
    e.target.value = '';
  }, [handleFile]);

  const removePhoto = (index: number) => {
    onPhotosChange(photos.filter((_, i) => i !== index));
  };

  const canAddMore = photos.length < maxPhotos;

  if (photos.length === 0) {
    return (
      <div className="space-y-3">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleInputChange}
          disabled={disabled}
          className="hidden"
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleInputChange}
          disabled={disabled}
          className="hidden"
        />

        <div
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer",
            "h-48 sm:h-56 flex flex-col items-center justify-center gap-3",
            "border-border bg-card hover:border-sage/50 hover:bg-sage-light/30",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          <div className="p-3 rounded-full bg-sage-light">
            <Image className="w-6 h-6 text-sage" />
          </div>
          <div className="text-center px-4">
            <p className="text-foreground font-medium mb-0.5">
              Add meal photos
            </p>
            <p className="text-sm text-muted-foreground">
              Up to {maxPhotos} photos for better accuracy
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="sage"
          size="lg"
          onClick={() => cameraInputRef.current?.click()}
          disabled={disabled}
          className="w-full"
        >
          <Camera className="w-5 h-5" />
          Take a photo
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleInputChange}
        disabled={disabled}
        className="hidden"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleInputChange}
        disabled={disabled}
        className="hidden"
      />

      <div className="grid grid-cols-2 gap-3">
        {photos.map((photo, index) => (
          <div
            key={index}
            className="relative rounded-xl overflow-hidden aspect-square shadow-soft animate-fade-up"
          >
            <img
              src={photo.preview}
              alt={`Meal photo ${index + 1}`}
              className="w-full h-full object-cover"
            />
            <button
              onClick={() => removePhoto(index)}
              disabled={disabled}
              className={cn(
                "absolute top-2 right-2 p-1.5 rounded-full bg-foreground/80 text-background",
                "hover:bg-foreground transition-colors duration-200",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
              aria-label="Remove photo"
            >
              <X className="w-3 h-3" />
            </button>
            {index === 0 && (
              <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full bg-sage text-white text-xs font-medium">
                Main
              </div>
            )}
          </div>
        ))}

        {canAddMore && (
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            className={cn(
              "rounded-xl border-2 border-dashed aspect-square flex flex-col items-center justify-center gap-2",
              "border-border bg-card hover:border-sage/50 hover:bg-sage-light/30 transition-colors",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            <Plus className="w-6 h-6 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Add more</span>
          </button>
        )}
      </div>

      {canAddMore && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => cameraInputRef.current?.click()}
          disabled={disabled}
          className="w-full"
        >
          <Camera className="w-4 h-4" />
          Take another photo
        </Button>
      )}

      <p className="text-xs text-muted-foreground text-center">
        Multiple angles help identify portions and hidden ingredients
      </p>
    </div>
  );
};
