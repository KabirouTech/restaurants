-- Create runtime tables/columns that were used by the app but not yet codified
-- in the tracked migration history.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------------
-- Missing columns on existing core tables
-- ---------------------------------------------------------------------------
ALTER TABLE IF EXISTS profiles
  ADD COLUMN IF NOT EXISTS clerk_id TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS invited_by UUID REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'profiles_status_check'
  ) THEN
    ALTER TABLE profiles
      ADD CONSTRAINT profiles_status_check
      CHECK (status IN ('active', 'suspended', 'pending'));
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_clerk_id_unique
  ON profiles(clerk_id)
  WHERE clerk_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- Recipes domain
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS recipe_folders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#e67e22',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS recipes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  folder_id UUID REFERENCES recipe_folders(id) ON DELETE SET NULL,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  servings INTEGER,
  prep_time_minutes INTEGER,
  cook_time_minutes INTEGER,
  instructions TEXT,
  ingredients_list JSONB NOT NULL DEFAULT '[]'::jsonb,
  images TEXT[] NOT NULL DEFAULT '{}'::text[],
  audio_url TEXT,
  audio_transcript TEXT,
  audio_language TEXT CHECK (audio_language IN ('fr', 'en')),
  tags TEXT[] NOT NULL DEFAULT '{}'::text[],
  is_private BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recipe_folders_org ON recipe_folders(organization_id);
CREATE INDEX IF NOT EXISTS idx_recipes_org ON recipes(organization_id);
CREATE INDEX IF NOT EXISTS idx_recipes_folder ON recipes(folder_id);
CREATE INDEX IF NOT EXISTS idx_recipes_updated ON recipes(updated_at DESC);

-- ---------------------------------------------------------------------------
-- Team invitations
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS organization_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  invited_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'staff', 'driver')),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (organization_id, email)
);

CREATE INDEX IF NOT EXISTS idx_org_invites_org_status
  ON organization_invitations(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_org_invites_token
  ON organization_invitations(token);

-- ---------------------------------------------------------------------------
-- Plans, subscriptions, upgrades
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS plan_definitions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_key TEXT NOT NULL UNIQUE CHECK (plan_key IN ('free', 'premium', 'enterprise')),
  name TEXT NOT NULL,
  price_fcfa INTEGER NOT NULL DEFAULT 0,
  price_eur_cents INTEGER NOT NULL DEFAULT 0,
  max_members INTEGER NOT NULL DEFAULT -1,
  max_orders_per_month INTEGER NOT NULL DEFAULT -1,
  max_products INTEGER NOT NULL DEFAULT -1,
  max_customers INTEGER NOT NULL DEFAULT -1,
  max_channels INTEGER NOT NULL DEFAULT -1,
  max_capacity_types INTEGER NOT NULL DEFAULT -1,
  has_unified_inbox BOOLEAN NOT NULL DEFAULT FALSE,
  has_realtime_tracking BOOLEAN NOT NULL DEFAULT FALSE,
  has_ai_replies BOOLEAN NOT NULL DEFAULT FALSE,
  has_api_access BOOLEAN NOT NULL DEFAULT FALSE,
  has_white_label BOOLEAN NOT NULL DEFAULT FALSE,
  has_advanced_reports BOOLEAN NOT NULL DEFAULT FALSE,
  has_custom_integrations BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS plan_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  plan_key TEXT NOT NULL DEFAULT 'free',
  member_count INTEGER NOT NULL DEFAULT 0,
  orders_this_month INTEGER NOT NULL DEFAULT 0,
  product_count INTEGER NOT NULL DEFAULT 0,
  customer_count INTEGER NOT NULL DEFAULT 0,
  channel_count INTEGER NOT NULL DEFAULT 0,
  capacity_type_count INTEGER NOT NULL DEFAULT 0,
  period_month DATE NOT NULL DEFAULT date_trunc('month', NOW())::DATE,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (organization_id, period_month)
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL UNIQUE REFERENCES organizations(id) ON DELETE CASCADE,
  plan_key TEXT NOT NULL DEFAULT 'free',
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('trialing', 'active', 'past_due', 'cancelled', 'paused')),
  billing_cycle TEXT NOT NULL DEFAULT 'monthly'
    CHECK (billing_cycle IN ('monthly', 'annual', 'lifetime')),
  current_period_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  current_period_end TIMESTAMPTZ,
  payment_provider TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS subscription_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS upgrade_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  target_plan TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'completed', 'rejected', 'cancelled')),
  payment_method TEXT,
  payment_reference TEXT,
  payment_proof_url TEXT,
  amount_fcfa INTEGER,
  notes TEXT,
  admin_notes TEXT,
  processed_at TIMESTAMPTZ,
  processed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_plan_usage_org ON plan_usage(organization_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_org ON subscriptions(organization_id);
CREATE INDEX IF NOT EXISTS idx_subscription_events_org ON subscription_events(organization_id);
CREATE INDEX IF NOT EXISTS idx_upgrade_requests_org_status ON upgrade_requests(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_upgrade_requests_created ON upgrade_requests(created_at DESC);

-- ---------------------------------------------------------------------------
-- Seed default plans
-- ---------------------------------------------------------------------------
INSERT INTO plan_definitions (
  plan_key, name, price_fcfa, price_eur_cents,
  max_members, max_orders_per_month, max_products, max_customers, max_channels, max_capacity_types,
  has_unified_inbox, has_realtime_tracking, has_ai_replies, has_api_access,
  has_white_label, has_advanced_reports, has_custom_integrations,
  is_active, sort_order
)
VALUES
(
  'free', 'Gratuit', 0, 0,
  2, 30, 20, 200, 2, 5,
  FALSE, FALSE, FALSE, FALSE,
  FALSE, FALSE, FALSE,
  TRUE, 1
),
(
  'premium', 'Premium', 60000, 10000,
  15, 500, 500, 5000, 10, 50,
  TRUE, TRUE, TRUE, FALSE,
  FALSE, TRUE, TRUE,
  TRUE, 2
),
(
  'enterprise', 'Sur Mesure', 0, 0,
  -1, -1, -1, -1, -1, -1,
  TRUE, TRUE, TRUE, TRUE,
  TRUE, TRUE, TRUE,
  TRUE, 3
)
ON CONFLICT (plan_key) DO UPDATE
SET
  name = EXCLUDED.name,
  price_fcfa = EXCLUDED.price_fcfa,
  price_eur_cents = EXCLUDED.price_eur_cents,
  max_members = EXCLUDED.max_members,
  max_orders_per_month = EXCLUDED.max_orders_per_month,
  max_products = EXCLUDED.max_products,
  max_customers = EXCLUDED.max_customers,
  max_channels = EXCLUDED.max_channels,
  max_capacity_types = EXCLUDED.max_capacity_types,
  has_unified_inbox = EXCLUDED.has_unified_inbox,
  has_realtime_tracking = EXCLUDED.has_realtime_tracking,
  has_ai_replies = EXCLUDED.has_ai_replies,
  has_api_access = EXCLUDED.has_api_access,
  has_white_label = EXCLUDED.has_white_label,
  has_advanced_reports = EXCLUDED.has_advanced_reports,
  has_custom_integrations = EXCLUDED.has_custom_integrations,
  is_active = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();

-- ---------------------------------------------------------------------------
-- Updated-at trigger helper
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_recipe_folders') THEN
    CREATE TRIGGER set_updated_at_recipe_folders
    BEFORE UPDATE ON recipe_folders
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_recipes') THEN
    CREATE TRIGGER set_updated_at_recipes
    BEFORE UPDATE ON recipes
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_plan_definitions') THEN
    CREATE TRIGGER set_updated_at_plan_definitions
    BEFORE UPDATE ON plan_definitions
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_plan_usage') THEN
    CREATE TRIGGER set_updated_at_plan_usage
    BEFORE UPDATE ON plan_usage
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_subscriptions') THEN
    CREATE TRIGGER set_updated_at_subscriptions
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_upgrade_requests') THEN
    CREATE TRIGGER set_updated_at_upgrade_requests
    BEFORE UPDATE ON upgrade_requests
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
ALTER TABLE recipe_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE upgrade_requests ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  -- recipe_folders
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='recipe_folders' AND policyname='View recipe_folders') THEN
    CREATE POLICY "View recipe_folders" ON recipe_folders
      FOR SELECT USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='recipe_folders' AND policyname='Manage recipe_folders') THEN
    CREATE POLICY "Manage recipe_folders" ON recipe_folders
      FOR ALL USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));
  END IF;

  -- recipes
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='recipes' AND policyname='View recipes') THEN
    CREATE POLICY "View recipes" ON recipes
      FOR SELECT USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='recipes' AND policyname='Manage recipes') THEN
    CREATE POLICY "Manage recipes" ON recipes
      FOR ALL USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));
  END IF;

  -- organization_invitations
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='organization_invitations' AND policyname='View organization_invitations') THEN
    CREATE POLICY "View organization_invitations" ON organization_invitations
      FOR SELECT USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='organization_invitations' AND policyname='Manage organization_invitations') THEN
    CREATE POLICY "Manage organization_invitations" ON organization_invitations
      FOR ALL USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));
  END IF;

  -- plan_definitions (global read for authenticated users)
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='plan_definitions' AND policyname='View plan_definitions') THEN
    CREATE POLICY "View plan_definitions" ON plan_definitions
      FOR SELECT USING (auth.role() IN ('authenticated', 'service_role'));
  END IF;

  -- plan_usage
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='plan_usage' AND policyname='View plan_usage') THEN
    CREATE POLICY "View plan_usage" ON plan_usage
      FOR SELECT USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='plan_usage' AND policyname='Manage plan_usage') THEN
    CREATE POLICY "Manage plan_usage" ON plan_usage
      FOR ALL USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));
  END IF;

  -- subscriptions
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='subscriptions' AND policyname='View subscriptions') THEN
    CREATE POLICY "View subscriptions" ON subscriptions
      FOR SELECT USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='subscriptions' AND policyname='Manage subscriptions') THEN
    CREATE POLICY "Manage subscriptions" ON subscriptions
      FOR ALL USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));
  END IF;

  -- subscription_events
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='subscription_events' AND policyname='View subscription_events') THEN
    CREATE POLICY "View subscription_events" ON subscription_events
      FOR SELECT USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='subscription_events' AND policyname='Manage subscription_events') THEN
    CREATE POLICY "Manage subscription_events" ON subscription_events
      FOR ALL USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));
  END IF;

  -- upgrade_requests
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='upgrade_requests' AND policyname='View upgrade_requests') THEN
    CREATE POLICY "View upgrade_requests" ON upgrade_requests
      FOR SELECT USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='upgrade_requests' AND policyname='Manage upgrade_requests') THEN
    CREATE POLICY "Manage upgrade_requests" ON upgrade_requests
      FOR ALL USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- Recipes bucket + policies
-- ---------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'recipes',
  'recipes',
  TRUE,
  15728640,
  ARRAY['image/jpeg','image/png','image/webp','image/gif','image/avif','image/heic','audio/webm','audio/mp3','audio/mpeg','audio/ogg','audio/wav','audio/mp4','audio/aac']
)
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='storage' AND tablename='objects' AND policyname='authenticated_upload_recipes'
  ) THEN
    CREATE POLICY "authenticated_upload_recipes" ON storage.objects
      FOR INSERT TO authenticated
      WITH CHECK (bucket_id = 'recipes');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='storage' AND tablename='objects' AND policyname='public_read_recipes'
  ) THEN
    CREATE POLICY "public_read_recipes" ON storage.objects
      FOR SELECT TO public
      USING (bucket_id = 'recipes');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='storage' AND tablename='objects' AND policyname='authenticated_update_recipes'
  ) THEN
    CREATE POLICY "authenticated_update_recipes" ON storage.objects
      FOR UPDATE TO authenticated
      USING (bucket_id = 'recipes');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='storage' AND tablename='objects' AND policyname='authenticated_delete_recipes'
  ) THEN
    CREATE POLICY "authenticated_delete_recipes" ON storage.objects
      FOR DELETE TO authenticated
      USING (bucket_id = 'recipes');
  END IF;
END $$;
