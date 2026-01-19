-- ==============================================================================
-- DAKINO - MIGRACIÓN DE HOGARES COMPARTIDOS
-- ==============================================================================
-- Este archivo añade el sistema de hogares compartidos a la base de datos
-- Permite que múltiples usuarios compartan productos, inventario, compras, etc.
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
-- TABLA: households (hogares)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS households (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT 'Mi Hogar',
  invite_code TEXT UNIQUE,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para búsqueda por código de invitación
CREATE INDEX IF NOT EXISTS idx_households_invite_code ON households(invite_code) WHERE invite_code IS NOT NULL;

-- Trigger para updated_at
DROP TRIGGER IF EXISTS update_households_updated_at ON households;
CREATE TRIGGER update_households_updated_at
  BEFORE UPDATE ON households
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ==============================================================================
-- MODIFICAR PROFILES: Añadir household_id
-- ==============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'household_id'
  ) THEN
    ALTER TABLE profiles ADD COLUMN household_id UUID REFERENCES households(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_profiles_household ON profiles(household_id) WHERE household_id IS NOT NULL;

-- ==============================================================================
-- MODIFICAR PRODUCTS: Añadir household_id
-- ==============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'household_id'
  ) THEN
    ALTER TABLE products ADD COLUMN household_id UUID REFERENCES households(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_products_household ON products(household_id);

-- ==============================================================================
-- MODIFICAR PURCHASES: Añadir household_id
-- ==============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'purchases' AND column_name = 'household_id'
  ) THEN
    ALTER TABLE purchases ADD COLUMN household_id UUID REFERENCES households(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_purchases_household ON purchases(household_id);

-- ==============================================================================
-- MODIFICAR CATEGORIES: Añadir household_id
-- ==============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'categories' AND column_name = 'household_id'
  ) THEN
    ALTER TABLE categories ADD COLUMN household_id UUID REFERENCES households(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_categories_household ON categories(household_id);

-- ==============================================================================
-- MODIFICAR STORES: Añadir household_id
-- ==============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stores' AND column_name = 'household_id'
  ) THEN
    ALTER TABLE stores ADD COLUMN household_id UUID REFERENCES households(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_stores_household ON stores(household_id);

-- ==============================================================================
-- MODIFICAR BUNDLES: Añadir household_id
-- ==============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bundles' AND column_name = 'household_id'
  ) THEN
    ALTER TABLE bundles ADD COLUMN household_id UUID REFERENCES households(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_bundles_household ON bundles(household_id);

-- ==============================================================================
-- MODIFICAR INVENTORY_ITEMS: Añadir household_id
-- ==============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'inventory_items' AND column_name = 'household_id'
  ) THEN
    ALTER TABLE inventory_items ADD COLUMN household_id UUID REFERENCES households(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_inventory_items_household ON inventory_items(household_id);

-- ==============================================================================
-- MODIFICAR STORAGE_LOCATIONS: Añadir household_id (para ubicaciones personalizadas)
-- ==============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'storage_locations' AND column_name = 'household_id'
  ) THEN
    ALTER TABLE storage_locations ADD COLUMN household_id UUID REFERENCES households(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_storage_locations_household ON storage_locations(household_id);

-- ==============================================================================
-- FUNCIÓN: Generar código de invitación único
-- ==============================================================================

CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================
-- FUNCIÓN: Crear hogar para usuario
-- ==============================================================================

CREATE OR REPLACE FUNCTION create_household_for_user(
  p_user_id UUID,
  p_name TEXT DEFAULT 'Mi Hogar'
)
RETURNS UUID AS $$
DECLARE
  v_household_id UUID;
  v_invite_code TEXT;
  v_attempts INTEGER := 0;
BEGIN
  -- Generar código único
  LOOP
    v_invite_code := generate_invite_code();
    EXIT WHEN NOT EXISTS (SELECT 1 FROM households WHERE invite_code = v_invite_code);
    v_attempts := v_attempts + 1;
    IF v_attempts > 10 THEN
      RAISE EXCEPTION 'No se pudo generar código único';
    END IF;
  END LOOP;

  -- Crear hogar
  INSERT INTO households (name, invite_code, created_by)
  VALUES (p_name, v_invite_code, p_user_id)
  RETURNING id INTO v_household_id;

  -- Asignar usuario al hogar
  UPDATE profiles SET household_id = v_household_id WHERE id = p_user_id;

  RETURN v_household_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- FUNCIÓN: Unirse a hogar con código
-- ==============================================================================

CREATE OR REPLACE FUNCTION join_household_with_code(
  p_user_id UUID,
  p_invite_code TEXT
)
RETURNS JSON AS $$
DECLARE
  v_household_id UUID;
  v_household_name TEXT;
  v_old_household_id UUID;
BEGIN
  -- Buscar hogar por código
  SELECT id, name INTO v_household_id, v_household_name
  FROM households
  WHERE invite_code = UPPER(TRIM(p_invite_code));

  IF v_household_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Código de invitación inválido');
  END IF;

  -- Obtener hogar anterior del usuario
  SELECT household_id INTO v_old_household_id FROM profiles WHERE id = p_user_id;

  -- Si ya está en este hogar
  IF v_old_household_id = v_household_id THEN
    RETURN json_build_object('success', false, 'error', 'Ya perteneces a este hogar');
  END IF;

  -- Migrar datos del usuario al nuevo hogar
  UPDATE products SET household_id = v_household_id WHERE user_id = p_user_id;
  UPDATE purchases SET household_id = v_household_id WHERE user_id = p_user_id;
  UPDATE categories SET household_id = v_household_id WHERE user_id = p_user_id;
  UPDATE stores SET household_id = v_household_id WHERE user_id = p_user_id;
  UPDATE bundles SET household_id = v_household_id WHERE user_id = p_user_id;
  UPDATE inventory_items SET household_id = v_household_id WHERE user_id = p_user_id;
  UPDATE storage_locations SET household_id = v_household_id WHERE user_id = p_user_id AND is_default = FALSE;

  -- Actualizar perfil del usuario
  UPDATE profiles SET household_id = v_household_id WHERE id = p_user_id;

  -- Eliminar hogar anterior si estaba vacío
  IF v_old_household_id IS NOT NULL THEN
    DELETE FROM households
    WHERE id = v_old_household_id
    AND NOT EXISTS (SELECT 1 FROM profiles WHERE household_id = v_old_household_id);
  END IF;

  RETURN json_build_object(
    'success', true,
    'household_id', v_household_id,
    'household_name', v_household_name
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- FUNCIÓN: Abandonar hogar
-- ==============================================================================

CREATE OR REPLACE FUNCTION leave_household(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  v_old_household_id UUID;
  v_new_household_id UUID;
  v_member_count INTEGER;
BEGIN
  -- Obtener hogar actual
  SELECT household_id INTO v_old_household_id FROM profiles WHERE id = p_user_id;

  IF v_old_household_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'No perteneces a ningún hogar');
  END IF;

  -- Contar miembros del hogar
  SELECT COUNT(*) INTO v_member_count FROM profiles WHERE household_id = v_old_household_id;

  -- Crear nuevo hogar personal
  v_new_household_id := create_household_for_user(p_user_id, 'Mi Hogar');

  -- Mover datos del usuario al nuevo hogar
  UPDATE products SET household_id = v_new_household_id WHERE user_id = p_user_id;
  UPDATE purchases SET household_id = v_new_household_id WHERE user_id = p_user_id;
  UPDATE categories SET household_id = v_new_household_id WHERE user_id = p_user_id;
  UPDATE stores SET household_id = v_new_household_id WHERE user_id = p_user_id;
  UPDATE bundles SET household_id = v_new_household_id WHERE user_id = p_user_id;
  UPDATE inventory_items SET household_id = v_new_household_id WHERE user_id = p_user_id;
  UPDATE storage_locations SET household_id = v_new_household_id WHERE user_id = p_user_id AND is_default = FALSE;

  -- Eliminar hogar anterior si quedó vacío
  DELETE FROM households
  WHERE id = v_old_household_id
  AND NOT EXISTS (SELECT 1 FROM profiles WHERE household_id = v_old_household_id);

  RETURN json_build_object('success', true, 'new_household_id', v_new_household_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- FUNCIÓN: Regenerar código de invitación
-- ==============================================================================

CREATE OR REPLACE FUNCTION regenerate_invite_code(p_household_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_new_code TEXT;
  v_attempts INTEGER := 0;
BEGIN
  LOOP
    v_new_code := generate_invite_code();
    EXIT WHEN NOT EXISTS (SELECT 1 FROM households WHERE invite_code = v_new_code);
    v_attempts := v_attempts + 1;
    IF v_attempts > 10 THEN
      RAISE EXCEPTION 'No se pudo generar código único';
    END IF;
  END LOOP;

  UPDATE households SET invite_code = v_new_code, updated_at = NOW()
  WHERE id = p_household_id;

  RETURN v_new_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- RLS PARA HOUSEHOLDS
-- ==============================================================================

ALTER TABLE households ENABLE ROW LEVEL SECURITY;

-- Ver hogares donde soy miembro
DROP POLICY IF EXISTS "Users can view own household" ON households;
CREATE POLICY "Users can view own household" ON households
  FOR SELECT USING (
    id IN (SELECT household_id FROM profiles WHERE id = auth.uid())
  );

-- Actualizar mi hogar
DROP POLICY IF EXISTS "Users can update own household" ON households;
CREATE POLICY "Users can update own household" ON households
  FOR UPDATE USING (
    id IN (SELECT household_id FROM profiles WHERE id = auth.uid())
  );

-- ==============================================================================
-- ACTUALIZAR RLS DE OTRAS TABLAS PARA USAR HOUSEHOLD
-- ==============================================================================

-- PRODUCTS: Ver productos del hogar
DROP POLICY IF EXISTS "Users can view own products" ON products;
CREATE POLICY "Users can view household products" ON products
  FOR SELECT USING (
    household_id IN (SELECT household_id FROM profiles WHERE id = auth.uid())
    OR household_id IS NULL AND user_id = auth.uid()
  );

DROP POLICY IF EXISTS "Users can insert own products" ON products;
CREATE POLICY "Users can insert household products" ON products
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
  );

DROP POLICY IF EXISTS "Users can update own products" ON products;
CREATE POLICY "Users can update household products" ON products
  FOR UPDATE USING (
    household_id IN (SELECT household_id FROM profiles WHERE id = auth.uid())
    OR household_id IS NULL AND user_id = auth.uid()
  );

DROP POLICY IF EXISTS "Users can delete own products" ON products;
CREATE POLICY "Users can delete household products" ON products
  FOR DELETE USING (
    household_id IN (SELECT household_id FROM profiles WHERE id = auth.uid())
    OR household_id IS NULL AND user_id = auth.uid()
  );

-- PURCHASES: Ver compras del hogar
DROP POLICY IF EXISTS "Users can view own purchases" ON purchases;
CREATE POLICY "Users can view household purchases" ON purchases
  FOR SELECT USING (
    household_id IN (SELECT household_id FROM profiles WHERE id = auth.uid())
    OR household_id IS NULL AND user_id = auth.uid()
  );

DROP POLICY IF EXISTS "Users can insert own purchases" ON purchases;
CREATE POLICY "Users can insert household purchases" ON purchases
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
  );

DROP POLICY IF EXISTS "Users can update own purchases" ON purchases;
CREATE POLICY "Users can update household purchases" ON purchases
  FOR UPDATE USING (
    household_id IN (SELECT household_id FROM profiles WHERE id = auth.uid())
    OR household_id IS NULL AND user_id = auth.uid()
  );

DROP POLICY IF EXISTS "Users can delete own purchases" ON purchases;
CREATE POLICY "Users can delete household purchases" ON purchases
  FOR DELETE USING (
    household_id IN (SELECT household_id FROM profiles WHERE id = auth.uid())
    OR household_id IS NULL AND user_id = auth.uid()
  );

-- CATEGORIES: Ver categorías del hogar
DROP POLICY IF EXISTS "Users can view own categories" ON categories;
CREATE POLICY "Users can view household categories" ON categories
  FOR SELECT USING (
    household_id IN (SELECT household_id FROM profiles WHERE id = auth.uid())
    OR household_id IS NULL AND user_id = auth.uid()
    OR is_default = TRUE
  );

DROP POLICY IF EXISTS "Users can insert own categories" ON categories;
CREATE POLICY "Users can insert household categories" ON categories
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
  );

DROP POLICY IF EXISTS "Users can update own categories" ON categories;
CREATE POLICY "Users can update household categories" ON categories
  FOR UPDATE USING (
    household_id IN (SELECT household_id FROM profiles WHERE id = auth.uid())
    OR household_id IS NULL AND user_id = auth.uid()
  );

DROP POLICY IF EXISTS "Users can delete own categories" ON categories;
CREATE POLICY "Users can delete household categories" ON categories
  FOR DELETE USING (
    household_id IN (SELECT household_id FROM profiles WHERE id = auth.uid())
    OR household_id IS NULL AND user_id = auth.uid()
  );

-- STORES: Ver tiendas del hogar
DROP POLICY IF EXISTS "Users can view own stores" ON stores;
CREATE POLICY "Users can view household stores" ON stores
  FOR SELECT USING (
    household_id IN (SELECT household_id FROM profiles WHERE id = auth.uid())
    OR household_id IS NULL AND user_id = auth.uid()
  );

DROP POLICY IF EXISTS "Users can insert own stores" ON stores;
CREATE POLICY "Users can insert household stores" ON stores
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
  );

DROP POLICY IF EXISTS "Users can update own stores" ON stores;
CREATE POLICY "Users can update household stores" ON stores
  FOR UPDATE USING (
    household_id IN (SELECT household_id FROM profiles WHERE id = auth.uid())
    OR household_id IS NULL AND user_id = auth.uid()
  );

DROP POLICY IF EXISTS "Users can delete own stores" ON stores;
CREATE POLICY "Users can delete household stores" ON stores
  FOR DELETE USING (
    household_id IN (SELECT household_id FROM profiles WHERE id = auth.uid())
    OR household_id IS NULL AND user_id = auth.uid()
  );

-- BUNDLES: Ver bundles del hogar
DROP POLICY IF EXISTS "Users can view own bundles" ON bundles;
CREATE POLICY "Users can view household bundles" ON bundles
  FOR SELECT USING (
    household_id IN (SELECT household_id FROM profiles WHERE id = auth.uid())
    OR household_id IS NULL AND user_id = auth.uid()
  );

DROP POLICY IF EXISTS "Users can insert own bundles" ON bundles;
CREATE POLICY "Users can insert household bundles" ON bundles
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
  );

DROP POLICY IF EXISTS "Users can update own bundles" ON bundles;
CREATE POLICY "Users can update household bundles" ON bundles
  FOR UPDATE USING (
    household_id IN (SELECT household_id FROM profiles WHERE id = auth.uid())
    OR household_id IS NULL AND user_id = auth.uid()
  );

DROP POLICY IF EXISTS "Users can delete own bundles" ON bundles;
CREATE POLICY "Users can delete household bundles" ON bundles
  FOR DELETE USING (
    household_id IN (SELECT household_id FROM profiles WHERE id = auth.uid())
    OR household_id IS NULL AND user_id = auth.uid()
  );

-- INVENTORY_ITEMS: Ver inventario del hogar
DROP POLICY IF EXISTS "Users can view own inventory" ON inventory_items;
CREATE POLICY "Users can view household inventory" ON inventory_items
  FOR SELECT USING (
    household_id IN (SELECT household_id FROM profiles WHERE id = auth.uid())
    OR household_id IS NULL AND user_id = auth.uid()
  );

DROP POLICY IF EXISTS "Users can insert own inventory" ON inventory_items;
CREATE POLICY "Users can insert household inventory" ON inventory_items
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
  );

DROP POLICY IF EXISTS "Users can update own inventory" ON inventory_items;
CREATE POLICY "Users can update household inventory" ON inventory_items
  FOR UPDATE USING (
    household_id IN (SELECT household_id FROM profiles WHERE id = auth.uid())
    OR household_id IS NULL AND user_id = auth.uid()
  );

DROP POLICY IF EXISTS "Users can delete own inventory" ON inventory_items;
CREATE POLICY "Users can delete household inventory" ON inventory_items
  FOR DELETE USING (
    household_id IN (SELECT household_id FROM profiles WHERE id = auth.uid())
    OR household_id IS NULL AND user_id = auth.uid()
  );

-- STORAGE_LOCATIONS: Ver ubicaciones del hogar
DROP POLICY IF EXISTS "Users can view own and default locations" ON storage_locations;
CREATE POLICY "Users can view household locations" ON storage_locations
  FOR SELECT USING (
    is_default = TRUE
    OR household_id IN (SELECT household_id FROM profiles WHERE id = auth.uid())
    OR household_id IS NULL AND user_id = auth.uid()
  );

DROP POLICY IF EXISTS "Users can insert own locations" ON storage_locations;
CREATE POLICY "Users can insert household locations" ON storage_locations
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
  );

DROP POLICY IF EXISTS "Users can update own locations" ON storage_locations;
CREATE POLICY "Users can update household locations" ON storage_locations
  FOR UPDATE USING (
    household_id IN (SELECT household_id FROM profiles WHERE id = auth.uid())
    OR household_id IS NULL AND user_id = auth.uid()
  );

DROP POLICY IF EXISTS "Users can delete own locations" ON storage_locations;
CREATE POLICY "Users can delete household locations" ON storage_locations
  FOR DELETE USING (
    household_id IN (SELECT household_id FROM profiles WHERE id = auth.uid())
    OR household_id IS NULL AND user_id = auth.uid()
  );

COMMIT;

-- ==============================================================================
-- MIGRACIÓN DE DATOS EXISTENTES
-- ==============================================================================
-- Esta parte crea hogares para usuarios existentes y migra sus datos
-- Ejecutar DESPUÉS del COMMIT anterior

DO $$
DECLARE
  v_user RECORD;
  v_household_id UUID;
BEGIN
  -- Para cada usuario sin hogar
  FOR v_user IN
    SELECT id, full_name FROM profiles WHERE household_id IS NULL
  LOOP
    -- Crear hogar para el usuario
    v_household_id := create_household_for_user(v_user.id, COALESCE(v_user.full_name, 'Mi Hogar'));

    -- Migrar todos sus datos al hogar
    UPDATE products SET household_id = v_household_id WHERE user_id = v_user.id AND household_id IS NULL;
    UPDATE purchases SET household_id = v_household_id WHERE user_id = v_user.id AND household_id IS NULL;
    UPDATE categories SET household_id = v_household_id WHERE user_id = v_user.id AND household_id IS NULL;
    UPDATE stores SET household_id = v_household_id WHERE user_id = v_user.id AND household_id IS NULL;
    UPDATE bundles SET household_id = v_household_id WHERE user_id = v_user.id AND household_id IS NULL;
    UPDATE inventory_items SET household_id = v_household_id WHERE user_id = v_user.id AND household_id IS NULL;
    UPDATE storage_locations SET household_id = v_household_id WHERE user_id = v_user.id AND household_id IS NULL AND is_default = FALSE;

    RAISE NOTICE 'Hogar creado para usuario %: %', v_user.id, v_household_id;
  END LOOP;
END $$;

-- ==============================================================================
-- VERIFICACIÓN
-- ==============================================================================

SELECT
  'households' as tabla,
  COUNT(*) as registros
FROM households
UNION ALL
SELECT
  'profiles con hogar' as tabla,
  COUNT(*) as registros
FROM profiles WHERE household_id IS NOT NULL;

-- ==============================================================================
-- ✅ MIGRACIÓN DE HOGARES COMPLETADA
-- ==============================================================================
