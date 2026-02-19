-- Enable RLS on all tables if not already (redundant but safe)
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE capacity_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE defaults_calendar ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can view/edit their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Organizations: Users can view their own organization (via profile)
CREATE POLICY "Users can view own organization" ON organizations
  FOR SELECT USING (
    id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
  );

-- Helper function to get current user's org id (optional optimization, but subquery is fine)

-- General RLS Policy for filtering by Organization ID
-- Applies to: capacity_types, defaults_calendar, calendar_overrides, customers, channels, 
-- conversations, messages, products, orders, order_items, quotes

-- Capacity Types
CREATE POLICY "View capacity_types" ON capacity_types
  FOR SELECT USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Manage capacity_types" ON capacity_types
  FOR ALL USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

-- Defaults Calendar
CREATE POLICY "View defaults_calendar" ON defaults_calendar
  FOR SELECT USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Manage defaults_calendar" ON defaults_calendar
  FOR ALL USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

-- Calendar Overrides
CREATE POLICY "View calendar_overrides" ON calendar_overrides
  FOR SELECT USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Manage calendar_overrides" ON calendar_overrides
  FOR ALL USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

-- Customers
CREATE POLICY "View customers" ON customers
  FOR SELECT USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Manage customers" ON customers
  FOR ALL USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

-- Products
CREATE POLICY "View products" ON products
  FOR SELECT USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Manage products" ON products
  FOR ALL USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

-- Orders
CREATE POLICY "View orders" ON orders
  FOR SELECT USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "Manage orders" ON orders
  FOR ALL USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

-- Order Items (Indirectly via order -> organization check, or explicit organization_id not present on items?)
-- order_items table has `order_id`, but NOT `organization_id`.
-- So we must check via order_id.
CREATE POLICY "View order_items" ON order_items
  FOR SELECT USING (
    order_id IN (
      SELECT id FROM orders WHERE organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
      )
    )
  );
  
CREATE POLICY "Manage order_items" ON order_items
  FOR ALL USING (
    order_id IN (
      SELECT id FROM orders WHERE organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

-- Allow service_role full access (implicitly true, but good to remember policies don't block it)
