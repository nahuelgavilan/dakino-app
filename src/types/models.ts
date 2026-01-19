// Tipos para las entidades de la base de datos

export type UnitType = 'unit' | 'weight';

// ==============================================================================
// SISTEMA DE HOGARES COMPARTIDOS
// ==============================================================================

export interface Household {
  id: string;
  name: string;
  invite_code: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  members?: HouseholdMember[];
}

export interface HouseholdMember {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  household_id?: string | null;
  household?: Household;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  user_id: string | null;
  household_id?: string | null;
  is_default: boolean;
  created_at: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  user_id: string;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

export interface Store {
  id: string;
  user_id: string;
  household_id?: string | null;
  name: string;
  icon: string;
  color: string;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  user_id: string;
  household_id?: string | null;
  name: string;
  category_id: string | null;
  category?: Category;
  store_id: string | null;
  store?: Store;
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
  household_id?: string | null;
  product_id: string | null;
  product_name: string;
  category_id: string | null;
  category?: Category;
  store_id: string | null;
  store?: Store;
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
  id: string;
  purchase_id: string;
  tag_id: string;
  created_at: string;
  tag?: Tag;
}

// Tipos para inserciones (sin campos autogenerados)
export type ProfileInsert = Omit<Profile, 'created_at' | 'updated_at'>;
export type CategoryInsert = Omit<Category, 'id' | 'created_at'>;
export type TagInsert = Omit<Tag, 'id' | 'created_at' | 'updated_at' | 'usage_count'>;
export type StoreInsert = Omit<Store, 'id' | 'created_at' | 'updated_at'>;
export type ProductInsert = Omit<Product, 'id' | 'created_at' | 'updated_at' | 'last_used_at' | 'usage_count' | 'category' | 'store'>;
export type PurchaseInsert = Omit<Purchase, 'id' | 'created_at' | 'updated_at' | 'category' | 'store' | 'tags'>;
export type PurchaseTagInsert = Omit<PurchaseTag, 'id' | 'created_at' | 'tag'>;

export interface Bundle {
  id: string;
  user_id: string;
  household_id?: string | null;
  name: string;
  description: string | null;
  icon: string;
  color: string;
  is_favorite: boolean;
  usage_count: number;
  last_used_at: string | null;
  created_at: string;
  updated_at: string;
  items?: BundleItem[];
}

export interface BundleItem {
  id: string;
  bundle_id: string;
  product_id: string | null;
  product_name: string;
  category_id: string | null;
  store_id: string | null;
  unit_type: UnitType;
  quantity: number | null;
  weight: number | null;
  estimated_price: number | null;
  notes: string | null;
  created_at: string;
}

// Tipos para inserciones (sin campos autogenerados)
export type BundleInsert = Omit<Bundle, 'id' | 'created_at' | 'updated_at' | 'usage_count' | 'last_used_at' | 'items'>;
export type BundleItemInsert = Omit<BundleItem, 'id' | 'created_at'>;

// Tipos para actualizaciones (todos los campos opcionales excepto id)
export type ProfileUpdate = Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>;
export type CategoryUpdate = Partial<Omit<Category, 'id' | 'created_at'>>;
export type TagUpdate = Partial<Omit<Tag, 'id' | 'created_at' | 'updated_at' | 'user_id' | 'usage_count'>>;
export type StoreUpdate = Partial<Omit<Store, 'id' | 'created_at' | 'updated_at' | 'user_id'>>;
export type ProductUpdate = Partial<Omit<Product, 'id' | 'created_at' | 'updated_at' | 'user_id' | 'category' | 'store'>>;
export type PurchaseUpdate = Partial<Omit<Purchase, 'id' | 'created_at' | 'updated_at' | 'user_id' | 'category' | 'store' | 'tags'>>;
export type BundleUpdate = Partial<Omit<Bundle, 'id' | 'created_at' | 'updated_at' | 'user_id' | 'items'>>;

// ==============================================================================
// SISTEMA DE INVENTARIO
// ==============================================================================

export type InventoryStatus = 'in_stock' | 'low' | 'empty';

export interface StorageLocation {
  id: string;
  user_id: string | null;
  household_id?: string | null;
  name: string;
  icon: string;
  color: string;
  sort_order: number;
  is_default: boolean;
  created_at: string;
}

export interface InventoryItem {
  id: string;
  user_id: string;
  household_id?: string | null;
  product_id: string | null;
  product_name: string;
  category_id: string | null;
  category?: Category;
  purchase_id: string | null;

  // Cantidades
  initial_quantity: number;
  current_quantity: number;
  unit: string;

  // Estado y ubicación
  location_id: string | null;
  location?: StorageLocation;
  status: InventoryStatus;
  minimum_quantity: number;

  // Fechas
  expiration_date: string | null;
  opened_at: string | null;

  // Metadata
  notes: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface ConsumptionLog {
  id: string;
  inventory_item_id: string;
  amount_consumed: number;
  consumed_at: string;
  notes: string | null;
}

// Tipos para inserciones de inventario
export type StorageLocationInsert = Omit<StorageLocation, 'id' | 'created_at'>;
export type InventoryItemInsert = Omit<InventoryItem, 'id' | 'created_at' | 'updated_at' | 'status' | 'category' | 'location'>;
export type ConsumptionLogInsert = Omit<ConsumptionLog, 'id' | 'consumed_at'>;

// Tipos para actualizaciones de inventario
export type StorageLocationUpdate = Partial<Omit<StorageLocation, 'id' | 'created_at' | 'user_id'>>;
export type InventoryItemUpdate = Partial<Omit<InventoryItem, 'id' | 'created_at' | 'updated_at' | 'user_id' | 'category' | 'location'>>;

// Tipos para hogares
export type HouseholdInsert = Omit<Household, 'id' | 'created_at' | 'updated_at' | 'members'>;
export type HouseholdUpdate = Partial<Omit<Household, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'members'>>;

// Respuesta de unirse a hogar
export interface JoinHouseholdResult {
  success: boolean;
  error?: string;
  household_id?: string;
  household_name?: string;
}

// Respuesta de abandonar hogar
export interface LeaveHouseholdResult {
  success: boolean;
  error?: string;
  new_household_id?: string;
}
