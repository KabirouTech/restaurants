-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ORG & USERS
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    subscription_plan TEXT DEFAULT 'free',
    settings JSONB DEFAULT '{}'::jsonb
);

CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    organization_id UUID REFERENCES organizations(id),
    full_name TEXT,
    role TEXT CHECK (role IN ('admin', 'staff', 'driver')),
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- CAPACITY & CALENDAR

CREATE TABLE capacity_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) NOT NULL,
    name TEXT NOT NULL, -- "Wedding", "Cocktail"
    load_cost INTEGER NOT NULL, -- 50, 10
    color_code TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE defaults_calendar (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) NOT NULL,
    day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sunday
    max_daily_load INTEGER NOT NULL,
    is_open BOOLEAN DEFAULT TRUE,
    UNIQUE(organization_id, day_of_week)
);

CREATE TABLE calendar_overrides (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) NOT NULL,
    date DATE NOT NULL,
    override_max_load INTEGER,
    is_blocked BOOLEAN DEFAULT FALSE,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, date)
);

-- CRM / INBOX

CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) NOT NULL,
    full_name TEXT,
    email TEXT,
    phone TEXT,
    instagram_username TEXT,
    tags TEXT[],
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE channels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) NOT NULL,
    platform TEXT CHECK (platform IN ('whatsapp', 'instagram', 'messenger', 'email')),
    provider_id TEXT, -- Twilio SID, etc.
    credentials JSONB, -- Encrypted keys
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) NOT NULL,
    customer_id UUID REFERENCES customers(id),
    channel_id UUID REFERENCES channels(id),
    external_thread_id TEXT,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'snoozed', 'closed')),
    assigned_to UUID REFERENCES profiles(id),
    last_message_at TIMESTAMPTZ DEFAULT NOW(),
    unread_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID REFERENCES conversations(id) NOT NULL,
    sender_type TEXT CHECK (sender_type IN ('customer', 'agent', 'system')),
    content TEXT,
    attachments JSONB[],
    external_message_id TEXT,
    api_response JSONB,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE webhook_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider TEXT,
    payload JSONB,
    status TEXT DEFAULT 'pending',
    error_log TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ORDERS & CATALOG

CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    price_cents INTEGER NOT NULL,
    category TEXT,
    image_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) NOT NULL,
    customer_id UUID REFERENCES customers(id),
    conversation_id UUID REFERENCES conversations(id),
    capacity_type_id UUID REFERENCES capacity_types(id), -- Key for load calculation
    status TEXT DEFAULT 'draft',
    event_date DATE NOT NULL,
    event_time TIME,
    guest_count INTEGER,
    total_amount_cents INTEGER,
    deposit_paid_cents INTEGER,
    delivery_address JSONB,
    internal_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) NOT NULL,
    product_id UUID REFERENCES products(id),
    quantity INTEGER NOT NULL,
    unit_price_cents INTEGER NOT NULL,
    customizations JSONB
);

CREATE TABLE quotes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) NOT NULL,
    customer_id UUID REFERENCES customers(id),
    items JSONB,
    valid_until DATE,
    pdf_url TEXT,
    status TEXT DEFAULT 'sent',
    converted_to_order_id UUID REFERENCES orders(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- VIEWS & FUNCTIONS

-- View to calculate daily load
CREATE OR REPLACE VIEW daily_load_usage AS
SELECT
  o.organization_id,
  o.event_date,
  COALESCE(SUM(ct.load_cost), 0) as current_load
FROM orders o
JOIN capacity_types ct ON o.capacity_type_id = ct.id
WHERE o.status NOT IN ('cancelled', 'draft', 'rejected')
GROUP BY o.organization_id, o.event_date;

-- Function to check availability (RPC callable from Supabase client)
CREATE OR REPLACE FUNCTION check_availability(
    p_org_id UUID, 
    p_check_date DATE, 
    p_new_load_cost INT default 0
)
RETURNS JSONB AS $$
DECLARE
  v_current_usage INT;
  v_max_limit INT;
  v_override_limit INT;
  v_default_limit INT;
  v_is_blocked BOOLEAN;
  v_day_of_week INT;
BEGIN
  -- 1. Check if blocked
  SELECT is_blocked, override_max_load INTO v_is_blocked, v_override_limit
  FROM calendar_overrides
  WHERE organization_id = p_org_id AND date = p_check_date;

  IF v_is_blocked THEN
    RETURN jsonb_build_object('available', false, 'reason', 'blocked_date');
  END IF;

  -- 2. Determine Max Limit
  IF v_override_limit IS NOT NULL THEN
    v_max_limit := v_override_limit;
  ELSE
    v_day_of_week := EXTRACT(DOW FROM p_check_date);
    
    SELECT max_daily_load INTO v_default_limit
    FROM defaults_calendar
    WHERE organization_id = p_org_id AND day_of_week = v_day_of_week;
    
    -- If no default set for that day, assume closed or 0 capacity? Let's assume 0 if missing.
    v_max_limit := COALESCE(v_default_limit, 0);
  END IF;

  -- 3. Get Current Usage
  SELECT current_load INTO v_current_usage
  FROM daily_load_usage
  WHERE organization_id = p_org_id AND event_date = p_check_date;
  
  -- Handle null if no orders yet
  v_current_usage := COALESCE(v_current_usage, 0);

  -- 4. Calculate Remaining
  RETURN jsonb_build_object(
    'available', (v_current_usage + p_new_load_cost) <= v_max_limit,
    'current_load', v_current_usage,
    'max_limit', v_max_limit,
    'remaining', v_max_limit - v_current_usage
  );
END;
$$ LANGUAGE plpgsql;

-- RLS POLICIES (Simplified for specific Organization)
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
-- (In a real app, you would add policies like 'auth.uid() IN (select id from profiles where organization_id = ...)')

---- SEED DATA FOR DEMO ----
-- Inserting a demo organization to make the app usable immediately
DO $$
DECLARE
  v_org_id UUID := 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'; -- FIXED ID FOR DEMO
  v_ct_wedding UUID;
  v_ct_cocktail UUID;
BEGIN
  -- 1. Create Org
  INSERT INTO organizations (id, name, slug, subscription_plan)
  VALUES (v_org_id, 'Traiteur Démo', 'demo-traiteur', 'pro')
  ON CONFLICT (id) DO NOTHING; -- Idempotent

  -- 2. Create Capacity Types
  INSERT INTO capacity_types (organization_id, name, load_cost) VALUES (v_org_id, 'Grand Mariage', 50) RETURNING id INTO v_ct_wedding;
  INSERT INTO capacity_types (organization_id, name, load_cost) VALUES (v_org_id, 'Cocktail Dînatoire', 10) RETURNING id INTO v_ct_cocktail;
  INSERT INTO capacity_types (organization_id, name, load_cost) VALUES (v_org_id, 'Plateau Repas', 1);

  -- 3. Set Defaults (Open Mon-Sat, Closed Sun)
  INSERT INTO defaults_calendar (organization_id, day_of_week, max_daily_load, is_open) VALUES 
  (v_org_id, 1, 100, true), -- Mon
  (v_org_id, 2, 100, true), -- Tue
  (v_org_id, 3, 100, true), -- Wed
  (v_org_id, 4, 100, true), -- Thu
  (v_org_id, 5, 100, true), -- Fri
  (v_org_id, 6, 200, true) -- Sat (Bigger capacity)
  ON CONFLICT (organization_id, day_of_week) DO NOTHING;

END $$;
