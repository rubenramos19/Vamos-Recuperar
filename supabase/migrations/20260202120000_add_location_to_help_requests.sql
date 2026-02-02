-- Migration: add location columns to help_requests and ensure created_at default
BEGIN;

-- Add latitude/longitude columns (double precision)
ALTER TABLE IF EXISTS public.help_requests
  ADD COLUMN IF NOT EXISTS location_latitude double precision,
  ADD COLUMN IF NOT EXISTS location_longitude double precision;

-- Ensure created_at exists and has a default of now()
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'help_requests' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE public.help_requests
      ADD COLUMN created_at timestamptz DEFAULT now();
  ELSE
    -- If the column exists but has no default, set it to now()
    BEGIN
      ALTER TABLE public.help_requests ALTER COLUMN created_at SET DEFAULT now();
    EXCEPTION WHEN undefined_column THEN
      -- ignore if column unexpectedly missing
      NULL;
    END;
  END IF;
END
$$;

-- OPTIONAL: If you use Row Level Security (RLS), consider enabling it and
-- adding a policy that allows authenticated inserts. Run these only if you
-- understand RLS and have a `user_id` column on `help_requests`.
--
-- ALTER TABLE public.help_requests ENABLE ROW LEVEL SECURITY;
--
-- CREATE POLICY allow_authenticated_inserts ON public.help_requests
--   FOR INSERT
--   WITH CHECK (
--     auth.uid() IS NOT NULL AND (user_id = auth.uid() OR user_id IS NULL)
--   );

COMMIT;
