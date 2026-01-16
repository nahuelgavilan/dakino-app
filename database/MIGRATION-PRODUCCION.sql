-- ==============================================================================
-- MIGRACIÓN COMPLETA PARA PRODUCCIÓN - DAKINO
-- ==============================================================================
-- Este script ejecuta TODAS las migraciones pendientes
-- Ejecutar en: Supabase Dashboard → SQL Editor

BEGIN;

-- ==============================================================================
-- 1. CONSTRAINT UNIQUE PARA CATEGORÍAS
-- ==============================================================================

ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_user_id_name_key;
ALTER TABLE categories ADD CONSTRAINT categories_user_id_name_key UNIQUE (user_id, name);

-- ==============================================================================
-- 2. FUNCIÓN PARA CREAR CATEGORÍAS POR DEFECTO
-- ==============================================================================

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

-- ==============================================================================
-- 3. FUNCIÓN PARA CREAR TIENDAS POR DEFECTO
-- ==============================================================================

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
-- 4. ACTUALIZAR TRIGGER DE AUTENTICACIÓN
-- ==============================================================================

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
  );

  -- 2. Crear categorías por defecto
  PERFORM create_default_categories(NEW.id);

  -- 3. Crear tiendas/supermercados por defecto
  PERFORM create_default_stores(NEW.id);

  RETURN NEW;
END;
$$;

-- Recrear el trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 5. CREAR CATEGORÍAS PARA USUARIOS EXISTENTES
-- ==============================================================================

DO $$
DECLARE
  user_record RECORD;
  cat_count INTEGER;
BEGIN
  -- Iterar sobre todos los usuarios existentes
  FOR user_record IN SELECT id, email FROM profiles
  LOOP
    -- Verificar cuántas categorías tiene
    SELECT COUNT(*) INTO cat_count
    FROM categories
    WHERE user_id = user_record.id;

    IF cat_count = 0 THEN
      -- Crear categorías para este usuario
      PERFORM create_default_categories(user_record.id);
      RAISE NOTICE 'Categorías creadas para: % (%)', user_record.email, user_record.id;
    ELSE
      RAISE NOTICE 'Usuario % ya tiene % categorías (omitido)', user_record.email, cat_count;
    END IF;
  END LOOP;
END $$;

-- ==============================================================================
-- 6. CREAR TIENDAS PARA USUARIOS EXISTENTES
-- ==============================================================================

DO $$
DECLARE
  user_record RECORD;
  store_count INTEGER;
BEGIN
  -- Iterar sobre todos los usuarios existentes
  FOR user_record IN SELECT id, email FROM profiles
  LOOP
    -- Verificar cuántas tiendas tiene
    SELECT COUNT(*) INTO store_count
    FROM stores
    WHERE user_id = user_record.id;

    IF store_count = 0 THEN
      -- Crear tiendas para este usuario
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
  COUNT(DISTINCT s.id) as tiendas
FROM profiles p
LEFT JOIN categories c ON c.user_id = p.id
LEFT JOIN stores s ON s.user_id = p.id
GROUP BY p.id, p.email
ORDER BY p.email;

-- ✅ Resultado esperado:
-- Cada usuario debe tener 8 categorías y 8 tiendas
