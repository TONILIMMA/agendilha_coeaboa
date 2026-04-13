
-- Add new columns to submissions
ALTER TABLE public.submissions
  ADD COLUMN IF NOT EXISTS sale_price text,
  ADD COLUMN IF NOT EXISTS maintenance_cost text,
  ADD COLUMN IF NOT EXISTS subscription_info text,
  ADD COLUMN IF NOT EXISTS commission text,
  ADD COLUMN IF NOT EXISTS stage text NOT NULL DEFAULT 'development',
  ADD COLUMN IF NOT EXISTS concept_description text,
  ADD COLUMN IF NOT EXISTS responsible_person text DEFAULT 'Toni',
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
