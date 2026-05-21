-- 009: Calculator fields on properties
ALTER TABLE properties ADD COLUMN IF NOT EXISTS installment_plans    JSONB    DEFAULT '[]';
ALTER TABLE properties ADD COLUMN IF NOT EXISTS mortgage_rate        NUMERIC;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS mortgage_initial_pct SMALLINT;
