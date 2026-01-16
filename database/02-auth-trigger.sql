-- ============================================
-- Trigger para crear perfil automáticamente
-- ============================================
-- Cuando un usuario se registra en auth.users,
-- automáticamente se crea su perfil en public.profiles

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

-- Crear trigger en auth.users (solo si no existe)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
