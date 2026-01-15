import { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { storageService } from '@/services/storage.service';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/hooks/useToast';

interface ImageUploadProps {
  currentImage?: string | null;
  onImageUploaded: (url: string) => void;
  onImageRemoved?: () => void;
}

export const ImageUpload = ({ currentImage, onImageUploaded, onImageRemoved }: ImageUploadProps) => {
  const { user } = useAuthStore();
  const { success, error: showError } = useToast();
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentImage || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showError('Por favor selecciona una imagen válida');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showError('La imagen debe ser menor a 5MB');
      return;
    }

    try {
      setUploading(true);

      // Show preview immediately
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Upload to Supabase
      const imageUrl = await storageService.uploadProductImage(user.id, file);

      onImageUploaded(imageUrl);
      success('Imagen subida correctamente');
    } catch (err) {
      console.error('Error uploading image:', err);
      showError('Error al subir la imagen');
      setPreview(currentImage || null);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = async () => {
    if (!currentImage) {
      setPreview(null);
      if (onImageRemoved) onImageRemoved();
      return;
    }

    try {
      setUploading(true);
      await storageService.deleteProductImage(currentImage);
      setPreview(null);
      if (onImageRemoved) onImageRemoved();
      success('Imagen eliminada');
    } catch (err) {
      console.error('Error deleting image:', err);
      showError('Error al eliminar la imagen');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Preview */}
      {preview ? (
        <div className="relative group">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-48 object-cover rounded-2xl shadow-md"
          />

          {/* Overlay with actions */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="p-3 bg-white/90 rounded-xl hover:bg-white transition-colors disabled:opacity-50"
            >
              <Upload size={20} className="text-neutral-700" />
            </button>
            <button
              type="button"
              onClick={handleRemoveImage}
              disabled={uploading}
              className="p-3 bg-red-500/90 rounded-xl hover:bg-red-500 transition-colors disabled:opacity-50"
            >
              <X size={20} className="text-white" />
            </button>
          </div>

          {uploading && (
            <div className="absolute inset-0 bg-black/60 rounded-2xl flex items-center justify-center">
              <Loader2 size={32} className="text-white animate-spin" />
            </div>
          )}
        </div>
      ) : (
        /* Upload button */
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="w-full h-48 border-2 border-dashed border-neutral-300 rounded-2xl hover:border-primary-500 transition-colors flex flex-col items-center justify-center gap-3 text-neutral-500 hover:text-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? (
            <>
              <Loader2 size={48} className="animate-spin" />
              <p className="font-semibold">Subiendo imagen...</p>
            </>
          ) : (
            <>
              <ImageIcon size={48} />
              <div className="text-center">
                <p className="font-semibold">Agregar foto</p>
                <p className="text-sm text-neutral-400 mt-1">
                  Haz clic para seleccionar
                </p>
              </div>
            </>
          )}
        </button>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Helper text */}
      <p className="text-xs text-neutral-500 text-center">
        Formatos: JPG, PNG, GIF. Tamaño máximo: 5MB
      </p>
    </div>
  );
};
