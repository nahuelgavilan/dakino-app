-- ==============================================================================
-- CATEGORÍAS POR DEFECTO
-- ==============================================================================
-- Este archivo crea categorías por defecto para cada usuario nuevo

-- Agregar constraint UNIQUE para prevenir duplicados
ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_user_id_name_key;
ALTER TABLE categories ADD CONSTRAINT categories_user_id_name_key UNIQUE (user_id, name);

-- Función para crear categorías por defecto
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

-- Nota: Esta función se llama desde el trigger en 02-auth-trigger.sql
