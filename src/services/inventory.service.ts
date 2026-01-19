import { supabase } from './supabase';
import type {
  InventoryItem,
  InventoryItemInsert,
  InventoryItemUpdate,
  StorageLocation,
  ConsumptionLog,
  ConsumptionLogInsert,
} from '@/types/models';

export class InventoryService {
  // ==============================================================================
  // STORAGE LOCATIONS
  // ==============================================================================

  async getStorageLocations(): Promise<StorageLocation[]> {
    const { data, error } = await supabase
      .from('storage_locations')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return data as StorageLocation[];
  }

  // ==============================================================================
  // INVENTORY ITEMS
  // ==============================================================================

  async getInventoryItems(
    userId: string,
    filters?: {
      status?: 'in_stock' | 'low' | 'empty' | 'all';
      locationId?: string;
      expiringWithinDays?: number;
    }
  ): Promise<InventoryItem[]> {
    let query = supabase
      .from('inventory_items')
      .select(`
        *,
        category:categories(*),
        location:storage_locations(*)
      `)
      .eq('user_id', userId);

    if (filters?.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }

    if (filters?.locationId) {
      query = query.eq('location_id', filters.locationId);
    }

    if (filters?.expiringWithinDays) {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + filters.expiringWithinDays);
      query = query
        .not('expiration_date', 'is', null)
        .lte('expiration_date', futureDate.toISOString().split('T')[0]);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return data as InventoryItem[];
  }

  async getInventoryItemById(id: string): Promise<InventoryItem | null> {
    const { data, error } = await supabase
      .from('inventory_items')
      .select(`
        *,
        category:categories(*),
        location:storage_locations(*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as InventoryItem;
  }

  async createInventoryItem(item: InventoryItemInsert): Promise<InventoryItem> {
    const { data, error } = await supabase
      .from('inventory_items')
      .insert(item)
      .select(`
        *,
        category:categories(*),
        location:storage_locations(*)
      `)
      .single();

    if (error) throw error;
    return data as InventoryItem;
  }

  /**
   * Añade al inventario de forma inteligente:
   * - Si ya existe un item con mismo producto + ubicación + caducidad → suma cantidades
   * - Si no existe → crea nuevo item
   */
  async addOrMergeInventoryItem(item: InventoryItemInsert): Promise<InventoryItem> {
    // Buscar item existente con misma combinación
    let query = supabase
      .from('inventory_items')
      .select('*')
      .eq('user_id', item.user_id)
      .eq('product_id', item.product_id)
      .neq('status', 'empty'); // No combinar con items vacíos

    // Filtrar por ubicación
    if (item.location_id) {
      query = query.eq('location_id', item.location_id);
    } else {
      query = query.is('location_id', null);
    }

    // Filtrar por fecha de caducidad
    if (item.expiration_date) {
      query = query.eq('expiration_date', item.expiration_date);
    } else {
      query = query.is('expiration_date', null);
    }

    const { data: existingItems, error: searchError } = await query;

    if (searchError) throw searchError;

    // Si existe, actualizar cantidad
    if (existingItems && existingItems.length > 0) {
      const existing = existingItems[0];
      const newQuantity = existing.current_quantity + item.current_quantity;
      const newInitial = existing.initial_quantity + item.initial_quantity;

      return this.updateInventoryItem(existing.id, {
        current_quantity: newQuantity,
        initial_quantity: newInitial,
        // Actualizar purchase_id al más reciente
        purchase_id: item.purchase_id || existing.purchase_id,
      });
    }

    // Si no existe, crear nuevo
    return this.createInventoryItem(item);
  }

  async updateInventoryItem(id: string, updates: InventoryItemUpdate): Promise<InventoryItem> {
    const { data, error } = await supabase
      .from('inventory_items')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        category:categories(*),
        location:storage_locations(*)
      `)
      .single();

    if (error) throw error;
    return data as InventoryItem;
  }

  async deleteInventoryItem(id: string): Promise<void> {
    const { error } = await supabase
      .from('inventory_items')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // ==============================================================================
  // CONSUMPTION
  // ==============================================================================

  async consumeItem(
    itemId: string,
    amount: number,
    notes?: string
  ): Promise<InventoryItem> {
    // Get current item
    const item = await this.getInventoryItemById(itemId);
    if (!item) throw new Error('Item not found');

    const newQuantity = Math.max(0, item.current_quantity - amount);

    // Log consumption
    await supabase.from('consumption_logs').insert({
      inventory_item_id: itemId,
      amount_consumed: amount,
      notes: notes || null,
    } as ConsumptionLogInsert);

    // Update item quantity (status will be auto-updated by trigger)
    return this.updateInventoryItem(itemId, {
      current_quantity: newQuantity,
    });
  }

  async markAsFinished(itemId: string): Promise<InventoryItem> {
    const item = await this.getInventoryItemById(itemId);
    if (!item) throw new Error('Item not found');

    // Log final consumption
    if (item.current_quantity > 0) {
      await supabase.from('consumption_logs').insert({
        inventory_item_id: itemId,
        amount_consumed: item.current_quantity,
        notes: 'Marked as finished',
      } as ConsumptionLogInsert);
    }

    return this.updateInventoryItem(itemId, {
      current_quantity: 0,
    });
  }

  async markAsOpened(itemId: string): Promise<InventoryItem> {
    return this.updateInventoryItem(itemId, {
      opened_at: new Date().toISOString(),
    });
  }

  // ==============================================================================
  // STATISTICS
  // ==============================================================================

  async getExpiringItems(userId: string, withinDays = 7): Promise<InventoryItem[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + withinDays);
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('inventory_items')
      .select(`
        *,
        category:categories(*),
        location:storage_locations(*)
      `)
      .eq('user_id', userId)
      .neq('status', 'empty')
      .not('expiration_date', 'is', null)
      .gte('expiration_date', today)
      .lte('expiration_date', futureDate.toISOString().split('T')[0])
      .order('expiration_date', { ascending: true });

    if (error) throw error;
    return data as InventoryItem[];
  }

  async getLowStockItems(userId: string): Promise<InventoryItem[]> {
    const { data, error } = await supabase
      .from('inventory_items')
      .select(`
        *,
        category:categories(*),
        location:storage_locations(*)
      `)
      .eq('user_id', userId)
      .eq('status', 'low')
      .order('current_quantity', { ascending: true });

    if (error) throw error;
    return data as InventoryItem[];
  }

  async getInventoryStats(userId: string): Promise<{
    total: number;
    inStock: number;
    low: number;
    empty: number;
    expiringSoon: number;
  }> {
    const items = await this.getInventoryItems(userId);
    const expiringItems = await this.getExpiringItems(userId, 7);

    return {
      total: items.length,
      inStock: items.filter((i) => i.status === 'in_stock').length,
      low: items.filter((i) => i.status === 'low').length,
      empty: items.filter((i) => i.status === 'empty').length,
      expiringSoon: expiringItems.length,
    };
  }

  async getConsumptionLogs(itemId: string): Promise<ConsumptionLog[]> {
    const { data, error } = await supabase
      .from('consumption_logs')
      .select('*')
      .eq('inventory_item_id', itemId)
      .order('consumed_at', { ascending: false });

    if (error) throw error;
    return data as ConsumptionLog[];
  }
}

export const inventoryService = new InventoryService();
