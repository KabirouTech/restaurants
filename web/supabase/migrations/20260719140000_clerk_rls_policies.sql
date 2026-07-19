-- RLS compatible Clerk (third-party auth).
--
-- Depuis la migration Clerk, les JWT côté navigateur portent un `sub` Clerk
-- (`user_…`, TEXT) : les policies historiques `profiles.id = auth.uid()` ne
-- peuvent plus jamais matcher (auth.uid() caste sub en UUID). Tout accès
-- Supabase RLS depuis le navigateur était donc aveugle ou en échec.
--
-- Ce fichier :
--   1. crée des helpers qui résolvent le caller via profiles.clerk_id ;
--   2. réécrit les 21 policies auth.uid() sur ce modèle (semantique conservée,
--      resserrées TO authenticated) ;
--   3. remplace la policy "Public profiles are viewable by everyone"
--      (USING true, y compris anon → fuite emails/téléphones/tokens FCM) par
--      une lecture scoper à l'organisation du caller.
--
-- Prérequis runtime (dashboards, une fois) :
--   - Clerk : activer l'intégration Supabase (claim "role": "authenticated")
--   - Supabase : Authentication → Third-Party Auth → Clerk
--     (domaine https://clerk.restaurantsos.store)
--
-- Sans ces prérequis, ces policies échouent proprement (caller anon) — état
-- identique à aujourd'hui, aucune régression.

-- ---------------------------------------------------------------------------
-- Helpers identité Clerk
-- ---------------------------------------------------------------------------

-- Sub Clerk du caller (claim JWT), null si non authentifié.
CREATE OR REPLACE FUNCTION public.clerk_sub()
RETURNS text LANGUAGE sql STABLE AS
$$ SELECT nullif(auth.jwt()->>'sub', '') $$;

-- Profil / org / rôle du caller. SECURITY DEFINER : profiles est elle-même
-- sous RLS, un sous-select direct dans chaque policy serait récursif. Ces
-- fonctions n'exposent que les identifiants du caller (dérivés de SON JWT).
CREATE OR REPLACE FUNCTION public.current_profile_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS
$$ SELECT id FROM profiles WHERE clerk_id = public.clerk_sub() LIMIT 1 $$;

CREATE OR REPLACE FUNCTION public.current_org_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS
$$ SELECT organization_id FROM profiles WHERE clerk_id = public.clerk_sub() LIMIT 1 $$;

CREATE OR REPLACE FUNCTION public.current_is_org_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS
$$ SELECT coalesce(
     (SELECT role = 'admin' FROM profiles WHERE clerk_id = public.clerk_sub() LIMIT 1),
     false
   ) $$;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
-- Renommage de policy: dropper aussi le nouveau nom pour rester idempotent
-- (le CI a échoué en re-jouant ce fichier déjà appliqué manuellement).
DROP POLICY IF EXISTS "Profiles viewable by own organization" ON profiles;
CREATE POLICY "Profiles viewable by own organization" ON profiles
  FOR SELECT TO authenticated
  USING (clerk_id = public.clerk_sub() OR organization_id = public.current_org_id());

DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT TO authenticated
  WITH CHECK (clerk_id = public.clerk_sub());

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE TO authenticated
  USING (clerk_id = public.clerk_sub())
  WITH CHECK (clerk_id = public.clerk_sub());

-- ---------------------------------------------------------------------------
-- organizations
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "Organizations are viewable by members" ON organizations;
CREATE POLICY "Organizations are viewable by members" ON organizations
  FOR SELECT TO authenticated
  USING (id = public.current_org_id());

-- ---------------------------------------------------------------------------
-- complaints
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS users_read_own_org ON complaints;
CREATE POLICY users_read_own_org ON complaints
  FOR SELECT TO authenticated
  USING (organization_id = public.current_org_id());

DROP POLICY IF EXISTS users_insert_own_org ON complaints;
CREATE POLICY users_insert_own_org ON complaints
  FOR INSERT TO authenticated
  WITH CHECK (
    organization_id = public.current_org_id()
    AND submitted_by = public.current_profile_id()
  );

-- ---------------------------------------------------------------------------
-- ingredients / suppliers / recipe_folders / recipes
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS "View ingredients" ON ingredients;
CREATE POLICY "View ingredients" ON ingredients
  FOR SELECT TO authenticated
  USING (organization_id = public.current_org_id());

DROP POLICY IF EXISTS "Manage ingredients" ON ingredients;
CREATE POLICY "Manage ingredients" ON ingredients
  FOR ALL TO authenticated
  USING (organization_id = public.current_org_id())
  WITH CHECK (organization_id = public.current_org_id());

DROP POLICY IF EXISTS "View suppliers" ON suppliers;
CREATE POLICY "View suppliers" ON suppliers
  FOR SELECT TO authenticated
  USING (organization_id = public.current_org_id());

DROP POLICY IF EXISTS "Manage suppliers" ON suppliers;
CREATE POLICY "Manage suppliers" ON suppliers
  FOR ALL TO authenticated
  USING (organization_id = public.current_org_id())
  WITH CHECK (organization_id = public.current_org_id());

DROP POLICY IF EXISTS recipe_folders_org_access ON recipe_folders;
CREATE POLICY recipe_folders_org_access ON recipe_folders
  FOR ALL TO authenticated
  USING (organization_id = public.current_org_id())
  WITH CHECK (organization_id = public.current_org_id());

DROP POLICY IF EXISTS "Members can view their org recipes" ON recipes;
CREATE POLICY "Members can view their org recipes" ON recipes
  FOR SELECT TO authenticated
  USING (organization_id = public.current_org_id());

DROP POLICY IF EXISTS "Members can insert recipes" ON recipes;
CREATE POLICY "Members can insert recipes" ON recipes
  FOR INSERT TO authenticated
  WITH CHECK (organization_id = public.current_org_id());

DROP POLICY IF EXISTS "Members can update their org recipes" ON recipes;
CREATE POLICY "Members can update their org recipes" ON recipes
  FOR UPDATE TO authenticated
  USING (organization_id = public.current_org_id())
  WITH CHECK (organization_id = public.current_org_id());

DROP POLICY IF EXISTS "Members can delete their org recipes" ON recipes;
CREATE POLICY "Members can delete their org recipes" ON recipes
  FOR DELETE TO authenticated
  USING (organization_id = public.current_org_id());

-- ---------------------------------------------------------------------------
-- organization_invitations (réservé aux admins de l'org)
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS invites_select_admin ON organization_invitations;
CREATE POLICY invites_select_admin ON organization_invitations
  FOR SELECT TO authenticated
  USING (organization_id = public.current_org_id() AND public.current_is_org_admin());

DROP POLICY IF EXISTS invites_insert_admin ON organization_invitations;
CREATE POLICY invites_insert_admin ON organization_invitations
  FOR INSERT TO authenticated
  WITH CHECK (
    organization_id = public.current_org_id()
    AND public.current_is_org_admin()
    AND invited_by = public.current_profile_id()
  );

DROP POLICY IF EXISTS invites_update_admin ON organization_invitations;
CREATE POLICY invites_update_admin ON organization_invitations
  FOR UPDATE TO authenticated
  USING (organization_id = public.current_org_id() AND public.current_is_org_admin())
  WITH CHECK (organization_id = public.current_org_id() AND public.current_is_org_admin());

-- ---------------------------------------------------------------------------
-- subscriptions / subscription_events / upgrade_requests
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS subs_select_own_org ON subscriptions;
CREATE POLICY subs_select_own_org ON subscriptions
  FOR SELECT TO authenticated
  USING (organization_id = public.current_org_id());

DROP POLICY IF EXISTS sub_events_select ON subscription_events;
CREATE POLICY sub_events_select ON subscription_events
  FOR SELECT TO authenticated
  USING (organization_id = public.current_org_id());

DROP POLICY IF EXISTS upgrade_req_select ON upgrade_requests;
CREATE POLICY upgrade_req_select ON upgrade_requests
  FOR SELECT TO authenticated
  USING (organization_id = public.current_org_id());

DROP POLICY IF EXISTS upgrade_req_insert ON upgrade_requests;
CREATE POLICY upgrade_req_insert ON upgrade_requests
  FOR INSERT TO authenticated
  WITH CHECK (
    organization_id = public.current_org_id()
    AND requested_by = public.current_profile_id()
  );
