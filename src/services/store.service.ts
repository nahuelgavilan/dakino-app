import { supabase } from './supabase';
import type { Store, StoreInsert, StoreUpdate } from '@/types/models';

export class StoreService {
  async getStores(userId: string): Promise<Store[]> {
    const { data, error } = await supabase
      .from('stores')
      .select('*')
      .eq('user_id', userId)
      .order('is_favorite', { ascending: false })
      .order('name', { ascending: true });

    if (error) throw error;
    return data as Store[];
  }

  async getStoreById(id: string): Promise<Store | null> {
    const { data, error } = await supabase
      .from('stores')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as Store;
  }

  async createStore(store: StoreInsert): Promise<Store> {
    const { data, error } = await supabase
      .from('stores')
      .insert(store)
      .select()
      .single();

    if (error) throw error;
    return data as Store;
  }

  async updateStore(id: string, updates: StoreUpdate): Promise<Store> {
    const { data, error } = await supabase
      .from('stores')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Store;
  }

  async deleteStore(id: string): Promise<void> {
    const { error } = await supabase
      .from('stores')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async toggleFavorite(id: string, isFavorite: boolean): Promise<void> {
    const { error } = await supabase
      .from('stores')
      .update({ is_favorite: isFavorite })
      .eq('id', id);

    if (error) throw error;
  }

  // Create default stores for a new user (if not already created by trigger)
  async ensureDefaultStores(userId: string): Promise<void> {
    const { error } = await supabase.rpc('create_default_stores', {
      p_user_id: userId,
    });

    if (error) {
      console.error('Error creating default stores:', error);
      // Not critical, can fail silently
    }
  }
}

export const storeService = new StoreService();
