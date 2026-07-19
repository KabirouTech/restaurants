-- Ré-application partielle de 20260310153000_add_missing_runtime_tables.sql.
--
-- Comme 20260221000000 (cf. 20260719120000), cette migration figurait dans
-- l'historique en prod mais n'avait été que partiellement exécutée. Manquaient :
-- colonnes (plan_definitions.updated_at, profiles.fcm_token,
-- recipe_folders.sort_order, subscription_events.payload/created_by,
-- upgrade_requests.updated_at), la fonction set_updated_at() et ses triggers,
-- et 10 index. Conséquences visibles : demandes d'upgrade et événements
-- d'abonnement en échec, notifications push impossibles.
--
-- Volontairement exclus (faux positifs de l'audit) :
--   - plan_usage.* : plan_usage est une VUE en prod, pas une table
--   - idx_profiles_clerk_id_unique : supprimé exprès par 20260310172000
--   - trigger set_updated_at_recipes : recipes a déjà recipes_updated_at
--
-- Statements idempotents ; appliqué manuellement en prod le 2026-07-19.

ALTER TABLE plan_definitions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS fcm_token TEXT;
ALTER TABLE recipe_folders ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;
ALTER TABLE subscription_events ADD COLUMN IF NOT EXISTS payload JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE subscription_events ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE upgrade_requests ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $fn$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$fn$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_recipe_folders') THEN
    CREATE TRIGGER set_updated_at_recipe_folders BEFORE UPDATE ON recipe_folders
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_plan_definitions') THEN
    CREATE TRIGGER set_updated_at_plan_definitions BEFORE UPDATE ON plan_definitions
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_subscriptions') THEN
    CREATE TRIGGER set_updated_at_subscriptions BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_upgrade_requests') THEN
    CREATE TRIGGER set_updated_at_upgrade_requests BEFORE UPDATE ON upgrade_requests
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_recipe_folders_org ON recipe_folders(organization_id);
CREATE INDEX IF NOT EXISTS idx_recipes_org ON recipes(organization_id);
CREATE INDEX IF NOT EXISTS idx_recipes_folder ON recipes(folder_id);
CREATE INDEX IF NOT EXISTS idx_recipes_updated ON recipes(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_org_invites_org_status ON organization_invitations(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_org_invites_token ON organization_invitations(token);
CREATE INDEX IF NOT EXISTS idx_subscriptions_org ON subscriptions(organization_id);
CREATE INDEX IF NOT EXISTS idx_subscription_events_org ON subscription_events(organization_id);
CREATE INDEX IF NOT EXISTS idx_upgrade_requests_org_status ON upgrade_requests(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_upgrade_requests_created ON upgrade_requests(created_at DESC);
