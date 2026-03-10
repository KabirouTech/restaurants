-- Add missing RPC functions required by the app runtime.
-- These functions are intentionally SECURITY DEFINER because they are used from
-- browser-authenticated clients and need controlled access across multiple tables.

-- ---------------------------------------------------------------------------
-- check_availability(org, date, load_cost)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.check_availability(
  p_org_id UUID,
  p_check_date DATE,
  p_new_load_cost INT DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_usage INT := 0;
  v_max_limit INT := 0;
  v_override_limit INT;
  v_default_limit INT;
  v_is_blocked BOOLEAN := FALSE;
  v_is_open BOOLEAN := TRUE;
  v_day_of_week INT;
BEGIN
  -- 1) Calendar override (blocked day or custom limit)
  SELECT is_blocked, override_max_load
  INTO v_is_blocked, v_override_limit
  FROM calendar_overrides
  WHERE organization_id = p_org_id
    AND date = p_check_date
  LIMIT 1;

  IF COALESCE(v_is_blocked, FALSE) THEN
    RETURN jsonb_build_object(
      'available', FALSE,
      'reason', 'blocked_date',
      'current_load', 0,
      'max_limit', 0,
      'remaining', 0
    );
  END IF;

  -- 2) Max capacity for that date
  IF v_override_limit IS NOT NULL THEN
    v_max_limit := v_override_limit;
  ELSE
    v_day_of_week := EXTRACT(DOW FROM p_check_date);

    SELECT max_daily_load, is_open
    INTO v_default_limit, v_is_open
    FROM defaults_calendar
    WHERE organization_id = p_org_id
      AND day_of_week = v_day_of_week
    LIMIT 1;

    IF COALESCE(v_is_open, FALSE) = FALSE THEN
      RETURN jsonb_build_object(
        'available', FALSE,
        'reason', 'closed_day',
        'current_load', 0,
        'max_limit', 0,
        'remaining', 0
      );
    END IF;

    v_max_limit := COALESCE(v_default_limit, 0);
  END IF;

  -- 3) Current load from active orders
  SELECT COALESCE(SUM(ct.load_cost), 0)::INT
  INTO v_current_usage
  FROM orders o
  JOIN capacity_types ct ON ct.id = o.capacity_type_id
  WHERE o.organization_id = p_org_id
    AND o.event_date = p_check_date
    AND COALESCE(o.status, '') NOT IN ('cancelled', 'draft', 'rejected');

  RETURN jsonb_build_object(
    'available', (v_current_usage + COALESCE(p_new_load_cost, 0)) <= v_max_limit,
    'current_load', v_current_usage,
    'max_limit', v_max_limit,
    'remaining', v_max_limit - v_current_usage
  );
END;
$$;

-- ---------------------------------------------------------------------------
-- check_plan_limit(org, resource)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.check_plan_limit(
  p_org_id UUID,
  p_resource TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan TEXT := 'free';
  v_current INT := 0;
  v_limit INT := -1;
  v_allowed BOOLEAN := TRUE;
  v_unlimited BOOLEAN := TRUE;
  v_percentage NUMERIC := 0;
BEGIN
  SELECT COALESCE(subscription_plan, 'free')
  INTO v_plan
  FROM organizations
  WHERE id = p_org_id;

  IF v_plan IS NULL THEN
    v_plan := 'free';
  END IF;

  CASE p_resource
    WHEN 'orders' THEN
      SELECT COUNT(*)::INT
      INTO v_current
      FROM orders
      WHERE organization_id = p_org_id
        AND date_trunc('month', created_at) = date_trunc('month', NOW());

      SELECT max_orders_per_month
      INTO v_limit
      FROM plan_definitions
      WHERE plan_key = v_plan
      LIMIT 1;

    WHEN 'members' THEN
      SELECT COUNT(*)::INT
      INTO v_current
      FROM profiles
      WHERE organization_id = p_org_id
        AND COALESCE(status, 'active') = 'active';

      SELECT max_members
      INTO v_limit
      FROM plan_definitions
      WHERE plan_key = v_plan
      LIMIT 1;

    WHEN 'products' THEN
      SELECT COUNT(*)::INT
      INTO v_current
      FROM products
      WHERE organization_id = p_org_id;

      SELECT max_products
      INTO v_limit
      FROM plan_definitions
      WHERE plan_key = v_plan
      LIMIT 1;

    WHEN 'customers' THEN
      SELECT COUNT(*)::INT
      INTO v_current
      FROM customers
      WHERE organization_id = p_org_id;

      SELECT max_customers
      INTO v_limit
      FROM plan_definitions
      WHERE plan_key = v_plan
      LIMIT 1;

    WHEN 'channels' THEN
      SELECT COUNT(*)::INT
      INTO v_current
      FROM channels
      WHERE organization_id = p_org_id
        AND COALESCE(is_active, TRUE) = TRUE;

      SELECT max_channels
      INTO v_limit
      FROM plan_definitions
      WHERE plan_key = v_plan
      LIMIT 1;

    WHEN 'capacity_types' THEN
      SELECT COUNT(*)::INT
      INTO v_current
      FROM capacity_types
      WHERE organization_id = p_org_id;

      SELECT max_capacity_types
      INTO v_limit
      FROM plan_definitions
      WHERE plan_key = v_plan
      LIMIT 1;

    ELSE
      RETURN jsonb_build_object(
        'allowed', TRUE,
        'current', 0,
        'limit', -1,
        'remaining', -1,
        'unlimited', TRUE,
        'percentage', 0,
        'plan', v_plan,
        'resource', p_resource
      );
  END CASE;

  v_unlimited := v_limit IS NULL OR v_limit < 0;

  IF v_unlimited THEN
    v_allowed := TRUE;
    v_limit := -1;
  ELSE
    -- check is used before creating a new resource: equal to limit => blocked
    v_allowed := v_current < v_limit;
    v_percentage := CASE
      WHEN v_limit > 0 THEN ROUND((v_current::NUMERIC / v_limit::NUMERIC) * 100, 2)
      ELSE 0
    END;
  END IF;

  RETURN jsonb_build_object(
    'allowed', v_allowed,
    'current', v_current,
    'limit', v_limit,
    'remaining', CASE WHEN v_unlimited THEN -1 ELSE GREATEST(v_limit - v_current, 0) END,
    'unlimited', v_unlimited,
    'percentage', v_percentage,
    'plan', v_plan,
    'resource', p_resource
  );
END;
$$;

-- ---------------------------------------------------------------------------
-- accept_invitation(token, user_id)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.accept_invitation(
  p_token TEXT,
  p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inv organization_invitations%ROWTYPE;
  v_limit JSONB;
BEGIN
  IF COALESCE(auth.role(), '') <> 'service_role'
     AND auth.uid() IS DISTINCT FROM p_user_id THEN
    RETURN jsonb_build_object('success', FALSE, 'reason', 'forbidden');
  END IF;

  SELECT *
  INTO v_inv
  FROM organization_invitations
  WHERE token = p_token
    AND status = 'pending'
    AND expires_at > NOW()
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_inv.id IS NULL THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'reason', 'invitation_not_found_or_expired'
    );
  END IF;

  v_limit := public.check_plan_limit(v_inv.organization_id, 'members');

  IF COALESCE((v_limit ->> 'allowed')::BOOLEAN, TRUE) = FALSE THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'reason', 'member_limit_reached',
      'upgrade_required', TRUE
    );
  END IF;

  INSERT INTO profiles (id, organization_id, role, status, invited_by, created_at)
  VALUES (
    p_user_id,
    v_inv.organization_id,
    v_inv.role,
    'active',
    v_inv.invited_by,
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
  SET
    organization_id = EXCLUDED.organization_id,
    role = EXCLUDED.role,
    status = 'active',
    invited_by = EXCLUDED.invited_by;

  UPDATE organization_invitations
  SET
    status = 'accepted',
    accepted_at = NOW()
  WHERE id = v_inv.id;

  RETURN jsonb_build_object(
    'success', TRUE,
    'organization_id', v_inv.organization_id,
    'role', v_inv.role
  );
END;
$$;

-- ---------------------------------------------------------------------------
-- upgrade_organization_plan(org, new_plan, triggered_by, payment...)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.upgrade_organization_plan(
  p_org_id UUID,
  p_new_plan TEXT,
  p_triggered_by UUID,
  p_payment_reference TEXT DEFAULT NULL,
  p_payment_provider TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old_plan TEXT;
  v_now TIMESTAMPTZ := NOW();
BEGIN
  IF COALESCE(auth.role(), '') <> 'service_role' THEN
    IF auth.uid() IS NULL
       OR NOT EXISTS (
         SELECT 1
         FROM profiles
         WHERE id = auth.uid()
           AND COALESCE(is_super_admin, FALSE) = TRUE
       ) THEN
      RETURN jsonb_build_object('success', FALSE, 'reason', 'forbidden');
    END IF;
  END IF;

  SELECT subscription_plan
  INTO v_old_plan
  FROM organizations
  WHERE id = p_org_id;

  IF v_old_plan IS NULL THEN
    RETURN jsonb_build_object('success', FALSE, 'reason', 'organization_not_found');
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM plan_definitions
    WHERE plan_key = p_new_plan
      AND COALESCE(is_active, TRUE) = TRUE
  ) THEN
    RETURN jsonb_build_object('success', FALSE, 'reason', 'invalid_plan');
  END IF;

  UPDATE organizations
  SET subscription_plan = p_new_plan
  WHERE id = p_org_id;

  UPDATE subscriptions
  SET
    plan_key = p_new_plan,
    status = 'active',
    billing_cycle = COALESCE(billing_cycle, 'monthly'),
    current_period_start = v_now,
    current_period_end = v_now + INTERVAL '1 month',
    payment_provider = p_payment_provider,
    updated_at = v_now
  WHERE organization_id = p_org_id;

  IF NOT FOUND THEN
    INSERT INTO subscriptions (
      organization_id,
      plan_key,
      status,
      billing_cycle,
      current_period_start,
      current_period_end,
      payment_provider,
      created_at,
      updated_at
    )
    VALUES (
      p_org_id,
      p_new_plan,
      'active',
      'monthly',
      v_now,
      v_now + INTERVAL '1 month',
      p_payment_provider,
      v_now,
      v_now
    );
  END IF;

  INSERT INTO subscription_events (
    organization_id,
    event_type,
    payload,
    created_by,
    created_at
  )
  VALUES (
    p_org_id,
    'plan_upgraded',
    jsonb_build_object(
      'from_plan', v_old_plan,
      'to_plan', p_new_plan,
      'payment_reference', p_payment_reference,
      'payment_provider', p_payment_provider
    ),
    p_triggered_by,
    v_now
  );

  UPDATE plan_usage
  SET
    plan_key = p_new_plan,
    updated_at = v_now
  WHERE organization_id = p_org_id
    AND period_month = date_trunc('month', v_now)::DATE;

  IF NOT FOUND THEN
    INSERT INTO plan_usage (
      organization_id,
      plan_key,
      member_count,
      orders_this_month,
      product_count,
      customer_count,
      channel_count,
      capacity_type_count,
      period_month,
      updated_at
    )
    VALUES (
      p_org_id,
      p_new_plan,
      0,
      0,
      0,
      0,
      0,
      0,
      date_trunc('month', v_now)::DATE,
      v_now
    );
  END IF;

  RETURN jsonb_build_object(
    'success', TRUE,
    'organization_id', p_org_id,
    'old_plan', v_old_plan,
    'new_plan', p_new_plan
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'reason', SQLERRM
    );
END;
$$;

-- ---------------------------------------------------------------------------
-- Ensure complaints storage bucket + policies
-- ---------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'complaints',
  'complaints',
  TRUE,
  10485760,
  ARRAY[
    'image/jpeg','image/png','image/webp','image/gif',
    'audio/webm','audio/mp3','audio/mpeg','audio/ogg','audio/wav','audio/mp4','audio/aac'
  ]
)
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'authenticated_upload_complaints'
  ) THEN
    CREATE POLICY "authenticated_upload_complaints" ON storage.objects
      FOR INSERT TO authenticated
      WITH CHECK (bucket_id = 'complaints');
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'public_read_complaints'
  ) THEN
    CREATE POLICY "public_read_complaints" ON storage.objects
      FOR SELECT TO public
      USING (bucket_id = 'complaints');
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'authenticated_update_complaints'
  ) THEN
    CREATE POLICY "authenticated_update_complaints" ON storage.objects
      FOR UPDATE TO authenticated
      USING (bucket_id = 'complaints');
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'authenticated_delete_complaints'
  ) THEN
    CREATE POLICY "authenticated_delete_complaints" ON storage.objects
      FOR DELETE TO authenticated
      USING (bucket_id = 'complaints');
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------
REVOKE ALL ON FUNCTION public.check_availability(UUID, DATE, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_availability(UUID, DATE, INT) TO anon, authenticated, service_role;

REVOKE ALL ON FUNCTION public.check_plan_limit(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_plan_limit(UUID, TEXT) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.accept_invitation(TEXT, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.accept_invitation(TEXT, UUID) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.upgrade_organization_plan(UUID, TEXT, UUID, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.upgrade_organization_plan(UUID, TEXT, UUID, TEXT, TEXT) TO authenticated, service_role;
