-- ==============================================================================
-- DAKINO - SCHEMA COMPLETO PARA PRODUCCIÓN
-- ==============================================================================
-- Este archivo contiene TODO el schema de la base de datos
-- Es IDEMPOTENTE: seguro ejecutar múltiples veces
--
-- Cómo ejecutar:
-- 1. Supabase Dashboard → SQL Editor → New query
-- 2. Copiar TODO el contenido de este archivo
-- 3. Pegar y ejecutar
--
-- Versión: 1.0.0
-- Fecha: 2026-01-16
-- ==============================================================================

BEGIN;

-- ==============================================================================
-- TABLAS PRINCIPALES
-- ==============================================================================

-- TABLA: profiles (extiende auth.users de Supabase)
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
  icon TEXT,
  color TEXT,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- CONSTRAINT: Evitar categorías duplicadas por usuario
ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_user_id_name_key;
ALTER TABLE categories ADD CONSTRAINT categories_user_id_name_key UNIQUE (user_id, name);

-- TABLA: stores (tiendas/supermercados)
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
  store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
  unit_type TEXT NOT NULL CHECK (unit_type IN ('unit', 'weight')),
  default_price DECIMAL(10, 2),
  default_unit TEXT,
  image_url TEXT,
  last_used_at TIMESTAMPTZ,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agregar columna store_id si no existe (para migraciones)
ALTER TABLE products ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES stores(id) ON DELETE SET NULL;

-- TABLA: purchases (compras registradas)
CREATE TABLE IF NOT EXISTS purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
  -- Campos para UNIDAD
  quantity INTEGER,
  unit_price DECIMAL(10, 2),
  -- Campos para PESO/GRANEL
  weight DECIMAL(10, 3),
  price_per_unit DECIMAL(10, 2),
  unit_type TEXT NOT NULL CHECK (unit_type IN ('unit', 'weight')),
  total_price DECIMAL(10, 2) NOT NULL,
  purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agregar columna store_id si no existe (para migraciones)
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES stores(id) ON DELETE SET NULL;

-- TABLA: purchase_tags (relación muchos a muchos)
CREATE TABLE IF NOT EXISTS purchase_tags (
  purchase_id UUID REFERENCES purchases(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (purchase_id, tag_id)
);

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
-- ÍNDICES PARA PERFORMANCE
-- ==============================================================================

CREATE INDEX IF NOT EXISTS idx_purchases_user_date ON purchases(user_id, purchase_date DESC);
CREATE INDEX IF NOT EXISTS idx_purchases_category ON purchases(category_id);
CREATE INDEX IF NOT EXISTS idx_purchases_product ON purchases(product_id);
CREATE INDEX IF NOT EXISTS idx_purchases_store_id ON purchases(store_id);
CREATE INDEX IF NOT EXISTS idx_products_user ON products(user_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_store_id ON products(store_id);
CREATE INDEX IF NOT EXISTS idx_products_last_used ON products(user_id, last_used_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_categories_user ON categories(user_id);
CREATE INDEX IF NOT EXISTS idx_stores_user_id ON stores(user_id);
CREATE INDEX IF NOT EXISTS idx_stores_favorite ON stores(is_favorite DESC);
CREATE INDEX IF NOT EXISTS idx_tags_user ON tags(user_id);
CREATE INDEX IF NOT EXISTS idx_bundles_user ON bundles(user_id);
CREATE INDEX IF NOT EXISTS idx_bundles_favorite ON bundles(user_id, is_favorite) WHERE is_favorite = TRUE;
CREATE INDEX IF NOT EXISTS idx_bundle_items_bundle ON bundle_items(bundle_id);

-- ==============================================================================
-- FUNCIONES Y TRIGGERS GLOBALES
-- ==============================================================================

-- FUNCIÓN: Actualizar timestamp updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Alias para compatibilidad con código antiguo
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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

-- ==============================================================================
-- FUNCIONES PARA DATOS POR DEFECTO
-- ==============================================================================

-- FUNCIÓN: Crear categorías por defecto para un usuario
CREATE OR REPLACE FUNCTION create_default_categories(p_user_id UUID)
RETURNS void AS $$
BEGIN
  INSERT INTO categories (user_id, name, icon, color, is_default) VALUES
    (p_user_id, 'Alimentos', '🍎', '#10B981', true),
    (p_user_id, 'Limpieza', '🧹', '#0EA5E9', true),
    (p_user_id, 'Salud', '💊', '#EF4444', true),
    (p_user_id, 'Hogar', '🏠', '#F59E0B', true),
    (p_user_id, 'Ropa', '👕', '#9333EA', true),
    (p_user_id, 'Entretenimiento', '🎮', '#EC4899', true),
    (p_user_id, 'Transporte', '🚗', '#3B82F6', true),
    (p_user_id, 'Tecnología', '📱', '#F97316', true)
  ON CONFLICT (user_id, name) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- FUNCIÓN: Crear tiendas por defecto para un usuario
CREATE OR REPLACE FUNCTION create_default_stores(p_user_id UUID)
RETURNS void AS $$
BEGIN
  INSERT INTO stores (user_id, name, icon, color, is_favorite) VALUES
    (p_user_id, 'Mercadona', '🛒', '#10B981', false),
    (p_user_id, 'Carrefour', '🏪', '#0EA5E9', false),
    (p_user_id, 'Lidl', '🏬', '#F59E0B', false),
    (p_user_id, 'Aldi', '🏭', '#EF4444', false),
    (p_user_id, 'El Corte Inglés', '🏢', '#9333EA', false),
    (p_user_id, 'Día', '🛍️', '#EC4899', false),
    (p_user_id, 'Eroski', '🏪', '#3B82F6', false),
    (p_user_id, 'Alcampo', '🏬', '#F97316', false)
  ON CONFLICT (user_id, name) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================
-- TRIGGER PRINCIPAL: handle_new_user
-- ==============================================================================
-- Este trigger se ejecuta cuando un nuevo usuario se registra
-- Crea automáticamente: perfil, 8 categorías, 8 tiendas

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- 1. Crear perfil del usuario
  INSERT INTO public.profiles (id, email, full_name, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;

  -- 2. Crear categorías por defecto
  PERFORM create_default_categories(NEW.id);

  -- 3. Crear tiendas/supermercados por defecto
  PERFORM create_default_stores(NEW.id);

  RETURN NEW;
END;
$$;

-- Recrear el trigger en auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- TRIGGERS EN TABLAS
-- ==============================================================================

-- Trigger: updated_at en profiles
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Trigger: updated_at en stores
DROP TRIGGER IF EXISTS update_stores_updated_at ON stores;
DROP TRIGGER IF EXISTS trigger_stores_updated_at ON stores;
CREATE TRIGGER update_stores_updated_at
  BEFORE UPDATE ON stores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Trigger: updated_at en products
DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Trigger: updated_at en purchases
DROP TRIGGER IF EXISTS update_purchases_updated_at ON purchases;
CREATE TRIGGER update_purchases_updated_at
  BEFORE UPDATE ON purchases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Trigger: updated_at en bundles
DROP TRIGGER IF EXISTS update_bundles_updated_at ON bundles;
CREATE TRIGGER update_bundles_updated_at
  BEFORE UPDATE ON bundles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Trigger: Actualizar usage al crear purchase
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
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bundle_items ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- POLICIES: PROFILES
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
-- POLICIES: CATEGORIES
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
-- POLICIES: STORES
-- ==============================================================================

DROP POLICY IF EXISTS "Users can view own stores" ON stores;
CREATE POLICY "Users can view own stores" ON stores
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own stores" ON stores;
CREATE POLICY "Users can create own stores" ON stores
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own stores" ON stores;
CREATE POLICY "Users can update own stores" ON stores
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own stores" ON stores;
CREATE POLICY "Users can delete own stores" ON stores
  FOR DELETE USING (auth.uid() = user_id);

-- ==============================================================================
-- POLICIES: TAGS
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
-- POLICIES: PRODUCTS
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
-- POLICIES: PURCHASES
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
-- POLICIES: PURCHASE_TAGS
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
-- POLICIES: BUNDLES
-- ==============================================================================

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

-- ==============================================================================
-- POLICIES: BUNDLE_ITEMS
-- ==============================================================================

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
-- DATOS POR DEFECTO PARA USUARIOS EXISTENTES
-- ==============================================================================

DO $$
DECLARE
  user_record RECORD;
  cat_count INTEGER;
  store_count INTEGER;
BEGIN
  -- Iterar sobre todos los usuarios existentes
  FOR user_record IN SELECT id, email FROM profiles
  LOOP
    -- Verificar y crear categorías si no tiene
    SELECT COUNT(*) INTO cat_count
    FROM categories
    WHERE user_id = user_record.id;

    IF cat_count = 0 THEN
      PERFORM create_default_categories(user_record.id);
      RAISE NOTICE 'Categorías creadas para: % (%)', user_record.email, user_record.id;
    ELSE
      RAISE NOTICE 'Usuario % ya tiene % categorías (omitido)', user_record.email, cat_count;
    END IF;

    -- Verificar y crear tiendas si no tiene
    SELECT COUNT(*) INTO store_count
    FROM stores
    WHERE user_id = user_record.id;

    IF store_count = 0 THEN
      PERFORM create_default_stores(user_record.id);
      RAISE NOTICE 'Tiendas creadas para: % (%)', user_record.email, user_record.id;
    ELSE
      RAISE NOTICE 'Usuario % ya tiene % tiendas (omitido)', user_record.email, store_count;
    END IF;
  END LOOP;
END $$;

COMMIT;

-- ==============================================================================
-- VERIFICACIÓN FINAL
-- ==============================================================================

-- Ver resumen de usuarios con sus categorías y tiendas
SELECT
  p.email,
  COUNT(DISTINCT c.id) as categorias,
  COUNT(DISTINCT s.id) as tiendas,
  COUNT(DISTINCT pr.id) as productos,
  COUNT(DISTINCT pu.id) as compras
FROM profiles p
LEFT JOIN categories c ON c.user_id = p.id
LEFT JOIN stores s ON s.user_id = p.id
LEFT JOIN products pr ON pr.user_id = p.id
LEFT JOIN purchases pu ON pu.user_id = p.id
GROUP BY p.id, p.email
ORDER BY p.email;

-- ==============================================================================
-- ✅ SCHEMA COMPLETO EJECUTADO
-- ==============================================================================
-- Cada usuario debe tener:
-- - 8 categorías
-- - 8 tiendas
-- - 0+ productos (opcional)
-- - 0+ compras (opcional)
-- ==============================================================================
