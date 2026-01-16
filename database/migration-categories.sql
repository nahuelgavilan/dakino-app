-- ==============================================================================
-- MIGRACIÓN: CATEGORÍAS POR DEFECTO
-- ==============================================================================
-- Este script:
-- 1. Agrega constraint UNIQUE a categories
-- 2. Crea la función create_default_categories()
-- 3. Actualiza el trigger handle_new_user() para crear categorías
-- 4. Crea categorías por defecto para usuarios existentes

-- Ejecutar en Supabase SQL Editor

BEGIN;

-- ==============================================================================
-- 1. AGREGAR CONSTRAINT UNIQUE
-- ==============================================================================

ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_user_id_name_key;
ALTER TABLE categories ADD CONSTRAINT categories_user_id_name_key UNIQUE (user_id, name);

-- ==============================================================================
-- 2. CREAR FUNCIÓN PARA CATEGORÍAS POR DEFECTO
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
-- 3. ACTUALIZAR TRIGGER DE AUTENTICACIÓN
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

-- ==============================================================================
-- 4. CREAR CATEGORÍAS PARA USUARIOS EXISTENTES
-- ==============================================================================

DO $$
DECLARE
  user_record RECORD;
BEGIN
  -- Iterar sobre todos los usuarios existentes
  FOR user_record IN SELECT id FROM profiles
  LOOP
    -- Crear categorías para cada usuario
    PERFORM create_default_categories(user_record.id);
    RAISE NOTICE 'Categorías creadas para usuario: %', user_record.id;
  END LOOP;
END $$;

COMMIT;

-- ==============================================================================
-- VERIFICACIÓN
-- ==============================================================================

-- Verificar que las categorías se crearon correctamente
SELECT
  u.email,
  COUNT(c.id) as num_categories
FROM profiles u
LEFT JOIN categories c ON c.user_id = u.id
GROUP BY u.id, u.email
ORDER BY u.email;

-- Debería mostrar 8 categorías por usuario
