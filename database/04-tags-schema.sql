-- Tags System
-- Allows users to create custom tags/labels for purchases

-- Tags table
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

-- Purchase tags (many-to-many relationship)
CREATE TABLE IF NOT EXISTS purchase_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id UUID NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(purchase_id, tag_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tags_user_id ON tags(user_id);
CREATE INDEX IF NOT EXISTS idx_tags_usage_count ON tags(usage_count DESC);
CREATE INDEX IF NOT EXISTS idx_purchase_tags_purchase_id ON purchase_tags(purchase_id);
CREATE INDEX IF NOT EXISTS idx_purchase_tags_tag_id ON purchase_tags(tag_id);

-- RLS Policies
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_tags ENABLE ROW LEVEL SECURITY;

-- Tags policies
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

-- Purchase tags policies
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

-- Trigger to update tag usage count
CREATE OR REPLACE FUNCTION update_tag_usage_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE tags
    SET usage_count = usage_count + 1
    WHERE id = NEW.tag_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE tags
    SET usage_count = usage_count - 1
    WHERE id = OLD.tag_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_tag_usage_count ON purchase_tags;
CREATE TRIGGER trigger_update_tag_usage_count
  AFTER INSERT OR DELETE ON purchase_tags
  FOR EACH ROW
  EXECUTE FUNCTION update_tag_usage_count();

-- Trigger to update tags updated_at
DROP TRIGGER IF EXISTS trigger_tags_updated_at ON tags;
CREATE TRIGGER trigger_tags_updated_at
  BEFORE UPDATE ON tags
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
