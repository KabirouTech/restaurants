-- Enhance announcements with scheduling, links, priority, styling
ALTER TABLE platform_announcements ADD COLUMN IF NOT EXISTS link_url TEXT;
ALTER TABLE platform_announcements ADD COLUMN IF NOT EXISTS link_label TEXT;
ALTER TABLE platform_announcements ADD COLUMN IF NOT EXISTS starts_at TIMESTAMPTZ;
ALTER TABLE platform_announcements ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
ALTER TABLE platform_announcements ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 0;
ALTER TABLE platform_announcements ADD COLUMN IF NOT EXISTS emoji TEXT;
ALTER TABLE platform_announcements ADD COLUMN IF NOT EXISTS animation TEXT DEFAULT 'none';

-- Drop old CHECK on type to allow more color options
ALTER TABLE platform_announcements DROP CONSTRAINT IF EXISTS platform_announcements_type_check;
ALTER TABLE platform_announcements ADD CONSTRAINT platform_announcements_type_check
  CHECK (type IN ('info', 'warning', 'success', 'error', 'purple', 'pink', 'teal', 'dark',
    'gradient-sunset', 'gradient-ocean', 'gradient-royal', 'gradient-emerald'));

-- Position & display format
ALTER TABLE platform_announcements ADD COLUMN IF NOT EXISTS position TEXT DEFAULT 'top';
ALTER TABLE platform_announcements ADD COLUMN IF NOT EXISTS display_format TEXT DEFAULT 'bar';

ALTER TABLE platform_announcements ADD CONSTRAINT platform_announcements_position_check
  CHECK (position IN ('top', 'bottom', 'floating-br', 'floating-bl'));
ALTER TABLE platform_announcements ADD CONSTRAINT platform_announcements_display_format_check
  CHECK (display_format IN ('bar', 'banner', 'card', 'popup'));

-- Update RLS policy to also check date range
DROP POLICY IF EXISTS "read_active_announcements" ON platform_announcements;
CREATE POLICY "read_active_announcements" ON platform_announcements FOR SELECT
  USING (
    auth.role() = 'authenticated'
    AND is_active = true
    AND (starts_at IS NULL OR starts_at <= NOW())
    AND (expires_at IS NULL OR expires_at >= NOW())
  );
