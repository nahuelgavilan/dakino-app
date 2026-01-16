/**
 * Open Food Facts API Service
 *
 * API pública y gratuita con millones de productos de alimentación
 * Docs: https://world.openfoodfacts.org/data
 *
 * Features:
 * - Búsqueda por nombre
 * - Búsqueda por código de barras
 * - Información nutricional
 * - Imágenes de productos
 * - Categorías
 * - Marcas
 */

export interface OpenFoodFactsProduct {
  code: string; // EAN/Barcode
  product_name: string;
  brands: string;
  categories: string;
  image_url: string;
  image_small_url: string;
  quantity: string;
  stores: string;
  nutriscore_grade?: string;
  ecoscore_grade?: string;
}

export interface SearchResult {
  products: OpenFoodFactsProduct[];
  count: number;
  page: number;
  page_size: number;
  page_count: number;
}

class OpenFoodFactsService {
  private baseUrl = 'https://world.openfoodfacts.org';

  /**
   * Buscar productos por nombre
   */
  async searchProducts(query: string, page = 1, pageSize = 20): Promise<SearchResult> {
    try {
      const url = `${this.baseUrl}/cgi/search.pl?search_terms=${encodeURIComponent(query)}&page=${page}&page_size=${pageSize}&json=true`;

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Dakino App - Personal Shopping Tracker',
        },
      });

      if (!response.ok) {
        throw new Error('Error searching products');
      }

      return await response.json();
    } catch (error) {
      console.error('Error in searchProducts:', error);
      throw error;
    }
  }

  /**
   * Buscar producto por código de barras
   */
  async getProductByBarcode(barcode: string): Promise<OpenFoodFactsProduct | null> {
    try {
      const url = `${this.baseUrl}/api/v2/product/${barcode}`;

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Dakino App - Personal Shopping Tracker',
        },
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();

      if (data.status === 1 && data.product) {
        return data.product;
      }

      return null;
    } catch (error) {
      console.error('Error in getProductByBarcode:', error);
      return null;
    }
  }

  /**
   * Buscar productos por categoría
   */
  async getProductsByCategory(category: string, page = 1): Promise<SearchResult> {
    try {
      const url = `${this.baseUrl}/category/${encodeURIComponent(category)}/${page}.json`;

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Dakino App - Personal Shopping Tracker',
        },
      });

      if (!response.ok) {
        throw new Error('Error fetching category products');
      }

      return await response.json();
    } catch (error) {
      console.error('Error in getProductsByCategory:', error);
      throw error;
    }
  }

  /**
   * Mapear producto de Open Food Facts a formato Dakino
   */
  mapToProductInsert(offProduct: OpenFoodFactsProduct, userId: string, categoryId: string) {
    return {
      user_id: userId,
      name: offProduct.product_name || 'Producto sin nombre',
      category_id: categoryId,
      unit_type: 'unit' as const,
      default_price: null,
      default_unit: offProduct.quantity || null,
      image_url: offProduct.image_small_url || offProduct.image_url || null,
      barcode: offProduct.code,
      brand: offProduct.brands?.split(',')[0]?.trim() || null,
      // Metadata adicional que puedes guardar en un campo JSON si lo agregas
      metadata: {
        nutriscore: offProduct.nutriscore_grade,
        ecoscore: offProduct.ecoscore_grade,
        stores: offProduct.stores,
      },
    };
  }
}

export const openFoodFactsService = new OpenFoodFactsService();
