-- Platform tutorials (manage Arcade embeds from admin)
CREATE TABLE platform_tutorials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    embed_code TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: read-only for authenticated users (active tutorials)
-- Write via service role only (admin server actions)
ALTER TABLE platform_tutorials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read_active_tutorials" ON platform_tutorials FOR SELECT
  USING (auth.role() = 'authenticated' AND is_active = true);
