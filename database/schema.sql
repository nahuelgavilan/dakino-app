-- DAKINO DATABASE SCHEMA
-- PostgreSQL + Supabase
-- Este script crea todas las tablas, índices, triggers y políticas RLS necesarias

-- ==============================================================================
-- TABLAS
-- ==============================================================================

-- TABLA: profiles (extiende auth.users de Supabase)
-- Note: id references auth.users(id) but we don't enforce FK at DB level
-- since auth.users is managed by GoTrue migrations
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABLA: categories (categorías de productos)
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  icon TEXT, -- emoji o nombre de icono
  color TEXT, -- hex color para UI vibrante
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABLA: tags (etiquetas personalizadas)
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  color TEXT,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- TABLA: products (catálogo reutilizable)
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  unit_type TEXT NOT NULL CHECK (unit_type IN ('unit', 'weight')), -- UNIDAD o PESO
  default_price DECIMAL(10, 2),
  default_unit TEXT, -- 'kg', 'g', 'l', 'ml', 'unidad'
  image_url TEXT,
  last_used_at TIMESTAMPTZ,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABLA: purchases (compras registradas)
CREATE TABLE IF NOT EXISTS purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL, -- desnormalizado para histórico
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,

  -- Campos para UNIDAD
  quantity INTEGER,
  unit_price DECIMAL(10, 2),

  -- Campos para PESO/GRANEL
  weight DECIMAL(10, 3), -- peso en kg o litros
  price_per_unit DECIMAL(10, 2), -- precio por kg/litro
  unit_type TEXT NOT NULL CHECK (unit_type IN ('unit', 'weight')),

  total_price DECIMAL(10, 2) NOT NULL,
  purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABLA: purchase_tags (relación muchos a muchos)
CREATE TABLE IF NOT EXISTS purchase_tags (
  purchase_id UUID REFERENCES purchases(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (purchase_id, tag_id)
);

-- ==============================================================================
-- ÍNDICES PARA PERFORMANCE
-- ==============================================================================

CREATE INDEX IF NOT EXISTS idx_purchases_user_date ON purchases(user_id, purchase_date DESC);
CREATE INDEX IF NOT EXISTS idx_purchases_category ON purchases(category_id);
CREATE INDEX IF NOT EXISTS idx_purchases_product ON purchases(product_id);
CREATE INDEX IF NOT EXISTS idx_products_user ON products(user_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_last_used ON products(user_id, last_used_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_categories_user ON categories(user_id);
CREATE INDEX IF NOT EXISTS idx_tags_user ON tags(user_id);

-- ==============================================================================
-- FUNCIONES Y TRIGGERS
-- ==============================================================================

-- FUNCIÓN: Actualizar timestamp updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- TRIGGER: Actualizar updated_at en profiles
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- TRIGGER: Actualizar updated_at en products
DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- TRIGGER: Actualizar updated_at en purchases
DROP TRIGGER IF EXISTS update_purchases_updated_at ON purchases;
CREATE TRIGGER update_purchases_updated_at
  BEFORE UPDATE ON purchases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- FUNCIÓN: Actualizar uso de producto
CREATE OR REPLACE FUNCTION update_product_usage()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.product_id IS NOT NULL THEN
    UPDATE products
    SET last_used_at = NOW(),
        usage_count = usage_count + 1
    WHERE id = NEW.product_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- TRIGGER: Actualizar usage al crear purchase
DROP TRIGGER IF EXISTS update_product_usage_trigger ON purchases;
CREATE TRIGGER update_product_usage_trigger
  AFTER INSERT ON purchases
  FOR EACH ROW EXECUTE FUNCTION update_product_usage();

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ==============================================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_tags ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- POLICIES PARA PROFILES
-- ==============================================================================

DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- ==============================================================================
-- POLICIES PARA CATEGORIES
-- ==============================================================================

DROP POLICY IF EXISTS "Users can view own and default categories" ON categories;
CREATE POLICY "Users can view own and default categories" ON categories
  FOR SELECT USING (auth.uid() = user_id OR is_default = TRUE OR user_id IS NULL);

DROP POLICY IF EXISTS "Users can insert own categories" ON categories;
CREATE POLICY "Users can insert own categories" ON categories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own categories" ON categories;
CREATE POLICY "Users can update own categories" ON categories
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own categories" ON categories;
CREATE POLICY "Users can delete own categories" ON categories
  FOR DELETE USING (auth.uid() = user_id);

-- ==============================================================================
-- POLICIES PARA TAGS
-- ==============================================================================

DROP POLICY IF EXISTS "Users can view own tags" ON tags;
CREATE POLICY "Users can view own tags" ON tags
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own tags" ON tags;
CREATE POLICY "Users can insert own tags" ON tags
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own tags" ON tags;
CREATE POLICY "Users can update own tags" ON tags
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own tags" ON tags;
CREATE POLICY "Users can delete own tags" ON tags
  FOR DELETE USING (auth.uid() = user_id);

-- ==============================================================================
-- POLICIES PARA PRODUCTS
-- ==============================================================================

DROP POLICY IF EXISTS "Users can view own products" ON products;
CREATE POLICY "Users can view own products" ON products
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own products" ON products;
CREATE POLICY "Users can insert own products" ON products
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own products" ON products;
CREATE POLICY "Users can update own products" ON products
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own products" ON products;
CREATE POLICY "Users can delete own products" ON products
  FOR DELETE USING (auth.uid() = user_id);

-- ==============================================================================
-- POLICIES PARA PURCHASES
-- ==============================================================================

DROP POLICY IF EXISTS "Users can view own purchases" ON purchases;
CREATE POLICY "Users can view own purchases" ON purchases
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own purchases" ON purchases;
CREATE POLICY "Users can insert own purchases" ON purchases
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own purchases" ON purchases;
CREATE POLICY "Users can update own purchases" ON purchases
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own purchases" ON purchases;
CREATE POLICY "Users can delete own purchases" ON purchases
  FOR DELETE USING (auth.uid() = user_id);

-- ==============================================================================
-- POLICIES PARA PURCHASE_TAGS
-- ==============================================================================

DROP POLICY IF EXISTS "Users can view own purchase tags" ON purchase_tags;
CREATE POLICY "Users can view own purchase tags" ON purchase_tags
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM purchases
      WHERE id = purchase_id AND user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert own purchase tags" ON purchase_tags;
CREATE POLICY "Users can insert own purchase tags" ON purchase_tags
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM purchases
      WHERE id = purchase_id AND user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete own purchase tags" ON purchase_tags;
CREATE POLICY "Users can delete own purchase tags" ON purchase_tags
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM purchases
      WHERE id = purchase_id AND user_id = auth.uid()
    )
  );

-- ==============================================================================
-- SISTEMA DE INVENTARIO
-- ==============================================================================

-- TABLA: storage_locations (ubicaciones de almacenamiento)
CREATE TABLE IF NOT EXISTS storage_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT DEFAULT '📦',
  color TEXT DEFAULT '#6366F1',
  sort_order INTEGER DEFAULT 0,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABLA: inventory_items (items en inventario/casa)
CREATE TABLE IF NOT EXISTS inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  purchase_id UUID REFERENCES purchases(id) ON DELETE SET NULL,

  -- Cantidades
  initial_quantity DECIMAL(10, 3) NOT NULL,
  current_quantity DECIMAL(10, 3) NOT NULL,
  unit TEXT NOT NULL DEFAULT 'unidades',

  -- Estado y ubicación
  location_id UUID REFERENCES storage_locations(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'in_stock' CHECK (status IN ('in_stock', 'low', 'empty')),
  minimum_quantity DECIMAL(10, 3) DEFAULT 1,

  -- Fechas
  expiration_date DATE,
  opened_at TIMESTAMPTZ,

  -- Metadata
  notes TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABLA: consumption_logs (historial de consumo)
CREATE TABLE IF NOT EXISTS consumption_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  amount_consumed DECIMAL(10, 3) NOT NULL,
  consumed_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT
);

-- Índices para inventario
CREATE INDEX IF NOT EXISTS idx_inventory_items_user ON inventory_items(user_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_status ON inventory_items(user_id, status);
CREATE INDEX IF NOT EXISTS idx_inventory_items_location ON inventory_items(location_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_expiration ON inventory_items(user_id, expiration_date) WHERE expiration_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_inventory_items_product ON inventory_items(product_id);
CREATE INDEX IF NOT EXISTS idx_consumption_logs_item ON consumption_logs(inventory_item_id);
CREATE INDEX IF NOT EXISTS idx_storage_locations_user ON storage_locations(user_id);

-- TRIGGER: Actualizar updated_at en inventory_items
DROP TRIGGER IF EXISTS update_inventory_items_updated_at ON inventory_items;
CREATE TRIGGER update_inventory_items_updated_at
  BEFORE UPDATE ON inventory_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- FUNCIÓN: Actualizar estado de inventario basado en cantidad
CREATE OR REPLACE FUNCTION update_inventory_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.current_quantity <= 0 THEN
    NEW.status := 'empty';
  ELSIF NEW.current_quantity <= NEW.minimum_quantity THEN
    NEW.status := 'low';
  ELSE
    NEW.status := 'in_stock';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- TRIGGER: Actualizar status automáticamente
DROP TRIGGER IF EXISTS update_inventory_status_trigger ON inventory_items;
CREATE TRIGGER update_inventory_status_trigger
  BEFORE INSERT OR UPDATE OF current_quantity, minimum_quantity ON inventory_items
  FOR EACH ROW EXECUTE FUNCTION update_inventory_status();

-- RLS para storage_locations
ALTER TABLE storage_locations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own and default locations" ON storage_locations;
CREATE POLICY "Users can view own and default locations" ON storage_locations
  FOR SELECT USING (auth.uid() = user_id OR is_default = TRUE OR user_id IS NULL);

DROP POLICY IF EXISTS "Users can insert own locations" ON storage_locations;
CREATE POLICY "Users can insert own locations" ON storage_locations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own locations" ON storage_locations;
CREATE POLICY "Users can update own locations" ON storage_locations
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own locations" ON storage_locations;
CREATE POLICY "Users can delete own locations" ON storage_locations
  FOR DELETE USING (auth.uid() = user_id);

-- RLS para inventory_items
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own inventory" ON inventory_items;
CREATE POLICY "Users can view own inventory" ON inventory_items
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own inventory" ON inventory_items;
CREATE POLICY "Users can insert own inventory" ON inventory_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own inventory" ON inventory_items;
CREATE POLICY "Users can update own inventory" ON inventory_items
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own inventory" ON inventory_items;
CREATE POLICY "Users can delete own inventory" ON inventory_items
  FOR DELETE USING (auth.uid() = user_id);

-- RLS para consumption_logs
ALTER TABLE consumption_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own consumption logs" ON consumption_logs;
CREATE POLICY "Users can view own consumption logs" ON consumption_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM inventory_items
      WHERE id = inventory_item_id AND user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert own consumption logs" ON consumption_logs;
CREATE POLICY "Users can insert own consumption logs" ON consumption_logs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM inventory_items
      WHERE id = inventory_item_id AND user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete own consumption logs" ON consumption_logs;
CREATE POLICY "Users can delete own consumption logs" ON consumption_logs
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM inventory_items
      WHERE id = inventory_item_id AND user_id = auth.uid()
    )
  );

-- ==============================================================================
-- DATOS PREDEFINIDOS
-- ==============================================================================

-- Categorías por defecto
INSERT INTO categories (name, icon, color, is_default, user_id) VALUES
  ('Alimentos', '🍎', '#10B981', TRUE, NULL),
  ('Limpieza', '🧹', '#0EA5E9', TRUE, NULL),
  ('Salud', '💊', '#FF1744', TRUE, NULL),
  ('Hogar', '🏠', '#F59E0B', TRUE, NULL),
  ('Ropa', '👕', '#9333EA', TRUE, NULL),
  ('Entretenimiento', '🎮', '#EC4899', TRUE, NULL),
  ('Transporte', '🚗', '#3B82F6', TRUE, NULL),
  ('Tecnología', '📱', '#6366F1', TRUE, NULL)
ON CONFLICT DO NOTHING;

-- Ubicaciones de almacenamiento por defecto
INSERT INTO storage_locations (name, icon, color, sort_order, is_default, user_id) VALUES
  ('Despensa', '🗄️', '#F59E0B', 1, TRUE, NULL),
  ('Nevera', '❄️', '#0EA5E9', 2, TRUE, NULL),
  ('Congelador', '🧊', '#6366F1', 3, TRUE, NULL),
  ('Otros', '📦', '#9333EA', 4, TRUE, NULL)
ON CONFLICT DO NOTHING;

-- ==============================================================================
-- FIN DEL SCHEMA
-- ==============================================================================
