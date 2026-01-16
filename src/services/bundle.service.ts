import { supabase } from './supabase';
import { purchaseService } from './purchase.service';
import type { Bundle, BundleInsert, BundleUpdate, BundleItem, BundleItemInsert, PurchaseInsert } from '@/types/models';

export class BundleService {
  async getBundles(userId: string): Promise<Bundle[]> {
    const { data, error } = await supabase
      .from('bundles')
      .select(`
        *,
        items:bundle_items(*)
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
        items:bundle_items(*)
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

  // Execute bundle: create purchases from all items
  async executeBundle(bundleId: string, userId: string): Promise<void> {
    // Get bundle with items
    const bundle = await this.getBundleById(bundleId);
    if (!bundle || !bundle.items || bundle.items.length === 0) {
      throw new Error('Bundle not found or has no items');
    }

    // Create purchases for each item
    const purchasePromises = bundle.items.map((item) => {
      const purchase: PurchaseInsert = {
        user_id: userId,
        product_id: item.product_id,
        product_name: item.product_name,
        category_id: item.category_id,
        store_id: null,
        unit_type: item.unit_type,
        quantity: item.quantity,
        weight: item.weight,
        unit_price: item.unit_type === 'unit' ? item.estimated_price : null,
        price_per_unit: item.unit_type === 'weight' ? item.estimated_price : null,
        total_price: item.unit_type === 'unit'
          ? (item.quantity || 0) * (item.estimated_price || 0)
          : (item.weight || 0) * (item.estimated_price || 0),
        purchase_date: new Date().toISOString().split('T')[0],
        notes: item.notes,
        image_url: null,
      };

      return purchaseService.createPurchase(purchase);
    });

    await Promise.all(purchasePromises);

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
