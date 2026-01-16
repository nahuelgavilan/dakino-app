import { supabase } from './supabase';
import type { Purchase, Product, Bundle } from '@/types/models';

export interface SearchResult {
  type: 'purchase' | 'product' | 'bundle';
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  data: Purchase | Product | Bundle;
}

export class SearchService {
  async globalSearch(userId: string, query: string): Promise<SearchResult[]> {
    if (!query || query.length < 2) {
      return [];
    }

    const searchTerm = query.toLowerCase();
    const results: SearchResult[] = [];

    try {
      // Search in purchases
      const { data: purchases } = await supabase
        .from('purchases')
        .select(`
          *,
          category:categories(*)
        `)
        .eq('user_id', userId)
        .ilike('product_name', `%${searchTerm}%`)
        .order('purchase_date', { ascending: false })
        .limit(5);

      if (purchases) {
        purchases.forEach((purchase: Purchase) => {
          results.push({
            type: 'purchase',
            id: purchase.id,
            title: purchase.product_name,
            subtitle: `Compra - $${purchase.total_price.toFixed(2)} - ${new Date(purchase.purchase_date).toLocaleDateString('es')}`,
            icon: '🛒',
            data: purchase,
          });
        });
      }

      // Search in products
      const { data: products } = await supabase
        .from('products')
        .select(`
          *,
          category:categories(*)
        `)
        .eq('user_id', userId)
        .ilike('name', `%${searchTerm}%`)
        .order('usage_count', { ascending: false })
        .limit(5);

      if (products) {
        products.forEach((product: Product) => {
          results.push({
            type: 'product',
            id: product.id,
            title: product.name,
            subtitle: `Producto - ${product.category?.name || 'Sin categoría'} - Usado ${product.usage_count} veces`,
            icon: '📦',
            data: product,
          });
        });
      }

      // Search in bundles
      const { data: bundles } = await supabase
        .from('bundles')
        .select(`
          *,
          items:bundle_items(*)
        `)
        .eq('user_id', userId)
        .ilike('name', `%${searchTerm}%`)
        .order('usage_count', { ascending: false })
        .limit(5);

      if (bundles) {
        bundles.forEach((bundle: Bundle) => {
          results.push({
            type: 'bundle',
            id: bundle.id,
            title: bundle.name,
            subtitle: `Lista - ${bundle.items?.length || 0} productos - Usado ${bundle.usage_count} veces`,
            icon: bundle.icon,
            data: bundle,
          });
        });
      }

      return results;
    } catch (error) {
      console.error('Error in global search:', error);
      return [];
    }
  }
}

export const searchService = new SearchService();
