-- Stores/Tiendas System
-- Permite asociar productos y compras a tiendas específicas

-- Stores table
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

-- Insert default stores (supermercados comunes en España)
-- Nota: Estos se crean por usuario, así que cada usuario tendrá su lista
-- Puedes ejecutar esto manualmente para cada usuario o crear una función

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
