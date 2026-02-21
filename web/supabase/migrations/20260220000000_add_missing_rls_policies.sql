-- Add missing RLS policies for conversations, messages, and channels
-- These tables had RLS enabled but no policies, blocking all authenticated access.

-- Conversations
CREATE POLICY "View conversations" ON conversations
  FOR SELECT USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Manage conversations" ON conversations
  FOR ALL USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

-- Messages (join through conversations to get org scope)
CREATE POLICY "View messages" ON messages
  FOR SELECT USING (
    conversation_id IN (
      SELECT id FROM conversations WHERE organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Manage messages" ON messages
  FOR ALL USING (
    conversation_id IN (
      SELECT id FROM conversations WHERE organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

-- Channels
CREATE POLICY "View channels" ON channels
  FOR SELECT USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Manage channels" ON channels
  FOR ALL USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

-- Expand channels platform check constraint to include 'website'
ALTER TABLE channels DROP CONSTRAINT IF EXISTS channels_platform_check;
ALTER TABLE channels ADD CONSTRAINT channels_platform_check
  CHECK (platform IN ('whatsapp', 'instagram', 'messenger', 'email', 'website'));
