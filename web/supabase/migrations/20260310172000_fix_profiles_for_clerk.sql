-- Make profiles schema fully compatible with Clerk-first auth flows.
-- - ON CONFLICT (clerk_id) needs a non-partial unique constraint.
-- - New Clerk users should not depend on auth.users(id) FK.
-- - profiles.id should be auto-generated when not provided.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

ALTER TABLE IF EXISTS profiles
  ADD COLUMN IF NOT EXISTS clerk_id TEXT;

-- Normalize duplicate clerk_id values defensively (keep the most recent row).
WITH ranked AS (
  SELECT
    ctid,
    clerk_id,
    ROW_NUMBER() OVER (
      PARTITION BY clerk_id
      ORDER BY created_at DESC NULLS LAST, id
    ) AS rn
  FROM profiles
  WHERE clerk_id IS NOT NULL
)
UPDATE profiles p
SET clerk_id = NULL
FROM ranked r
WHERE p.ctid = r.ctid
  AND r.rn > 1;

-- Replace partial unique index with a plain unique constraint for ON CONFLICT (clerk_id).
DROP INDEX IF EXISTS idx_profiles_clerk_id_unique;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'profiles_clerk_id_key'
      AND conrelid = 'profiles'::regclass
  ) THEN
    ALTER TABLE profiles
      ADD CONSTRAINT profiles_clerk_id_key UNIQUE (clerk_id);
  END IF;
END $$;

-- Remove dependency on Supabase Auth user IDs for new Clerk users.
ALTER TABLE IF EXISTS profiles
  DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Allow profile ID generation when id is not explicitly provided.
ALTER TABLE IF EXISTS profiles
  ALTER COLUMN id SET DEFAULT gen_random_uuid();
