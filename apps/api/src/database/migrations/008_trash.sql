-- Add deleted_at to residential_complexes (currently uses is_active = false for soft delete)
ALTER TABLE residential_complexes ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Migrate existing is_active=false rows to deleted_at
UPDATE residential_complexes SET deleted_at = NOW() WHERE is_active = false AND deleted_at IS NULL;

-- Add deleted_at to demands table if not already there
ALTER TABLE demands ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Index for trash queries
CREATE INDEX IF NOT EXISTS idx_complexes_deleted_at ON residential_complexes(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_demands_deleted_at ON demands(deleted_at) WHERE deleted_at IS NOT NULL;
