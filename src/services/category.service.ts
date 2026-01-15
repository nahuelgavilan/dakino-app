import { supabase } from './supabase';
import type { Category, CategoryInsert, CategoryUpdate } from '@/types/models';

export class CategoryService {
  async getCategories(userId: string): Promise<Category[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .or(`user_id.eq.${userId},is_default.eq.true`)
      .order('name');

    if (error) throw error;
    return data as Category[];
  }

  async getCategoryById(id: string): Promise<Category | null> {
    const { data, error} = await supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as Category;
  }

  async createCategory(category: CategoryInsert): Promise<Category> {
    const { data, error } = await supabase
      .from('categories')
      .insert(category)
      .select()
      .single();

    if (error) throw error;
    return data as Category;
  }

  async updateCategory(
    id: string,
    updates: CategoryUpdate
  ): Promise<Category> {
    const { data, error } = await supabase
      .from('categories')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Category;
  }

  async deleteCategory(id: string): Promise<void> {
    const { error } = await supabase.from('categories').delete().eq('id', id);

    if (error) throw error;
  }
}

export const categoryService = new CategoryService();
