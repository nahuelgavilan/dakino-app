import { supabase } from './supabase';
import { purchaseService } from './purchase.service';
import type { Bundle, BundleInsert, BundleUpdate, BundleItem, BundleItemInsert, PurchaseInsert } from '@/types/models';

export class BundleService {
  async getBundles(userId: string): Promise<Bundle[]> {
    const { data, error } = await supabase
      .from('bundles')
      .select(`
        *,
        items:bundle_items(
          *,
          category:categories(id, name, icon, color),
          store:stores(id, name, icon, color)
        )
      `)
      .eq('user_id', userId)
      .order('is_favorite', { ascending: false })
      .order('last_used_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Bundle[];
  }

  async getBundleById(id: string): Promise<Bundle | null> {
    const { data, error } = await supabase
      .from('bundles')
      .select(`
        *,
        items:bundle_items(
          *,
          category:categories(id, name, icon, color),
          store:stores(id, name, icon, color)
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as Bundle;
  }

  async createBundle(bundle: BundleInsert): Promise<Bundle> {
    const { data, error } = await supabase
      .from('bundles')
      .insert(bundle)
      .select()
      .single();

    if (error) throw error;
    return data as Bundle;
  }

  async updateBundle(id: string, updates: BundleUpdate): Promise<Bundle> {
    const { data, error } = await supabase
      .from('bundles')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Bundle;
  }

  async deleteBundle(id: string): Promise<void> {
    const { error } = await supabase
      .from('bundles')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async toggleFavorite(id: string, isFavorite: boolean): Promise<void> {
    const { error } = await supabase
      .from('bundles')
      .update({ is_favorite: isFavorite })
      .eq('id', id);

    if (error) throw error;
  }

  // Bundle Items
  async addItemToBundle(item: BundleItemInsert): Promise<BundleItem> {
    const { data, error } = await supabase
      .from('bundle_items')
      .insert(item)
      .select()
      .single();

    if (error) throw error;
    return data as BundleItem;
  }

  async updateBundleItem(id: string, updates: Partial<BundleItemInsert>): Promise<BundleItem> {
    const { data, error } = await supabase
      .from('bundle_items')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as BundleItem;
  }

  async removeBundleItem(id: string): Promise<void> {
    const { error } = await supabase
      .from('bundle_items')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Execute bundle: create purchases from adjusted items
  async executeBundle(
    bundleId: string,
    userId: string,
    adjustedItems: Array<{
      id: string;
      product_id: string | null;
      product_name: string;
      category_id: string | null;
      store_id: string | null;
      unit_type: 'unit' | 'weight';
      adjusted_quantity?: string;
      adjusted_weight?: string;
      adjusted_price?: string;
      notes: string | null;
    }>,
    purchaseDate: string
  ): Promise<void> {
    // Create purchases for each adjusted item
    const purchasePromises = adjustedItems.map(async (item) => {
      const quantity = item.unit_type === 'unit' ? parseFloat(item.adjusted_quantity || '0') : null;
      const weight = item.unit_type === 'weight' ? parseFloat(item.adjusted_weight || '0') : null;
      const price = parseFloat(item.adjusted_price || '0');

      const total_price = item.unit_type === 'unit'
        ? (quantity || 0) * price
        : (weight || 0) * price;

      const purchase: PurchaseInsert = {
        user_id: userId,
        product_id: item.product_id,
        product_name: item.product_name,
        category_id: item.category_id,
        store_id: item.store_id,
        unit_type: item.unit_type,
        quantity: item.unit_type === 'unit' ? Math.round(quantity || 0) : null,
        weight: item.unit_type === 'weight' ? weight : null,
        unit_price: item.unit_type === 'unit' ? price : null,
        price_per_unit: item.unit_type === 'weight' ? price : null,
        total_price,
        purchase_date: purchaseDate,
        notes: item.notes,
        image_url: null,
      };

      const createdPurchase = await purchaseService.createPurchase(purchase);

      // Update product usage count if product_id exists
      if (item.product_id) {
        await supabase.rpc('increment_product_usage', { product_id: item.product_id });
      }

      return createdPurchase;
    });

    await Promise.all(purchasePromises);

    // Get current bundle to access usage_count
    const bundle = await this.getBundleById(bundleId);
    if (!bundle) throw new Error('Bundle not found');

    // Update bundle usage stats
    await supabase
      .from('bundles')
      .update({
        usage_count: bundle.usage_count + 1,
        last_used_at: new Date().toISOString(),
      })
      .eq('id', bundleId);
  }
}

export const bundleService = new BundleService();
