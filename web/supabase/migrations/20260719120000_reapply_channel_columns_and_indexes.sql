-- Ré-application de 20260221000000_add_channel_indexes.sql.
--
-- Cette migration figurait dans supabase_migrations.schema_migrations en prod
-- mais son DDL n'avait jamais été exécuté (baseline/repair sans exécution) :
-- channels.is_active et channels.name manquaient, ainsi que les 5 index — le
-- finalize des canaux échouait avec « Could not find the 'is_active' column of
-- 'channels' in the schema cache ». Statements idempotents, sans danger pour
-- les environnements déjà corrects. Appliqué manuellement en prod le
-- 2026-07-19 ; ce fichier fait converger les autres environnements et
-- l'historique.

ALTER TABLE channels ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE channels ADD COLUMN IF NOT EXISTS name TEXT;

CREATE INDEX IF NOT EXISTS idx_customers_org_phone ON customers(organization_id, phone);
CREATE INDEX IF NOT EXISTS idx_customers_org_email ON customers(organization_id, email);
CREATE INDEX IF NOT EXISTS idx_customers_org_instagram ON customers(organization_id, instagram_username);
CREATE INDEX IF NOT EXISTS idx_conversations_channel_thread ON conversations(channel_id, external_thread_id);
CREATE INDEX IF NOT EXISTS idx_channels_org_platform_active ON channels(organization_id, platform, is_active);
