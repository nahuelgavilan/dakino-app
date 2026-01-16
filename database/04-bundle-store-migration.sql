-- ==============================================================================
-- MIGRATION: Add store_id to bundle_items
-- ==============================================================================

-- Add store_id column to bundle_items
ALTER TABLE bundle_items
ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES stores(id) ON DELETE SET NULL;

-- Create index for store lookups
CREATE INDEX IF NOT EXISTS idx_bundle_items_store ON bundle_items(store_id);

-- ==============================================================================
-- END MIGRATION
-- ==============================================================================
