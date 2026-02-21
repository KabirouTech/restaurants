-- Phase 0: Infrastructure for unified messaging (WhatsApp, Instagram, Email)

-- Add missing columns
ALTER TABLE channels ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE channels ADD COLUMN IF NOT EXISTS name TEXT;

-- Indexes for customer lookup by channel identifier
CREATE INDEX IF NOT EXISTS idx_customers_org_phone ON customers(organization_id, phone);
CREATE INDEX IF NOT EXISTS idx_customers_org_email ON customers(organization_id, email);
CREATE INDEX IF NOT EXISTS idx_customers_org_instagram ON customers(organization_id, instagram_username);

-- Index for conversation thread lookup
CREATE INDEX IF NOT EXISTS idx_conversations_channel_thread ON conversations(channel_id, external_thread_id);

-- Index for active channels lookup
CREATE INDEX IF NOT EXISTS idx_channels_org_platform_active ON channels(organization_id, platform, is_active);
