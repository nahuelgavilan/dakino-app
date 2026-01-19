import { supabase } from './supabase';
import type { Product } from '@/types/models';

// Types for OCR results
export interface OCRItem {
  name: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface OCRResult {
  store_name: string | null;
  date: string | null;
  items: OCRItem[];
  total: number;
}

export interface MatchedOCRItem extends OCRItem {
  matchedProduct: Product | null;
  confidence: 'exact' | 'partial' | 'none';
}

export interface ProcessedOCRResult {
  store_name: string | null;
  date: string | null;
  items: MatchedOCRItem[];
  total: number;
}

// Normalize text for comparison
const normalizeText = (text: string): string => {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9\s]/g, '') // Remove special chars
    .trim();
};

// Calculate similarity between two strings (simple Levenshtein-based)
const similarity = (s1: string, s2: string): number => {
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;

  if (longer.length === 0) return 1.0;

  // Check if one contains the other
  if (longer.includes(shorter) || shorter.includes(longer)) {
    return shorter.length / longer.length;
  }

  // Simple word matching
  const words1 = s1.split(/\s+/);
  const words2 = s2.split(/\s+/);
  const commonWords = words1.filter(w => words2.some(w2 => w2.includes(w) || w.includes(w2)));

  return commonWords.length / Math.max(words1.length, words2.length);
};

export const ocrService = {
  /**
   * Scan a ticket image and extract purchase data
   */
  async scanTicket(imageBase64: string): Promise<OCRResult> {
    console.log('Calling scan-ticket function, image size:', imageBase64.length);

    const { data, error } = await supabase.functions.invoke('scan-ticket', {
      body: { image: imageBase64 }
    });

    console.log('Response:', { data, error });

    if (error) {
      console.error('OCR invoke error:', error);
      throw new Error(`Error al invocar función: ${error.message || JSON.stringify(error)}`);
    }

    if (data?.error) {
      console.error('OCR data error:', data);
      throw new Error(`Error del servidor: ${data.error}${data.details ? ' - ' + data.details : ''}`);
    }

    return data as OCRResult;
  },

  /**
   * Match a single OCR item name to existing products
   */
  matchProductByName(name: string, products: Product[]): { product: Product | null; confidence: 'exact' | 'partial' | 'none' } {
    const normalizedName = normalizeText(name);

    // Try exact match first
    const exactMatch = products.find(p => normalizeText(p.name) === normalizedName);
    if (exactMatch) {
      return { product: exactMatch, confidence: 'exact' };
    }

    // Try partial match
    let bestMatch: Product | null = null;
    let bestScore = 0;

    for (const product of products) {
      const normalizedProductName = normalizeText(product.name);
      const score = similarity(normalizedName, normalizedProductName);

      if (score > bestScore && score > 0.4) { // Minimum 40% match
        bestScore = score;
        bestMatch = product;
      }
    }

    if (bestMatch && bestScore > 0.6) {
      return { product: bestMatch, confidence: 'partial' };
    }

    return { product: null, confidence: 'none' };
  },

  /**
   * Process OCR results and match with existing products
   */
  processOCRResult(ocrResult: OCRResult, products: Product[]): ProcessedOCRResult {
    const matchedItems: MatchedOCRItem[] = ocrResult.items.map(item => {
      const match = this.matchProductByName(item.name, products);
      return {
        ...item,
        matchedProduct: match.product,
        confidence: match.confidence
      };
    });

    return {
      ...ocrResult,
      items: matchedItems
    };
  },

  /**
   * Compress image to base64 for OCR
   */
  async imageToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_SIZE = 1200; // Max dimension for OCR

          let width = img.width;
          let height = img.height;

          // Scale down if needed
          if (width > height && width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          } else if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          // Convert to base64 (JPEG for smaller size)
          const base64 = canvas.toDataURL('image/jpeg', 0.85);
          // Remove the data:image/jpeg;base64, prefix
          resolve(base64.split(',')[1]);
        };
        img.onerror = reject;
      };
      reader.onerror = reject;
    });
  }
};
