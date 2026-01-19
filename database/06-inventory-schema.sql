-- ==============================================================================
-- DAKINO - MIGRACIÓN DE INVENTARIO
-- ==============================================================================
-- Este archivo añade el sistema de inventario a la base de datos
-- Es IDEMPOTENTE: seguro ejecutar múltiples veces
--
-- Cómo ejecutar:
-- 1. Supabase Dashboard → SQL Editor → New query
-- 2. Copiar TODO el contenido de este archivo
-- 3. Pegar y ejecutar
--
-- Versión: 1.0.0
-- Fecha: 2026-01-18
-- ==============================================================================

BEGIN;

-- ==============================================================================
-- TABLAS DE INVENTARIO
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

-- ==============================================================================
-- ÍNDICES PARA PERFORMANCE
-- ==============================================================================

CREATE INDEX IF NOT EXISTS idx_inventory_items_user ON inventory_items(user_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_status ON inventory_items(user_id, status);
CREATE INDEX IF NOT EXISTS idx_inventory_items_location ON inventory_items(location_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_expiration ON inventory_items(user_id, expiration_date) WHERE expiration_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_inventory_items_product ON inventory_items(product_id);
CREATE INDEX IF NOT EXISTS idx_consumption_logs_item ON consumption_logs(inventory_item_id);
CREATE INDEX IF NOT EXISTS idx_storage_locations_user ON storage_locations(user_id);

-- ==============================================================================
-- TRIGGERS
-- ==============================================================================

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

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ==============================================================================

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

-- Ubicaciones de almacenamiento por defecto (globales)
INSERT INTO storage_locations (name, icon, color, sort_order, is_default, user_id) VALUES
  ('Despensa', '🗄️', '#F59E0B', 1, TRUE, NULL),
  ('Nevera', '❄️', '#0EA5E9', 2, TRUE, NULL),
  ('Congelador', '🧊', '#6366F1', 3, TRUE, NULL),
  ('Otros', '📦', '#9333EA', 4, TRUE, NULL)
ON CONFLICT DO NOTHING;

COMMIT;

-- ==============================================================================
-- VERIFICACIÓN
-- ==============================================================================

-- Verificar que las tablas existen
SELECT
  'storage_locations' as tabla,
  COUNT(*) as registros
FROM storage_locations
UNION ALL
SELECT
  'inventory_items' as tabla,
  COUNT(*) as registros
FROM inventory_items
UNION ALL
SELECT
  'consumption_logs' as tabla,
  COUNT(*) as registros
FROM consumption_logs;

-- ==============================================================================
-- ✅ MIGRACIÓN DE INVENTARIO COMPLETADA
-- ==============================================================================
