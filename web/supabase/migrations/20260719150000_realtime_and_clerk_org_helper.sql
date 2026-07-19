-- Temps réel de l'inbox + compatibilité Clerk du helper my_org_id().
--
-- 1) my_org_id() résolvait le caller via `profiles.id = auth.uid()` — jamais
--    vrai avec un JWT Clerk (sub `user_…` non-UUID, le cast lève même une
--    erreur). Les policies de 11 tables l'utilisent (calendar_overrides,
--    capacity_types, channels, conversations, customers, defaults_calendar,
--    messages, order_items, orders, products, quotes) : les redéfinir n'est
--    pas nécessaire, on redéfinit la fonction sur le modèle clerk_sub()
--    (cf. 20260719140000) et toutes redeviennent effectives.
--
-- 2) La publication supabase_realtime était vide : aucun événement
--    postgres_changes n'était jamais émis — le ChatWindow s'abonnait dans le
--    vide. On publie messages (live des conversations) et conversations
--    (évolutions futures de la sidebar). Les événements restent filtrés par
--    la RLS de l'abonné.

CREATE OR REPLACE FUNCTION public.my_org_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS
$$ SELECT organization_id FROM profiles WHERE clerk_id = public.clerk_sub() LIMIT 1 $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'conversations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
  END IF;
END $$;
