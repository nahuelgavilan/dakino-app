-- ============================================================================
-- MIGRACIONES INCREMENTALES - DAKINO APP
-- ============================================================================
-- Ejecuta este archivo si ya tienes la base de datos inicial (schema.sql)
-- Incluye: Bundles, Tags, Stores
-- ============================================================================

-- ============================================================================
-- 1. BUNDLES (Listas de compras reutilizables)
-- ============================================================================

CREATE TABLE IF NOT EXISTS bundles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT '📦',
  color TEXT DEFAULT '#0EA5E9',
  is_favorite BOOLEAN DEFAULT FALSE,
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, name)
);

CREATE TABLE IF NOT EXISTS bundle_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bundle_id UUID NOT NULL REFERENCES bundles(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  unit_type TEXT NOT NULL DEFAULT 'unit',
  quantity INTEGER,
  weight NUMERIC(10, 2),
  estimated_price NUMERIC(10, 2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_bundles_user_id ON bundles(user_id);
CREATE INDEX IF NOT EXISTS idx_bundles_favorite ON bundles(is_favorite DESC);
CREATE INDEX IF NOT EXISTS idx_bundles_usage ON bundles(usage_count DESC);
CREATE INDEX IF NOT EXISTS idx_bundle_items_bundle_id ON bundle_items(bundle_id);
CREATE INDEX IF NOT EXISTS idx_bundle_items_product_id ON bundle_items(product_id);

-- RLS Policies
ALTER TABLE bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bundle_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own bundles" ON bundles;
CREATE POLICY "Users can view own bundles"
  ON bundles FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own bundles" ON bundles;
CREATE POLICY "Users can create own bundles"
  ON bundles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own bundles" ON bundles;
CREATE POLICY "Users can update own bundles"
  ON bundles FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own bundles" ON bundles;
CREATE POLICY "Users can delete own bundles"
  ON bundles FOR DELETE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own bundle items" ON bundle_items;
CREATE POLICY "Users can view own bundle items"
  ON bundle_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM bundles
      WHERE bundles.id = bundle_items.bundle_id
      AND bundles.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create own bundle items" ON bundle_items;
CREATE POLICY "Users can create own bundle items"
  ON bundle_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM bundles
      WHERE bundles.id = bundle_items.bundle_id
      AND bundles.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update own bundle items" ON bundle_items;
CREATE POLICY "Users can update own bundle items"
  ON bundle_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM bundles
      WHERE bundles.id = bundle_items.bundle_id
      AND bundles.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete own bundle items" ON bundle_items;
CREATE POLICY "Users can delete own bundle items"
  ON bundle_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM bundles
      WHERE bundles.id = bundle_items.bundle_id
      AND bundles.user_id = auth.uid()
    )
  );

-- Trigger to update bundles updated_at
DROP TRIGGER IF EXISTS trigger_bundles_updated_at ON bundles;
CREATE TRIGGER trigger_bundles_updated_at
  BEFORE UPDATE ON bundles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


-- ============================================================================
-- 2. TAGS (Etiquetas personalizadas)
-- ============================================================================

CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#0EA5E9',
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, name)
);

CREATE TABLE IF NOT EXISTS purchase_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id UUID NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(purchase_id, tag_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tags_user_id ON tags(user_id);
CREATE INDEX IF NOT EXISTS idx_tags_usage ON tags(usage_count DESC);
CREATE INDEX IF NOT EXISTS idx_purchase_tags_purchase_id ON purchase_tags(purchase_id);
CREATE INDEX IF NOT EXISTS idx_purchase_tags_tag_id ON purchase_tags(tag_id);

-- RLS Policies
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_tags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own tags" ON tags;
CREATE POLICY "Users can view own tags"
  ON tags FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own tags" ON tags;
CREATE POLICY "Users can create own tags"
  ON tags FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own tags" ON tags;
CREATE POLICY "Users can update own tags"
  ON tags FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own tags" ON tags;
CREATE POLICY "Users can delete own tags"
  ON tags FOR DELETE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own purchase tags" ON purchase_tags;
CREATE POLICY "Users can view own purchase tags"
  ON purchase_tags FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM purchases
      WHERE purchases.id = purchase_tags.purchase_id
      AND purchases.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create own purchase tags" ON purchase_tags;
CREATE POLICY "Users can create own purchase tags"
  ON purchase_tags FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM purchases
      WHERE purchases.id = purchase_tags.purchase_id
      AND purchases.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete own purchase tags" ON purchase_tags;
CREATE POLICY "Users can delete own purchase tags"
  ON purchase_tags FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM purchases
      WHERE purchases.id = purchase_tags.purchase_id
      AND purchases.user_id = auth.uid()
    )
  );

-- Trigger to update tags updated_at
DROP TRIGGER IF EXISTS trigger_tags_updated_at ON tags;
CREATE TRIGGER trigger_tags_updated_at
  BEFORE UPDATE ON tags
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


-- ============================================================================
-- 3. STORES (Tiendas/Supermercados)
-- ============================================================================

CREATE TABLE IF NOT EXISTS stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT DEFAULT '🏪',
  color TEXT DEFAULT '#0EA5E9',
  is_favorite BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- Add store_id to products (optional - producto puede estar en varias tiendas)
ALTER TABLE products ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES stores(id) ON DELETE SET NULL;

-- Add store_id to purchases (obligatorio - cada compra es de una tienda específica)
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES stores(id) ON DELETE SET NULL;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_stores_user_id ON stores(user_id);
CREATE INDEX IF NOT EXISTS idx_stores_favorite ON stores(is_favorite DESC);
CREATE INDEX IF NOT EXISTS idx_products_store_id ON products(store_id);
CREATE INDEX IF NOT EXISTS idx_purchases_store_id ON purchases(store_id);

-- RLS Policies
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own stores" ON stores;
CREATE POLICY "Users can view own stores"
  ON stores FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own stores" ON stores;
CREATE POLICY "Users can create own stores"
  ON stores FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own stores" ON stores;
CREATE POLICY "Users can update own stores"
  ON stores FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own stores" ON stores;
CREATE POLICY "Users can delete own stores"
  ON stores FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger to update stores updated_at
DROP TRIGGER IF EXISTS trigger_stores_updated_at ON stores;
CREATE TRIGGER trigger_stores_updated_at
  BEFORE UPDATE ON stores
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Función helper para crear tiendas por defecto para un usuario
CREATE OR REPLACE FUNCTION create_default_stores(p_user_id UUID)
RETURNS void AS $$
BEGIN
  INSERT INTO stores (user_id, name, icon, color) VALUES
    (p_user_id, 'Mercadona', '🛒', '#10B981'),
    (p_user_id, 'Carrefour', '🏪', '#0EA5E9'),
    (p_user_id, 'Lidl', '🏬', '#F59E0B'),
    (p_user_id, 'Aldi', '🏭', '#EF4444'),
    (p_user_id, 'El Corte Inglés', '🏢', '#9333EA'),
    (p_user_id, 'Día', '🛍️', '#EC4899'),
    (p_user_id, 'Eroski', '🏪', '#3B82F6'),
    (p_user_id, 'Alcampo', '🏬', '#F97316')
  ON CONFLICT (user_id, name) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Trigger para crear tiendas por defecto cuando se crea un nuevo perfil
CREATE OR REPLACE FUNCTION create_default_stores_on_signup()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM create_default_stores(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_create_default_stores ON profiles;
CREATE TRIGGER trigger_create_default_stores
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_default_stores_on_signup();


-- ============================================================================
-- MIGRACIONES COMPLETADAS
-- ============================================================================
-- ✅ Bundles (Listas de compras)
-- ✅ Tags (Etiquetas personalizadas)
-- ✅ Stores (Tiendas/supermercados con defaults)
-- ============================================================================
