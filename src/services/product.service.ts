import { supabase } from './supabase';
import type { Product, ProductInsert, ProductUpdate } from '@/types/models';

export class ProductService {
  async getProducts(userId: string): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select(
        `
        *,
        category:categories(*)
      `
      )
      .eq('user_id', userId)
      .order('last_used_at', { ascending: false, nullsFirst: false });

    if (error) throw error;
    return data as Product[];
  }

  async getProductById(id: string): Promise<Product | null> {
    const { data, error } = await supabase
      .from('products')
      .select(
        `
        *,
        category:categories(*)
      `
      )
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as Product;
  }

  async searchProducts(userId: string, query: string): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select(
        `
        *,
        category:categories(*)
      `
      )
      .eq('user_id', userId)
      .ilike('name', `%${query}%`)
      .order('usage_count', { ascending: false })
      .limit(10);

    if (error) throw error;
    return data as Product[];
  }

  async getFrequentProducts(userId: string, limit = 10): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select(
        `
        *,
        category:categories(*)
      `
      )
      .eq('user_id', userId)
      .order('usage_count', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data as Product[];
  }

  async createProduct(product: ProductInsert): Promise<Product> {
    const { data, error } = await supabase
      .from('products')
      .insert(product)
      .select()
      .single();

    if (error) throw error;
    return data as Product;
  }

  async updateProduct(id: string, updates: ProductUpdate): Promise<Product> {
    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Product;
  }

  async deleteProduct(id: string): Promise<void> {
    const { error } = await supabase.from('products').delete().eq('id', id);

    if (error) throw error;
  }
}

export const productService = new ProductService();
