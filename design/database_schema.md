# Database Schema Design for "Restautants" Platform

This schema is designed for PostgreSQL (compatible with Supabase) to support the "Restautants" platform, a SaaS OS for caterers.

## Core Concepts & Architectural Decisions

1.  **Multi-tenancy**: The schema is designed with a `organizations` table at the root. All major tables (orders, customers, products, etc.) will have an `organization_id` foreign key for row-level security (RLS).
2.  **Capacity Management**: Implements a "Load Unit" system to handle dynamic constraints (e.g., "2 weddings OR 10 cocktails").
3.  **Unified Inbox**: Designed for high-volume message ingestion via webhooks, separating raw data ingestion from processed message storage.

---

## 1. Authentication & Users (Supabase Auth Integration)

We extend the default `auth.users` from Supabase with a public `profiles` table.

### `organizations`
Represents the caterer/restaurant using the SaaS.
- `id`: UUID (PK)
- `name`: Text
- `slug`: Text (unique, for public URL)
- `created_at`: Typesptz
- `subscription_plan`: Text ('free', 'pro')
- `settings`: JSONB (branding, currency, timezone, etc.)

### `profiles` (Users)
Staff members managing the platform.
- `id`: UUID (PK, references `auth.users.id`)
- `organization_id`: UUID (FK `organizations.id`)
- `full_name`: Text
- `role`: Text ('admin', 'staff', 'driver')
- `avatar_url`: Text

---

## 2. Capacity & Calendar Management (The Core Engine)

This system solves the "2 Weddings OR 10 Cocktails" constraint problem using a weighted resource model.

### `capacity_types` (or Event Types)
Defines the types of events and their "weight" or "load cost".
- `id`: UUID (PK)
- `organization_id`: UUID (FK)
- `name`: Text (e.g., "Wedding", "Cocktail Dinner", "Lunch Box")
- `load_cost`: Integer (e.g., Wedding = 50, Cocktail = 10)
- `color_code`: Text (for UI calendar)

### `defaults_calendar`
Sets the standard operating capacity per day of the week.
- `id`: UUID (PK)
- `organization_id`: UUID (FK)
- `day_of_week`: Integer (0-6, Sunday-Saturday)
- `max_daily_load`: Integer (e.g., 100)
- `is_open`: Boolean

### `calendar_overrides` (The "Capacities" requirement)
Handles specific dates, blocking dates (vacations), or adjusting capacity for special occasions.
- `id`: UUID (PK)
- `organization_id`: UUID (FK)
- `date`: Date (Indexed)
- `override_max_load`: Integer (Optional. If null, uses default)
- `is_blocked`: Boolean (default false)
- `reason`: Text (e.g., "Holiday", "Private Event")

### logic connection to `orders`
The `orders` table will link to `capacity_types`. The application logic (or a Postgres Function/Trigger) will calculate:
`sum(capacity_types.load_cost) WHERE date = X` vs `calendar_overrides.override_max_load OR defaults_calendar.max_daily_load`.

---

## 3. Order Management

### `orders`
The central transaction record.
- `id`: UUID (PK)
- `organization_id`: UUID (FK)
- `customer_id`: UUID (FK `customers.id`)
- `conversation_id`: UUID (Optional FK `conversations.id`) - Link to Inbox
- `capacity_type_id`: UUID (FK `capacity_types.id`) - Determines resource usage
- `status`: Text ('draft', 'pending_approval', 'confirmed', 'paid', 'preparing', 'delivered', 'cancelled')
- `event_date`: Date (Indexed) - Critical for capacity check
- `event_time`: Time
- `guest_count`: Integer
- `total_amount_cents`: Integer
- `deposit_paid_cents`: Integer
- `delivery_address`: JSONB
- `internal_notes`: Text

### `order_items`
- `id`: UUID (PK)
- `order_id`: UUID (FK)
- `product_id`: UUID (FK)
- `quantity`: Integer
- `unit_price_cents`: Integer
- `customizations`: JSONB (options chosen)

---

## 4. Product Catalog

### `products`
- `id`: UUID (PK)
- `organization_id`: UUID (FK)
- `name`: Text
- `description`: Text
- `price_cents`: Integer
- `category`: Text
- `image_url`: Text
- `is_active`: Boolean

---

## 5. Unified Inbox (CRM & Communication)

Designed to ingest messages from multiple sources (WhatsApp, Instagram, Email) via Webhooks (Make.com/Twilio).

### `customers`
- `id`: UUID (PK)
- `organization_id`: UUID (FK)
- `full_name`: Text
- `email`: Text
- `phone`: Text
- `instagram_username`: Text
- `tags`: Text[] (e.g., 'VIP', 'Wedding Lead')
- `notes`: Text

### `channels`
Represents connected integrations.
- `id`: UUID (PK)
- `organization_id`: UUID (FK)
- `platform`: Text ('whatsapp', 'instagram', 'messenger', 'email')
- `provider_id`: Text (e.g., Twilio Number ID, Meta Page ID)
- `credentials`: JSONB (Encrypted API keys/Tokens)

### `conversations`
Groups messages into threads.
- `id`: UUID (PK)
- `organization_id`: UUID (FK)
- `customer_id`: UUID (FK)
- `channel_id`: UUID (FK)
- `external_thread_id`: Text (e.g., WhatsApp phone number, Instagram thread ID)
- `status`: Text ('open', 'snoozed', 'closed')
- `assigned_to`: UUID (FK `profiles.id`) - "Statut de lecture/qui a répondu"
- `last_message_at`: Timestamptz
- `unread_count`: Integer

### `messages`
Individual messages.
- `id`: UUID (PK)
- `conversation_id`: UUID (FK)
- `sender_type`: Text ('customer', 'agent', 'system')
- `content`: Text
- `attachments`: JSONB[] (URLs to images/docs)
- `external_message_id`: Text (Unique ID from provider to prevent dupes)
- `api_response`: JSONB (Store raw response from provider for debugging)
- `created_at`: Timestamptz
- `read_at`: Timestamptz

### `webhook_events` (Raw Data Log)
Crucial for reliability. We ingest everything here first, then process.
- `id`: UUID (PK)
- `provider`: Text ('stripe', 'twilio', 'meta')
- `payload`: JSONB
- `status`: Text ('pending', 'processed', 'failed')
- `error_log`: Text
- `created_at`: Timestamptz (Default NOW())

---

## 6. Drafts & Quotes

### `quotes` (Devis)
Since orders might start as discussions.
- `id`: UUID (PK)
- `organization_id`: UUID (FK)
- `customer_id`: UUID (FK)
- `items`: JSONB (Snapshot of items)
- `valid_until`: Date
- `pdf_url`: Text
- `status`: Text ('sent', 'accepted', 'rejected')
- `converted_to_order_id`: UUID (FK `orders.id`)

---

## SQL Snippet for `Capacity` Logic (Conceptual)

```sql
-- View to calculate daily load
CREATE VIEW daily_load_usage AS
SELECT
  o.organization_id,
  o.event_date,
  SUM(ct.load_cost) as current_load
FROM orders o
JOIN capacity_types ct ON o.capacity_type_id = ct.id
WHERE o.status NOT IN ('cancelled', 'draft')
GROUP BY o.organization_id, o.event_date;

-- Function to check availability
CREATE FUNCTION check_availability(org_id UUID, check_date DATE, new_load_cost INT)
RETURNS BOOLEAN AS $$
DECLARE
  current_usage INT;
  max_limit INT;
  override_limit INT;
  default_limit INT;
BEGIN
  -- Get current usage
  SELECT COALESCE(current_load, 0) INTO current_usage
  FROM daily_load_usage
  WHERE organization_id = org_id AND event_date = check_date;

  -- Check for overrides
  SELECT override_max_load INTO override_limit
  FROM calendar_overrides
  WHERE organization_id = org_id AND date = check_date;

  -- Get default if no override
  IF override_limit IS NULL THEN
    SELECT max_daily_load INTO default_limit
    FROM defaults_calendar
    WHERE organization_id = org_id AND day_of_week = EXTRACT(DOW FROM check_date);
    max_limit := default_limit;
  ELSE
    max_limit := override_limit;
  END IF;

  RETURN (current_usage + new_load_cost) <= max_limit;
END;
$$ LANGUAGE plpgsql;
```
