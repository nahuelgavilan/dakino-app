// Tipos para las entidades de la base de datos

export type UnitType = 'unit' | 'weight';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  user_id: string | null;
  is_default: boolean;
  created_at: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string | null;
  user_id: string;
  created_at: string;
}

export interface Product {
  id: string;
  user_id: string;
  name: string;
  category_id: string | null;
  category?: Category;
  unit_type: UnitType;
  default_price: number | null;
  default_unit: string | null;
  image_url: string | null;
  last_used_at: string | null;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

export interface Purchase {
  id: string;
  user_id: string;
  product_id: string | null;
  product_name: string;
  category_id: string | null;
  category?: Category;
  quantity: number | null;
  unit_price: number | null;
  weight: number | null;
  price_per_unit: number | null;
  unit_type: UnitType;
  total_price: number;
  purchase_date: string;
  notes: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
  tags?: PurchaseTag[];
}

export interface PurchaseTag {
  purchase_id: string;
  tag_id: string;
  tag?: Tag;
}

// Tipos para inserciones (sin campos autogenerados)
export type ProfileInsert = Omit<Profile, 'created_at' | 'updated_at'>;
export type CategoryInsert = Omit<Category, 'id' | 'created_at'>;
export type TagInsert = Omit<Tag, 'id' | 'created_at'>;
export type ProductInsert = Omit<Product, 'id' | 'created_at' | 'updated_at' | 'last_used_at' | 'usage_count' | 'category'>;
export type PurchaseInsert = Omit<Purchase, 'id' | 'created_at' | 'updated_at' | 'category' | 'tags'>;

// Tipos para actualizaciones (todos los campos opcionales excepto id)
export type ProfileUpdate = Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>;
export type CategoryUpdate = Partial<Omit<Category, 'id' | 'created_at'>>;
export type TagUpdate = Partial<Omit<Tag, 'id' | 'created_at' | 'user_id'>>;
export type ProductUpdate = Partial<Omit<Product, 'id' | 'created_at' | 'updated_at' | 'user_id' | 'category'>>;
export type PurchaseUpdate = Partial<Omit<Purchase, 'id' | 'created_at' | 'updated_at' | 'user_id' | 'category' | 'tags'>>;
