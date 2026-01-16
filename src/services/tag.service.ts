import { supabase } from './supabase';
import type { Tag, TagInsert, TagUpdate, PurchaseTagInsert } from '@/types/models';

export class TagService {
  async getTags(userId: string): Promise<Tag[]> {
    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .eq('user_id', userId)
      .order('usage_count', { ascending: false })
      .order('name', { ascending: true });

    if (error) throw error;
    return data as Tag[];
  }

  async getTagById(id: string): Promise<Tag | null> {
    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as Tag;
  }

  async createTag(tag: TagInsert): Promise<Tag> {
    const { data, error } = await supabase
      .from('tags')
      .insert(tag)
      .select()
      .single();

    if (error) throw error;
    return data as Tag;
  }

  async updateTag(id: string, updates: TagUpdate): Promise<Tag> {
    const { data, error } = await supabase
      .from('tags')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Tag;
  }

  async deleteTag(id: string): Promise<void> {
    const { error } = await supabase
      .from('tags')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Purchase Tags operations
  async addTagToPurchase(purchaseId: string, tagId: string): Promise<void> {
    const { error } = await supabase
      .from('purchase_tags')
      .insert({ purchase_id: purchaseId, tag_id: tagId });

    if (error) throw error;
  }

  async removeTagFromPurchase(purchaseId: string, tagId: string): Promise<void> {
    const { error } = await supabase
      .from('purchase_tags')
      .delete()
      .eq('purchase_id', purchaseId)
      .eq('tag_id', tagId);

    if (error) throw error;
  }

  async getPurchaseTags(purchaseId: string): Promise<Tag[]> {
    const { data, error } = await supabase
      .from('purchase_tags')
      .select(`
        tag:tags(*)
      `)
      .eq('purchase_id', purchaseId);

    if (error) throw error;
    return (data.map(item => item.tag).filter(Boolean) as unknown) as Tag[];
  }

  async setTagsForPurchase(purchaseId: string, tagIds: string[]): Promise<void> {
    // Remove all existing tags
    await supabase
      .from('purchase_tags')
      .delete()
      .eq('purchase_id', purchaseId);

    // Add new tags
    if (tagIds.length > 0) {
      const purchaseTags: PurchaseTagInsert[] = tagIds.map(tagId => ({
        purchase_id: purchaseId,
        tag_id: tagId,
      }));

      const { error } = await supabase
        .from('purchase_tags')
        .insert(purchaseTags);

      if (error) throw error;
    }
  }

  // Find or create tag by name
  async findOrCreateTag(userId: string, name: string, color: string = '#0EA5E9'): Promise<Tag> {
    // Try to find existing tag
    const { data: existing, error: findError } = await supabase
      .from('tags')
      .select('*')
      .eq('user_id', userId)
      .ilike('name', name)
      .single();

    if (existing && !findError) {
      return existing as Tag;
    }

    // Create new tag if not found
    return this.createTag({
      user_id: userId,
      name,
      color,
    });
  }
}

export const tagService = new TagService();
