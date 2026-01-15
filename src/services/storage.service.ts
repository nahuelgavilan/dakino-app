import { supabase } from './supabase';

export class StorageService {
  private BUCKET_NAME = import.meta.env.VITE_SUPABASE_STORAGE_BUCKET || 'product-images';

  async uploadProductImage(userId: string, file: File): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${crypto.randomUUID()}.${fileExt}`;

    // Comprimir imagen antes de subir (opcional)
    const compressedFile = await this.compressImage(file);

    const { error: uploadError } = await supabase.storage
      .from(this.BUCKET_NAME)
      .upload(fileName, compressedFile, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) throw uploadError;

    // Obtener URL pública
    const { data } = supabase.storage
      .from(this.BUCKET_NAME)
      .getPublicUrl(fileName);

    return data.publicUrl;
  }

  async deleteProductImage(imageUrl: string): Promise<void> {
    const path = this.extractPathFromUrl(imageUrl);
    if (!path) return;

    const { error } = await supabase.storage
      .from(this.BUCKET_NAME)
      .remove([path]);

    if (error) throw error;
  }

  async updateProductImage(
    userId: string,
    oldImageUrl: string | null,
    newFile: File
  ): Promise<string> {
    // Eliminar imagen anterior si existe
    if (oldImageUrl) {
      try {
        await this.deleteProductImage(oldImageUrl);
      } catch (error) {
        console.error('Error deleting old image:', error);
      }
    }

    // Subir nueva imagen
    return this.uploadProductImage(userId, newFile);
  }

  private async compressImage(file: File): Promise<File> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              resolve(new File([blob!], file.name, { type: 'image/jpeg' }));
            },
            'image/jpeg',
            0.85
          );
        };
      };
    });
  }

  private extractPathFromUrl(url: string): string | null {
    try {
      const urlParts = url.split(`${this.BUCKET_NAME}/`);
      return urlParts[1] || null;
    } catch {
      return null;
    }
  }

  async listUserImages(userId: string): Promise<string[]> {
    const { data, error } = await supabase.storage
      .from(this.BUCKET_NAME)
      .list(userId, {
        limit: 100,
        offset: 0,
        sortBy: { column: 'created_at', order: 'desc' },
      });

    if (error) throw error;

    return data.map((file) => {
      const { data: urlData } = supabase.storage
        .from(this.BUCKET_NAME)
        .getPublicUrl(`${userId}/${file.name}`);
      return urlData.publicUrl;
    });
  }
}

export const storageService = new StorageService();
