-- Super admin flag on profiles
ALTER TABLE profiles ADD COLUMN is_super_admin BOOLEAN DEFAULT false;

-- Active/inactive status on organizations
ALTER TABLE organizations ADD COLUMN is_active BOOLEAN DEFAULT true;

-- Platform banners (replace hardcoded "Menu de Saison")
CREATE TABLE platform_banners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    link_url TEXT,
    is_active BOOLEAN DEFAULT true,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Platform announcements (bar at top of dashboard)
CREATE TABLE platform_announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info' CHECK (type IN ('info', 'warning', 'success')),
    is_active BOOLEAN DEFAULT true,
    dismissible BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: read-only for authenticated users (active banners + announcements)
-- Write via service role only (admin server actions)
ALTER TABLE platform_banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read_active_banners" ON platform_banners FOR SELECT
  USING (auth.role() = 'authenticated' AND is_active = true
    AND (start_date IS NULL OR start_date <= NOW())
    AND (end_date IS NULL OR end_date >= NOW()));

CREATE POLICY "read_active_announcements" ON platform_announcements FOR SELECT
  USING (auth.role() = 'authenticated' AND is_active = true);
