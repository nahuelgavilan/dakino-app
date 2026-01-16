import { supabase } from './supabase';
import type { Purchase, PurchaseInsert, PurchaseUpdate } from '@/types/models';

export class PurchaseService {
  async getAllPurchases(userId: string): Promise<Purchase[]> {
    const { data, error } = await supabase
      .from('purchases')
      .select(
        `
        *,
        category:categories(*),
        tags:purchase_tags(tag:tags(*))
      `
      )
      .eq('user_id', userId)
      .order('purchase_date', { ascending: false });

    if (error) throw error;
    return data as Purchase[];
  }

  async getRecentPurchases(userId: string, limit = 5): Promise<Purchase[]> {
    const { data, error } = await supabase
      .from('purchases')
      .select(
        `
        *,
        category:categories(*),
        tags:purchase_tags(tag:tags(*))
      `
      )
      .eq('user_id', userId)
      .order('purchase_date', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data as Purchase[];
  }

  async getPurchases(
    userId: string,
    filters?: {
      startDate?: Date;
      endDate?: Date;
      categoryIds?: string[];
      tagIds?: string[];
    }
  ): Promise<Purchase[]> {
    let query = supabase
      .from('purchases')
      .select(
        `
        *,
        category:categories(*),
        tags:purchase_tags(tag:tags(*))
      `
      )
      .eq('user_id', userId)
      .order('purchase_date', { ascending: false });

    if (filters?.startDate) {
      query = query.gte('purchase_date', filters.startDate.toISOString().split('T')[0]);
    }

    if (filters?.endDate) {
      query = query.lte('purchase_date', filters.endDate.toISOString().split('T')[0]);
    }

    if (filters?.categoryIds && filters.categoryIds.length > 0) {
      query = query.in('category_id', filters.categoryIds);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data as Purchase[];
  }

  async getPurchaseById(id: string): Promise<Purchase | null> {
    const { data, error } = await supabase
      .from('purchases')
      .select(
        `
        *,
        category:categories(*),
        tags:purchase_tags(tag:tags(*))
      `
      )
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as Purchase;
  }

  async createPurchase(purchase: PurchaseInsert): Promise<Purchase> {
    const { data, error } = await supabase
      .from('purchases')
      .insert(purchase)
      .select()
      .single();

    if (error) throw error;
    return data as Purchase;
  }

  async updatePurchase(
    id: string,
    updates: PurchaseUpdate
  ): Promise<Purchase> {
    const { data, error } = await supabase
      .from('purchases')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Purchase;
  }

  async deletePurchase(id: string): Promise<void> {
    const { error } = await supabase.from('purchases').delete().eq('id', id);

    if (error) throw error;
  }

  async addTagsToPurchase(
    purchaseId: string,
    tagIds: string[]
  ): Promise<void> {
    const purchaseTags = tagIds.map((tagId) => ({
      purchase_id: purchaseId,
      tag_id: tagId,
    }));

    const { error } = await supabase.from('purchase_tags').insert(purchaseTags);

    if (error) throw error;
  }

  async removeTagsFromPurchase(
    purchaseId: string,
    tagIds: string[]
  ): Promise<void> {
    const { error } = await supabase
      .from('purchase_tags')
      .delete()
      .eq('purchase_id', purchaseId)
      .in('tag_id', tagIds);

    if (error) throw error;
  }

  subscribeToUserPurchases(
    userId: string,
    callback: (purchase: Purchase) => void
  ) {
    return supabase
      .channel(`purchases:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'purchases',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          callback(payload.new as Purchase);
        }
      )
      .subscribe();
  }
}

export const purchaseService = new PurchaseService();
