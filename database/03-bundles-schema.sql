-- ==============================================================================
-- BUNDLES: Sistema de listas de compras predefinidas
-- ==============================================================================

-- TABLA: bundles (listas/plantillas de compras)
CREATE TABLE IF NOT EXISTS bundles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT '📦',
  color TEXT DEFAULT '#FF1744',
  is_favorite BOOLEAN DEFAULT FALSE,
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABLA: bundle_items (productos en cada bundle)
CREATE TABLE IF NOT EXISTS bundle_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bundle_id UUID NOT NULL REFERENCES bundles(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  unit_type TEXT NOT NULL CHECK (unit_type IN ('unit', 'weight')),
  quantity INTEGER,
  weight DECIMAL(10, 3),
  estimated_price DECIMAL(10, 2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- ÍNDICES
-- ==============================================================================

CREATE INDEX IF NOT EXISTS idx_bundles_user ON bundles(user_id);
CREATE INDEX IF NOT EXISTS idx_bundles_favorite ON bundles(user_id, is_favorite) WHERE is_favorite = TRUE;
CREATE INDEX IF NOT EXISTS idx_bundle_items_bundle ON bundle_items(bundle_id);

-- ==============================================================================
-- ROW LEVEL SECURITY
-- ==============================================================================

ALTER TABLE bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bundle_items ENABLE ROW LEVEL SECURITY;

-- POLICIES PARA BUNDLES
DROP POLICY IF EXISTS "Users can view own bundles" ON bundles;
CREATE POLICY "Users can view own bundles" ON bundles
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own bundles" ON bundles;
CREATE POLICY "Users can insert own bundles" ON bundles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own bundles" ON bundles;
CREATE POLICY "Users can update own bundles" ON bundles
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own bundles" ON bundles;
CREATE POLICY "Users can delete own bundles" ON bundles
  FOR DELETE USING (auth.uid() = user_id);

-- POLICIES PARA BUNDLE_ITEMS
DROP POLICY IF EXISTS "Users can view bundle items" ON bundle_items;
CREATE POLICY "Users can view bundle items" ON bundle_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM bundles
      WHERE bundles.id = bundle_items.bundle_id
      AND bundles.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert bundle items" ON bundle_items;
CREATE POLICY "Users can insert bundle items" ON bundle_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM bundles
      WHERE bundles.id = bundle_items.bundle_id
      AND bundles.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update bundle items" ON bundle_items;
CREATE POLICY "Users can update bundle items" ON bundle_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM bundles
      WHERE bundles.id = bundle_items.bundle_id
      AND bundles.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete bundle items" ON bundle_items;
CREATE POLICY "Users can delete bundle items" ON bundle_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM bundles
      WHERE bundles.id = bundle_items.bundle_id
      AND bundles.user_id = auth.uid()
    )
  );

-- ==============================================================================
-- TRIGGERS
-- ==============================================================================

-- Trigger para actualizar updated_at en bundles
DROP TRIGGER IF EXISTS update_bundles_updated_at ON bundles;
CREATE TRIGGER update_bundles_updated_at
  BEFORE UPDATE ON bundles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ==============================================================================
-- FIN DEL SCHEMA DE BUNDLES
-- ==============================================================================
